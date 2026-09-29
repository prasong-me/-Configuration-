// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "ConfigurationAppleProvider",
    platforms: [.macOS(.v15)],
    products: [
        .library(name: "ConfigurationAppleProvider", targets: ["ConfigurationAppleProvider"])
    ],
    targets: [
        .target(name: "ConfigurationNetworkExtensionShim", path: "apple-runtime-shim"),
        .target(name: "ConfigurationAppleProvider", dependencies: ["ConfigurationNetworkExtensionShim"], path: "apple-runtime"),
        .testTarget(name: "ConfigurationAppleProviderTests", dependencies: ["ConfigurationAppleProvider"], path: "apple-runtime-tests")
    ]
)
