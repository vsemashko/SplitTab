//
//  LoginView.swift
//  SplitTab
//
//  Login view
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @Binding var showRegister: Bool

    @State private var email = ""
    @State private var password = ""
    @State private var showForgotPassword = false

    var body: some View {
        ScrollView {
            VStack(spacing: 30) {
                // Logo and title
                VStack(spacing: 16) {
                    Image(systemName: "dollarsign.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.white)

                    Text("Welcome Back")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)

                    Text("Login to continue")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.9))
                }
                .padding(.top, 60)

                // Login form
                VStack(spacing: 20) {
                    // Email field
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                        .padding()
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(10)

                    // Password field
                    SecureField("Password", text: $password)
                        .textContentType(.password)
                        .padding()
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(10)

                    // Forgot password
                    HStack {
                        Spacer()
                        Button("Forgot Password?") {
                            showForgotPassword = true
                        }
                        .font(.footnote)
                        .foregroundColor(.white)
                    }

                    // Login button
                    Button(action: login) {
                        if authViewModel.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .blue))
                        } else {
                            Text("Login")
                                .fontWeight(.semibold)
                                .foregroundColor(.blue)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(10)
                    .disabled(authViewModel.isLoading || !isFormValid)

                    // Error message
                    if let error = authViewModel.errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding(.horizontal)
                    }

                    // Divider
                    HStack {
                        Rectangle()
                            .fill(Color.white.opacity(0.5))
                            .frame(height: 1)

                        Text("OR")
                            .foregroundColor(.white.opacity(0.9))
                            .font(.caption)

                        Rectangle()
                            .fill(Color.white.opacity(0.5))
                            .frame(height: 1)
                    }
                    .padding(.vertical)

                    // OAuth buttons
                    VStack(spacing: 12) {
                        // Google Sign In
                        Button(action: loginWithGoogle) {
                            HStack {
                                Image(systemName: "globe")
                                Text("Continue with Google")
                                    .fontWeight(.medium)
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white.opacity(0.2))
                            .cornerRadius(10)
                        }

                        // Apple Sign In
                        Button(action: loginWithApple) {
                            HStack {
                                Image(systemName: "applelogo")
                                Text("Continue with Apple")
                                    .fontWeight(.medium)
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white.opacity(0.2))
                            .cornerRadius(10)
                        }
                    }

                    // Register link
                    HStack {
                        Text("Don't have an account?")
                            .foregroundColor(.white.opacity(0.9))
                        Button("Sign Up") {
                            showRegister = false
                        }
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                    }
                    .padding(.top)
                }
                .padding(.horizontal, 30)

                Spacer()
            }
        }
        .sheet(isPresented: $showForgotPassword) {
            ForgotPasswordView()
        }
    }

    // MARK: - Actions

    private func login() {
        Task {
            await authViewModel.login(email: email, password: password)
        }
    }

    private func loginWithGoogle() {
        // Implement Google Sign In
    }

    private func loginWithApple() {
        // Implement Apple Sign In
    }

    // MARK: - Validation

    private var isFormValid: Bool {
        Validators.isValidEmail(email) && !password.isEmpty
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView(showRegister: .constant(true))
            .environmentObject(AuthenticationViewModel())
    }
}
