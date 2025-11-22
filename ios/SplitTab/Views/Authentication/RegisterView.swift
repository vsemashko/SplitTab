//
//  RegisterView.swift
//  SplitTab
//
//  Registration view
//

import SwiftUI

struct RegisterView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @Binding var showLogin: Bool

    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""

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

                    // Terms and conditions
                    Text("By signing up, you agree to our Terms & Conditions and Privacy Policy")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)

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

    // MARK: - Validation

    private var isFormValid: Bool {
        Validators.isValidName(name) &&
        Validators.isValidEmail(email) &&
        Validators.isValidPassword(password) &&
        password == confirmPassword
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
