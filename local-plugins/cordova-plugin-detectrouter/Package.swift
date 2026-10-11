// swift-tools-version:5.9
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

import PackageDescription

// Cordova iOS 8+ consumes this plugin through Swift Package Manager. At prepare
// time cordova-ios copies the plugin under `platforms/ios/packages/` and rewrites
// the `cordova-ios` dependency below to point at its local checkout, then adds a
// dependency + product reference (named after the plugin id) to the generated
// `cordova-ios-plugins` package.
let package = Package(
    name: "cordova-plugin-detectrouter",
    platforms: [
        .iOS(.v13),
        .macCatalyst(.v13)
    ],
    products: [
        .library(name: "cordova-plugin-detectrouter", targets: ["cordova-plugin-detectrouter"])
    ],
    dependencies: [
        // Rewritten to a local path by cordova-ios at prepare time; the branch is
        // only used when the package is built standalone.
        .package(url: "https://github.com/apache/cordova-ios.git", branch: "master")
    ],
    targets: [
        .target(
            name: "cordova-plugin-detectrouter",
            dependencies: [
                .product(name: "Cordova", package: "cordova-ios")
            ],
            path: "src/ios"
        )
    ]
)