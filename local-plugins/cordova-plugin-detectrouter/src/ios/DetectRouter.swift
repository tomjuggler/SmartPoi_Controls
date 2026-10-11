/*
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

import Foundation
import Darwin
import Network

#if canImport(Cordova)
import Cordova
#endif

/**
 * Detects the router IP for the SmartPoi Discover scan on iOS.
 *
 * This is the iOS counterpart of `src/android/DetectRouter.java`, which mirrors
 * `za.tomjuggler.smartpoiudpextras.PoiState.detectRouterIp()` in the SmartPoi
 * UDP Extras app. Two cases are handled, matching the Android behaviour:
 *
 * 1. Personal Hotspot / AP mode (this device *is* the gateway): iOS exposes the
 *    hotspot bridge interface (`bridge100`, legacy `ap1`, ...). Its IPv4 address
 *    is the subnet the POIs live on, so it is returned directly.
 * 2. Wi-Fi client on a normal router: the default route's gateway IPv4 is read
 *    from `NWPath.gateways` while pinned to the Wi-Fi interface, so cellular
 *    (carrier) gateways are never reported. If no gateway is available the
 *    device's own `en0` IPv4 is returned instead — the Discover scan derives
 *    the /24 from the first three octets, so both yield the same scan range.
 *
 * When neither can be resolved the error callback fires (matching Android); the
 * JavaScript layer in `www/network.js` then falls back to its WebRTC check and,
 * failing that, prompts for manual entry.
 */
@objc(DetectRouter)
class DetectRouter: CDVPlugin {

    /// Cordova entry point, invoked by
    /// `exec(success, error, 'DetectRouter', 'detectRouterIp', [])`.
    @objc(detectRouterIp:)
    func detectRouterIp(_ command: CDVInvokedUrlCommand) {
        // Detection blocks on the network stack, so keep it off the UI thread.
        self.commandDelegate.runInBackground {
            // Mirrors the Android order: hotspot/AP first, then the Wi-Fi gateway.
            var ip = self.hotspotIPv4()

            if ip == nil {
                ip = self.wifiGatewayIPv4()
            }
            if ip == nil {
                ip = self.interfaceIPv4(named: "en0")
            }

            let result: CDVPluginResult
            if let ip = ip {
                result = CDVPluginResult(status: .ok, messageAs: ip)
            } else {
                result = CDVPluginResult(status: .error, messageAs: "no hotspot or router IP found")
            }

            // sendPluginResult is documented as thread-safe, so it is fine to
            // call it here on the background thread.
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
    }

    // MARK: - Hotspot / AP mode

    /// IPv4 of the interface iOS uses when the device hosts a Personal Hotspot
    /// (`bridge100`, legacy `ap1`) or a Wi-Fi AP — mirrors the Android
    /// `swlan0/ap0/wlan1/softap0` check.
    private func hotspotIPv4() -> String? {
        return allIPv4Interfaces().first { entry in
            let name = entry.name.lowercased()
            return name.hasPrefix("bridge")
                || name.hasPrefix("ap")
                || name.contains("softap")
                || name.contains("swlan")
        }?.ip
    }

    // MARK: - Wi-Fi router gateway

    /// Thread-safe one-shot string holder. Using a reference type (instead of a
    /// captured `var`) keeps the escaping `pathUpdateHandler` closure free of
    /// shared mutable state.
    private final class OneShotString: @unchecked Sendable {
        private let lock = NSLock()
        private var value: String?

        func setIfEmpty(_ newValue: String) {
            lock.lock()
            if value == nil { value = newValue }
            lock.unlock()
        }

        var current: String? {
            lock.lock()
            defer { lock.unlock() }
            return value
        }
    }

    /// Default gateway of the Wi-Fi path (iOS 13+), or `nil` when unavailable.
    private func wifiGatewayIPv4() -> String? {
        // `NWPath.gateways` requires iOS 13. The app targets iOS 13+, but keep the
        // guard so the plugin also compiles on older (CocoaPods) deployment targets.
        guard #available(iOS 13.0, *) else { return nil }

        let monitor = NWPathMonitor(requiredInterfaceType: .wifi)
        let queue = DispatchQueue(label: "com.circusscientist.detectrouter.path")
        let semaphore = DispatchSemaphore(value: 0)
        let box = OneShotString()

        monitor.pathUpdateHandler = { path in
            guard let found = path.gateways.compactMap({ DetectRouter.ipv4(from: $0) }).first else {
                // No gateway on this update; keep waiting until the timeout.
                return
            }
            box.setIfEmpty(found)
            semaphore.signal()
        }

        monitor.start(queue: queue)
        _ = semaphore.wait(timeout: .now() + 1.5)
        monitor.cancel()

        return box.current
    }

    /// Extracts a dotted-decimal IPv4 address from a gateway `NWEndpoint`.
    private static func ipv4(from endpoint: NWEndpoint) -> String? {
        guard case let .hostPort(host, _) = endpoint else { return nil }
        guard case let .ipv4(address) = host else { return nil }

        let bytes = [UInt8](address.rawValue)
        guard bytes.count == 4 else { return nil }
        return bytes.map { String($0) }.joined(separator: ".")
    }

    // MARK: - Interface enumeration

    /// First IPv4 address assigned to the named interface (e.g. `en0` for Wi-Fi).
    private func interfaceIPv4(named target: String) -> String? {
        return allIPv4Interfaces().first { $0.name == target }?.ip
    }

    /// All (interface name, IPv4) pairs currently assigned to the device,
    /// excluding loopback addresses.
    private func allIPv4Interfaces() -> [(name: String, ip: String)] {
        var results: [(name: String, ip: String)] = []
        var interfaces: UnsafeMutablePointer<ifaddrs>?

        guard getifaddrs(&interfaces) == 0, let first = interfaces else {
            return results
        }
        defer { freeifaddrs(interfaces) }

        var cursor: UnsafeMutablePointer<ifaddrs>? = first
        while let current = cursor {
            let entry = current.pointee
            if let address = entry.ifa_addr, address.pointee.sa_family == sa_family_t(AF_INET) {
                var host = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                let length = socklen_t(address.pointee.sa_len)
                if getnameinfo(address, length, &host, socklen_t(host.count), nil, 0, NI_NUMERICHOST) == 0 {
                    let ip = String(cString: host)
                    if !ip.isEmpty && ip != "127.0.0.1" {
                        results.append((name: String(cString: entry.ifa_name), ip: ip))
                    }
                }
            }
            cursor = entry.ifa_next
        }

        return results
    }
}