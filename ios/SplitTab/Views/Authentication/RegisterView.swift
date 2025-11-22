//
//  RegisterView.swift
//  SplitTab
//
//  Registration view
//

import SwiftUI
import AuthenticationServices

struct RegisterView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @Binding var showLogin: Bool

    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var acceptTerms = false

    var body: some View {
        ScrollView {
            VStack(spacing: 30) {
                // Logo and title
                VStack(spacing: 16) {
                    Image(systemName: "dollarsign.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.white)

                    Text("Create Account")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)

                    Text("Sign up to get started")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.9))
                }
                .padding(.top, 40)

                // Registration form
                VStack(spacing: 20) {
                    // Name field
                    TextField("Full Name", text: $name)
                        .textContentType(.name)
                        .autocapitalization(.words)
                        .padding()
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(10)

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
                        .textContentType(.newPassword)
                        .padding()
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(10)

                    // Password strength indicator
                    if !password.isEmpty {
                        PasswordStrengthView(password: password)
                    }

                    // Confirm password field
                    SecureField("Confirm Password", text: $confirmPassword)
                        .textContentType(.newPassword)
                        .padding()
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(10)

                    // Terms and conditions
                    HStack(alignment: .top, spacing: 10) {
                        Toggle(isOn: $acceptTerms) {
                            EmptyView()
                        }
                        .toggleStyle(CheckboxToggleStyle())
                        .labelsHidden()

                        Text("I agree to the Terms & Conditions and Privacy Policy")
                            .font(.footnote)
                            .foregroundColor(.white.opacity(0.9))
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.horizontal)

                    // Register button
                    Button(action: register) {
                        if authViewModel.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .blue))
                        } else {
                            Text("Sign Up")
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
                        // Google Sign Up
                        Button(action: signUpWithGoogle) {
                            HStack {
                                Image(systemName: "globe")
                                Text("Sign up with Google")
                                    .fontWeight(.medium)
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white.opacity(0.2))
                            .cornerRadius(10)
                        }
                        .disabled(authViewModel.isLoading)

                        // Apple Sign Up
                        SignInWithAppleButton(
                            .signUp,
                            onRequest: { request in
                                request.requestedScopes = [.fullName, .email]
                            },
                            onCompletion: { result in
                                handleAppleSignUp(result)
                            }
                        )
                        .signInWithAppleButtonStyle(.white)
                        .frame(height: 50)
                        .cornerRadius(10)
                    }

                    // Login link
                    HStack {
                        Text("Already have an account?")
                            .foregroundColor(.white.opacity(0.9))
                        Button("Login") {
                            showLogin = true
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
    }

    // MARK: - Actions

    private func register() {
        Task {
            await authViewModel.register(email: email, password: password, name: name)
        }
    }

    private func signUpWithGoogle() {
        // Google Sign-Up implementation
        // In production, integrate Google Sign-In SDK
        Task {
            authViewModel.errorMessage = "Google Sign-Up coming soon"
        }
    }

    private func handleAppleSignUp(_ result: Result<ASAuthorization, Error>) {
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
                    // User canceled the sign-up flow
                    break
                case .failed:
                    authViewModel.errorMessage = "Apple Sign-Up failed"
                case .invalidResponse:
                    authViewModel.errorMessage = "Invalid response from Apple"
                case .notHandled:
                    authViewModel.errorMessage = "Apple Sign-Up not handled"
                case .unknown:
                    authViewModel.errorMessage = "Unknown error occurred"
                @unknown default:
                    authViewModel.errorMessage = "Apple Sign-Up error"
                }
            } else {
                authViewModel.errorMessage = error.localizedDescription
            }
        }
    }

    // MARK: - Validation

    private var isFormValid: Bool {
        Validators.isValidName(name) &&
        Validators.isValidEmail(email) &&
        Validators.isValidPassword(password) &&
        password == confirmPassword &&
        acceptTerms
    }
}

struct PasswordStrengthView: View {
    let password: String

    private var strength: Validators.PasswordStrength {
        Validators.passwordStrength(password)
    }

    var body: some View {
        HStack {
            Text("Password Strength:")
                .font(.caption)
                .foregroundColor(.white.opacity(0.9))

            Text(strength.text)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(strength.color)

            Spacer()

            HStack(spacing: 4) {
                ForEach(0..<3) { index in
                    Rectangle()
                        .fill(strengthColor(for: index))
                        .frame(width: 30, height: 4)
                        .cornerRadius(2)
                }
            }
        }
        .padding(.horizontal)
    }

    private func strengthColor(for index: Int) -> Color {
        switch strength {
        case .weak:
            return index == 0 ? .red : .gray.opacity(0.3)
        case .medium:
            return index <= 1 ? .orange : .gray.opacity(0.3)
        case .strong:
            return strength.color
        }
    }
}

struct ForgotPasswordView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authViewModel: AuthenticationViewModel

    @State private var email = ""
    @State private var showSuccess = false

    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Text("Enter your email address and we'll send you a link to reset your password")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding()

                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(10)
                    .padding(.horizontal)

                Button(action: sendResetLink) {
                    if authViewModel.isLoading {
                        ProgressView()
                    } else {
                        Text("Send Reset Link")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
                .padding(.horizontal)
                .disabled(authViewModel.isLoading || !Validators.isValidEmail(email))

                Spacer()
            }
            .navigationTitle("Forgot Password")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Email Sent", isPresented: $showSuccess) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text("Please check your email for password reset instructions")
            }
        }
    }

    private func sendResetLink() {
        Task {
            let success = await authViewModel.forgotPassword(email: email)
            if success {
                showSuccess = true
            }
        }
    }
}
