//
//  SplitTabApp.swift
//  SplitTab
//
//  Main application entry point
//

import SwiftUI

@main
struct SplitTabApp: App {
    // MARK: - State Objects
    @StateObject private var authViewModel = AuthenticationViewModel()
    @StateObject private var themeManager = ThemeManager()

    // MARK: - App Delegate
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authViewModel)
                .environmentObject(themeManager)
                .preferredColorScheme(themeManager.colorScheme)
                .onAppear {
                    setupApp()
                }
        }
    }

    // MARK: - Setup
    private func setupApp() {
        // Configure appearance
        setupAppearance()

        // Configure networking
        NetworkManager.shared.configure()

        // Restore authentication state
        Task {
            await authViewModel.restoreAuthenticationState()
        }
    }

    private func setupAppearance() {
        // Configure navigation bar appearance
        let appearance = UINavigationBarAppearance()
        appearance.configureWithDefaultBackground()
        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance

        // Configure tab bar appearance
        let tabBarAppearance = UITabBarAppearance()
        tabBarAppearance.configureWithDefaultBackground()
        UITabBar.appearance().standardAppearance = tabBarAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance
    }
}
