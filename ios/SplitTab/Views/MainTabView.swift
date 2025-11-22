//
//  MainTabView.swift
//  SplitTab
//
//  Main tab bar navigation
//

import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            // Home / Dashboard
            NavigationView {
                DashboardView()
            }
            .tabItem {
                Label("Home", systemImage: "house.fill")
            }
            .tag(0)

            // Groups
            NavigationView {
                GroupsListView()
            }
            .tabItem {
                Label("Groups", systemImage: "person.3.fill")
            }
            .tag(1)

            // Add Expense (Center button)
            Color.clear
                .tabItem {
                    Label("Add", systemImage: "plus.circle.fill")
                }
                .tag(2)

            // Activity / Settlements
            NavigationView {
                ActivityView()
            }
            .tabItem {
                Label("Activity", systemImage: "clock.fill")
            }
            .tag(3)

            // Profile
            NavigationView {
                ProfileView()
            }
            .tabItem {
                Label("Profile", systemImage: "person.fill")
            }
            .tag(4)
        }
        .accentColor(.blue)
        .onChange(of: selectedTab) { newValue in
            if newValue == 2 {
                // Show add expense sheet
                selectedTab = 0 // Reset to home
                // Trigger add expense action
            }
        }
    }
}

struct MainTabView_Previews: PreviewProvider {
    static var previews: some View {
        MainTabView()
            .environmentObject(AuthenticationViewModel())
    }
}
