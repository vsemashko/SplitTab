//
//  LoginView.swift
//  SplitTab
//
//  Login view
//

import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @Binding var showRegister: Bool

    @State private var email = ""
    @State private var password = ""
    @State private var rememberMe = false
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

                    // Remember me and Forgot password
                    HStack {
                        Toggle(isOn: $rememberMe) {
                            Text("Remember me")
                                .font(.footnote)
                                .foregroundColor(.white)
                        }
                        .toggleStyle(CheckboxToggleStyle())

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
                        .disabled(authViewModel.isLoading)

                        // Apple Sign In
                        SignInWithAppleButton(
                            .signIn,
                            onRequest: { request in
                                request.requestedScopes = [.fullName, .email]
                            },
                            onCompletion: { result in
                                handleAppleSignIn(result)
                            }
                        )
                        .signInWithAppleButtonStyle(.white)
                        .frame(height: 50)
                        .cornerRadius(10)
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
        // Google Sign-In implementation
        // In production, integrate Google Sign-In SDK
        Task {
            // Placeholder for Google OAuth flow
            authViewModel.errorMessage = "Google Sign-In coming soon"
        }
    }

    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let authorization):
            if let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential {
                // Get the user identifier token
                guard let identityToken = appleIDCredential.identityToken,
                      let tokenString = String(data: identityToken, encoding: .utf8) else {
                    authViewModel.errorMessage = "Failed to get Apple ID token"
                    return
                }

                // Pass the token to the view model
                Task {
                    await authViewModel.loginWithApple(token: tokenString)
                }
            }

        case .failure(let error):
            // Handle error
            if let authError = error as? ASAuthorizationError {
                switch authError.code {
                case .canceled:
                    // User canceled the sign-in flow
                    break
                case .failed:
                    authViewModel.errorMessage = "Apple Sign-In failed"
                case .invalidResponse:
                    authViewModel.errorMessage = "Invalid response from Apple"
                case .notHandled:
                    authViewModel.errorMessage = "Apple Sign-In not handled"
                case .unknown:
                    authViewModel.errorMessage = "Unknown error occurred"
                @unknown default:
                    authViewModel.errorMessage = "Apple Sign-In error"
                }
            } else {
                authViewModel.errorMessage = error.localizedDescription
            }
        }
    }

    // MARK: - Validation

    private var isFormValid: Bool {
        Validators.isValidEmail(email) && !password.isEmpty
    }
}

// MARK: - Custom Toggle Style for Checkbox

struct CheckboxToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack {
            Image(systemName: configuration.isOn ? "checkmark.square.fill" : "square")
                .foregroundColor(configuration.isOn ? .white : .white.opacity(0.7))
                .onTapGesture {
                    configuration.isOn.toggle()
                }

            configuration.label
        }
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView(showRegister: .constant(true))
            .environmentObject(AuthenticationViewModel())
    }
}
