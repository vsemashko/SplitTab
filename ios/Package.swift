// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "SplitTab",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "SplitTab",
            targets: ["SplitTab"]
        ),
    ],
    dependencies: [
        // Add package dependencies here
        // Example: .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.8.0"),
    ],
    targets: [
        .target(
            name: "SplitTab",
            dependencies: []
        ),
        .testTarget(
            name: "SplitTabTests",
            dependencies: ["SplitTab"]
        ),
    ]
)
