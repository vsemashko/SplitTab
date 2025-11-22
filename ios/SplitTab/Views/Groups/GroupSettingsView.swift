//
//  GroupSettingsView.swift
//  SplitTab
//
//  Group Settings View
//

import SwiftUI

struct GroupSettingsView: View {
    @StateObject private var viewModel: GroupSettingsViewModel
    @Environment(\.dismiss) var dismiss
    @State private var showDeleteAlert = false
    @State private var showLeaveAlert = false
    @State private var showInviteSheet = false
    @State private var showError = false

    init(groupId: String) {
        _viewModel = StateObject(wrappedValue: GroupSettingsViewModel(groupId: groupId))
    }

    var body: some View {
        Form {
            if viewModel.isLoading {
                Section {
                    HStack {
                        Spacer()
                        ProgressView()
                        Spacer()
                    }
                }
            } else if let group = viewModel.group {
                // Basic Information
                Section("Basic Information") {
                    TextField("Group Name", text: $viewModel.name)
                        .textInputAutocapitalization(.words)

                    if let error = viewModel.validationErrors["name"] {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }

                    ZStack(alignment: .topLeading) {
                        if viewModel.description.isEmpty {
                            Text("Description (Optional)")
                                .foregroundColor(Color(.placeholderText))
                                .padding(.top, 8)
                        }

                        TextEditor(text: $viewModel.description)
                            .frame(minHeight: 80)
                    }

                    if let error = viewModel.validationErrors["description"] {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }

                    Picker("Currency", selection: $viewModel.selectedCurrency) {
                        ForEach(["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "SGD"], id: \.self) { currency in
                            Text(currency).tag(currency)
                        }
                    }

                    Button("Save Changes") {
                        Task {
                            do {
                                try await viewModel.updateGroup()
                                dismiss()
                            } catch {
                                viewModel.error = error.localizedDescription
                                showError = true
                            }
                        }
                    }
                    .disabled(viewModel.isUpdating)
                }

                // Members
                Section {
                    Button {
                        showInviteSheet = true
                    } label: {
                        Label("Invite Members", systemImage: "person.badge.plus")
                    }

                    NavigationLink(destination: MembersView(groupId: viewModel.groupId)) {
                        HStack {
                            Label("Manage Members", systemImage: "person.2")
                            Spacer()
                            Text("\(group.memberCount ?? 0)")
                                .foregroundColor(.secondary)
                        }
                    }
                } header: {
                    Text("Members")
                }

                // Danger Zone
                Section {
                    if !viewModel.isUserOwner() {
                        Button(role: .destructive) {
                            showLeaveAlert = true
                        } label: {
                            Label("Leave Group", systemImage: "arrow.right.square")
                        }
                    }

                    if viewModel.isUserOwner() {
                        Button(role: .destructive) {
                            showDeleteAlert = true
                        } label: {
                            Label("Delete Group", systemImage: "trash")
                        }
                    }
                } header: {
                    Text("Danger Zone")
                } footer: {
                    if viewModel.isUserOwner() {
                        Text("Deleting the group will permanently remove all expenses, settlements, and member data. This action cannot be undone.")
                    } else {
                        Text("Leaving the group will remove your access to all group data.")
                    }
                }
            }
        }
        .navigationTitle("Group Settings")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Delete Group", isPresented: $showDeleteAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                Task {
                    do {
                        try await viewModel.deleteGroup()
                        dismiss()
                    } catch {
                        viewModel.error = error.localizedDescription
                        showError = true
                    }
                }
            }
        } message: {
            Text("Are you sure you want to delete \"\(viewModel.group?.name ?? "this group")\"? This action cannot be undone and will permanently delete all expenses, settlements, and member data.")
        }
        .alert("Leave Group", isPresented: $showLeaveAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Leave", role: .destructive) {
                Task {
                    do {
                        try await viewModel.leaveGroup()
                        dismiss()
                    } catch {
                        viewModel.error = error.localizedDescription
                        showError = true
                    }
                }
            }
        } message: {
            Text("Are you sure you want to leave \"\(viewModel.group?.name ?? "this group")\"? You will lose access to this group and its data.")
        }
        .alert("Error", isPresented: $showError, presenting: viewModel.error) { _ in
            Button("OK", role: .cancel) {}
        } message: { error in
            Text(error)
        }
        .sheet(isPresented: $showInviteSheet) {
            InviteMembersSheet(viewModel: viewModel)
        }
        .task {
            await viewModel.fetchData()
        }
    }
}

struct InviteMembersSheet: View {
    @ObservedObject var viewModel: GroupSettingsViewModel
    @Environment(\.dismiss) var dismiss
    @State private var email = ""
    @State private var emails: [String] = []
    @State private var showError = false
    @State private var errorMessage = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        TextField("Email address", text: $email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)

                        Button {
                            addEmail()
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(.blue)
                        }
                        .disabled(email.isEmpty)
                    }
                } header: {
                    Text("Add Email")
                }

                if !emails.isEmpty {
                    Section {
                        ForEach(emails, id: \.self) { email in
                            HStack {
                                Text(email)
                                Spacer()
                                Button {
                                    emails.removeAll { $0 == email }
                                } label: {
                                    Image(systemName: "minus.circle.fill")
                                        .foregroundColor(.red)
                                }
                            }
                        }
                    } header: {
                        Text("Emails to Invite (\(emails.count))")
                    }
                }
            }
            .navigationTitle("Invite Members")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Invite") {
                        Task {
                            do {
                                try await viewModel.inviteMembers(emails: emails)
                                dismiss()
                            } catch {
                                errorMessage = error.localizedDescription
                                showError = true
                            }
                        }
                    }
                    .disabled(emails.isEmpty)
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage)
            }
        }
    }

    private func addEmail() {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !trimmedEmail.isEmpty else { return }

        guard isValidEmail(trimmedEmail) else {
            errorMessage = "Please enter a valid email address"
            showError = true
            return
        }

        guard !emails.contains(trimmedEmail) else {
            errorMessage = "Email already added"
            showError = true
            return
        }

        emails.append(trimmedEmail)
        email = ""
    }

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
}

#Preview {
    NavigationStack {
        GroupSettingsView(groupId: "sample-group-id")
    }
}
