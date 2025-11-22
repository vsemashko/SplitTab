//
//  AuthenticationView.swift
//  SplitTab
//
//  Authentication container view
//

import SwiftUI

struct AuthenticationView: View {
    @State private var showLogin = true

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [Color.blue, Color.blue.opacity(0.7)]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            // Content
            if showLogin {
                LoginView(showRegister: $showLogin)
            } else {
                RegisterView(showLogin: $showLogin)
            }
        }
    }
}

struct AuthenticationView_Previews: PreviewProvider {
    static var previews: some View {
        AuthenticationView()
            .environmentObject(AuthenticationViewModel())
    }
}
