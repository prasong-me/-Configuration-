// swift-tools-version: 5.10
import PackageDescription
let package = Package(
    name: "ConfigurationAppleProvider",
    platforms: [.macOS(.v14)],
    products: [.library(name: "ConfigurationAppleProvider", targets: ["ConfigurationAppleProvider"])],
    targets: [
        .target(name: "ConfigurationAppleProvider", path: "apple-runtime"),
        .testTarget(name: "ConfigurationAppleProviderTests", dependencies: ["ConfigurationAppleProvider"], path: "apple-runtime-tests")
    ]
)
