//
//  ProfileView.swift
//  SplitTab
//
//  User profile view
//

import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @State private var showEditProfile = false
    @State private var showChangePassword = false
    @State private var showLogoutAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Profile Header
                    if let user = authViewModel.currentUser {
                        VStack(spacing: 16) {
                            // Avatar
                            ZStack {
                                Circle()
                                    .fill(LinearGradient(
                                        colors: [.blue, .purple],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ))
                                    .frame(width: 100, height: 100)

                                if let imageUrl = user.profilePictureUrl, let url = URL(string: imageUrl) {
                                    AsyncImage(url: url) { image in
                                        image
                                            .resizable()
                                            .scaledToFill()
                                    } placeholder: {
                                        Text(getUserInitials(user))
                                            .font(.system(size: 36, weight: .semibold))
                                            .foregroundColor(.white)
                                    }
                                    .frame(width: 100, height: 100)
                                    .clipShape(Circle())
                                } else {
                                    Text(getUserInitials(user))
                                        .font(.system(size: 36, weight: .semibold))
                                        .foregroundColor(.white)
                                }
                            }

                            // Name and Email
                            VStack(spacing: 4) {
                                Text(user.name)
                                    .font(.title2)
                                    .fontWeight(.bold)

                                Text(user.email)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }

                            // Verification Badges
                            HStack(spacing: 8) {
                                if user.emailVerified {
                                    Badge(text: "Email Verified", color: .green)
                                }
                                if user.phoneVerified {
                                    Badge(text: "Phone Verified", color: .green)
                                }
                                if user.twoFactorEnabled {
                                    Badge(text: "2FA Enabled", color: .blue)
                                }
                            }
                        }
                        .padding(.vertical)

                        Divider()

                        // Profile Sections
                        VStack(spacing: 0) {
                            // Account Information
                            SectionHeader(title: "ACCOUNT")

                            ProfileItem(
                                icon: "person.fill",
                                title: "Edit Profile",
                                color: .blue
                            ) {
                                showEditProfile = true
                            }

                            ProfileItem(
                                icon: "lock.fill",
                                title: "Change Password",
                                color: .orange
                            ) {
                                showChangePassword = true
                            }

                            Divider()
                                .padding(.leading, 60)

                            // Preferences
                            SectionHeader(title: "PREFERENCES")

                            ProfileItem(
                                icon: "dollarsign.circle.fill",
                                title: "Default Currency",
                                value: user.defaultCurrency,
                                color: .green
                            )

                            ProfileItem(
                                icon: "globe",
                                title: "Language",
                                value: user.language.uppercased(),
                                color: .purple
                            )

                            ProfileItem(
                                icon: "clock.fill",
                                title: "Timezone",
                                value: user.timezone,
                                color: .indigo
                            )

                            Divider()
                                .padding(.leading, 60)

                            // Security
                            SectionHeader(title: "SECURITY")

                            ProfileItem(
                                icon: "shield.fill",
                                title: "Two-Factor Authentication",
                                value: user.twoFactorEnabled ? "Enabled" : "Disabled",
                                color: .red
                            )

                            // Connected Accounts
                            if user.googleId != nil || user.appleId != nil {
                                SectionHeader(title: "CONNECTED ACCOUNTS")

                                if user.googleId != nil {
                                    ProfileItem(
                                        icon: "globe",
                                        title: "Google",
                                        value: "Connected",
                                        color: .blue
                                    )
                                }

                                if user.appleId != nil {
                                    ProfileItem(
                                        icon: "applelogo",
                                        title: "Apple",
                                        value: "Connected",
                                        color: .black
                                    )
                                }
                            }

                            Divider()
                                .padding(.leading, 60)

                            // Logout
                            Button(action: {
                                showLogoutAlert = true
                            }) {
                                HStack {
                                    Image(systemName: "arrow.right.square.fill")
                                        .foregroundColor(.red)
                                        .frame(width: 30)

                                    Text("Logout")
                                        .foregroundColor(.red)

                                    Spacer()
                                }
                                .padding()
                                .background(Color(.systemBackground))
                            }
                        }
                    }

                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Profile")
            .sheet(isPresented: $showEditProfile) {
                if let user = authViewModel.currentUser {
                    EditProfileView(user: user)
                        .environmentObject(authViewModel)
                }
            }
            .sheet(isPresented: $showChangePassword) {
                ChangePasswordView()
                    .environmentObject(authViewModel)
            }
            .alert("Logout", isPresented: $showLogoutAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Logout", role: .destructive) {
                    Task {
                        await authViewModel.logout()
                    }
                }
            } message: {
                Text("Are you sure you want to logout?")
            }
        }
    }

    private func getUserInitials(_ user: User) -> String {
        let names = user.name.split(separator: " ")
        if names.count >= 2 {
            return String(names[0].prefix(1) + names[1].prefix(1)).uppercased()
        } else if let first = names.first {
            return String(first.prefix(2)).uppercased()
        }
        return "U"
    }
}

