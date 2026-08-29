package com.circusscientist.detectrouter;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.LinkProperties;
import android.net.Network;
import android.net.RouteInfo;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;
import java.util.List;
import java.util.Locale;

/**
 * Detects the router IP for the SmartPoi Discover scan — two cases:
 * 1. Hotspot/AP mode (phone IS the gateway): Android creates an AP interface
 *    (swlan0, ap0, wlan1, softap0...) whose IPv4 is the subnet the POIs live on.
 * 2. WiFi client on a normal router: return the default route's gateway IPv4,
 *    only when the route is on a WiFi (wlan*) interface so carrier gateways are
 *    never reported.
 * Mirrors za.tomjuggler.smartpoiudpextras.PoiState.detectRouterIp(ctx) in the
 * SmartPoi UDP Extras (Kotlin) app.
 */
public class DetectRouter extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        if ("detectRouterIp".equals(action)) {
            cordova.getThreadPool().execute(new Runnable() {
                @Override
                public void run() {
                    try {
                        String ip = detectRouterIp();
                        if (ip != null) {
                            callbackContext.success(ip);
                        } else {
                            callbackContext.error("no hotspot or router IP found");
                        }
                    } catch (Exception e) {
                        callbackContext.error(e.getMessage() != null ? e.getMessage() : "detect error");
                    }
                }
            });
            return true;
        }
        return false;
    }

    private String detectRouterIp() {
        // 1) hotspot / local-only hotspot: the phone is the AP
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            if (interfaces == null) return null;
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                String name = ni.getName().toLowerCase(Locale.US);
                if (name.contains("ap") || name.contains("swlan") || name.contains("wlan1") || name.contains("softap")) {
                    Enumeration<InetAddress> addrs = ni.getInetAddresses();
                    while (addrs.hasMoreElements()) {
                        InetAddress a = addrs.nextElement();
                        if (!a.isLoopbackAddress() && a instanceof Inet4Address) {
                            return a.getHostAddress();
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // fall through to the router gateway check
        }

        // 2) normal router: the default route's gateway on a WiFi interface
        try {
            Context ctx = cordova.getContext();
            ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return null;
            Network active = cm.getActiveNetwork();
            if (active == null) return null;
            LinkProperties lp = cm.getLinkProperties(active);
            if (lp == null) return null;
            List<RouteInfo> routes = lp.getRoutes();
            for (RouteInfo route : routes) {
                if (route.isDefaultRoute()) {
                    String iface = route.getInterface();
                    if (iface != null && iface.toLowerCase(Locale.US).contains("wlan")) {
                        InetAddress gw = route.getGateway();
                        if (gw != null && !gw.isLoopbackAddress() && gw instanceof Inet4Address) {
                            return gw.getHostAddress();
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // no permission / no network — caller shows a manual-entry hint
        }
        return null;
    }
}