// MARK: - Supporting Views

struct Badge: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.caption2)
            .fontWeight(.medium)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.2))
            .foregroundColor(color)
            .cornerRadius(4)
    }
}

struct SectionHeader: View {
    let title: String

    var body: some View {
        Text(title)
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundColor(.secondary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal)
            .padding(.top, 16)
            .padding(.bottom, 8)
    }
}

struct ProfileItem: View {
    let icon: String
    let title: String
    var value: String? = nil
    let color: Color
    var action: (() -> Void)? = nil

    var body: some View {
        Button(action: {
            action?()
        }) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .frame(width: 30)

                Text(title)
                    .foregroundColor(.primary)

                Spacer()

                if let value = value {
                    Text(value)
                        .foregroundColor(.secondary)
                }

                if action != nil {
                    Image(systemName: "chevron.right")
                        .foregroundColor(.secondary)
                        .font(.caption)
                }
            }
            .padding()
            .background(Color(.systemBackground))
        }
        .buttonStyle(.plain)
        .disabled(action == nil)
    }
}

// MARK: - Edit Profile View

struct EditProfileView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authViewModel: AuthenticationViewModel

    let user: User

    @State private var name: String
    @State private var phoneNumber: String
    @State private var defaultCurrency: String
    @State private var language: String
    @State private var timezone: String

    @State private var isLoading = false

    init(user: User) {
        self.user = user
        _name = State(initialValue: user.name)
        _phoneNumber = State(initialValue: user.phoneNumber ?? "")
        _defaultCurrency = State(initialValue: user.defaultCurrency)
        _language = State(initialValue: user.language)
        _timezone = State(initialValue: user.timezone)
    }

    var body: some View {
        NavigationView {
            Form {
                Section("Personal Information") {
                    TextField("Name", text: $name)
                    TextField("Phone Number", text: $phoneNumber)
                        .keyboardType(.phonePad)
                }

                Section("Preferences") {
                    TextField("Currency", text: $defaultCurrency)
                        .textInputAutocapitalization(.characters)

                    TextField("Language", text: $language)
                    TextField("Timezone", text: $timezone)
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveProfile()
                    }
                    .disabled(isLoading || !isValid)
                }
            }
        }
    }

    private var isValid: Bool {
        Validators.isValidName(name) &&
        (phoneNumber.isEmpty || phoneNumber.count >= 10) &&
        defaultCurrency.count == 3
    }

    private func saveProfile() {
        isLoading = true

        Task {
            do {
                let update = UserProfileUpdate(
                    name: name != user.name ? name : nil,
                    phoneNumber: phoneNumber != user.phoneNumber ? phoneNumber : nil,
                    defaultCurrency: defaultCurrency != user.defaultCurrency ? defaultCurrency : nil,
                    timezone: timezone != user.timezone ? timezone : nil,
                    language: language != user.language ? language : nil
                )

                try await NetworkManager.shared.requestEmpty(
                    .updateProfile,
                    method: .patch,
                    body: update,
                    requiresAuth: true
                )

                // Refresh user data
                await authViewModel.refreshUser

                isLoading = false
                dismiss()
            } catch {
                isLoading = false
                authViewModel.errorMessage = error.localizedDescription
            }
        }
    }
}

// MARK: - Change Password View

struct ChangePasswordView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authViewModel: AuthenticationViewModel

    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            Form {
                Section("Current Password") {
                    SecureField("Current Password", text: $currentPassword)
                }

                Section("New Password") {
                    SecureField("New Password", text: $newPassword)
                    SecureField("Confirm Password", text: $confirmPassword)

                    if !newPassword.isEmpty {
                        PasswordStrengthView(password: newPassword)
                    }
                }

                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Change Password")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        changePassword()
                    }
                    .disabled(isLoading || !isValid)
                }
            }
        }
    }

    private var isValid: Bool {
        !currentPassword.isEmpty &&
        Validators.isValidPassword(newPassword) &&
        newPassword == confirmPassword &&
        currentPassword != newPassword
    }

    private func changePassword() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                try await AuthenticationService.shared.changePassword(
                    currentPassword: currentPassword,
                    newPassword: newPassword
                )

                isLoading = false
                dismiss()
            } catch {
                isLoading = false
                errorMessage = error.localizedDescription
            }
        }
    }
}

struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView()
            .environmentObject(AuthenticationViewModel())
    }
}
