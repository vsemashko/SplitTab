//
//  CreateExpenseView.swift
//  SplitTab
//
//  Create Expense View
//

import SwiftUI
import PhotosUI

struct CreateExpenseView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var viewModel = CreateExpenseViewModel()
    @State private var currentStep = 0
    @State private var showError = false

    let steps = ["Basic Info", "Group", "Split", "Receipt"]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Progress indicator
                ProgressBar(currentStep: currentStep, totalSteps: steps.count)
                    .padding()

                // Step content
                ScrollView {
                    VStack(spacing: 20) {
                        switch currentStep {
                        case 0:
                            BasicInfoStep(viewModel: viewModel)
                        case 1:
                            GroupStep(viewModel: viewModel)
                        case 2:
                            SplitStep(viewModel: viewModel)
                        case 3:
                            ReceiptStep(viewModel: viewModel)
                        default:
                            EmptyView()
                        }
                    }
                    .padding()
                }

                // Navigation buttons
                HStack(spacing: 16) {
                    if currentStep > 0 {
                        Button("Previous") {
                            withAnimation {
                                currentStep -= 1
                            }
                        }
                        .buttonStyle(.bordered)
                    }

                    Spacer()

                    if currentStep < steps.count - 1 {
                        Button("Next") {
                            if validateCurrentStep() {
                                withAnimation {
                                    currentStep += 1
                                }
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    } else {
                        Button("Create Expense") {
                            Task {
                                await createExpense()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(viewModel.isSaving)
                    }
                }
                .padding()
                .background(Color(uiColor: .systemBackground))
            }
            .navigationTitle("New Expense")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.error ?? "An error occurred")
            }
            .task {
                await viewModel.loadGroups()
            }
        }
    }

    private func validateCurrentStep() -> Bool {
        switch currentStep {
        case 0:
            return viewModel.validateBasicInfo()
        case 1:
            return viewModel.validateGroupInfo()
        case 2:
            return viewModel.validateSplit()
        default:
            return true
        }
    }

    private func createExpense() async {
        do {
            let expense = try await viewModel.createExpense()
            dismiss()
        } catch {
            viewModel.error = error.localizedDescription
            showError = true
        }
    }
}

struct ProgressBar: View {
    let currentStep: Int
    let totalSteps: Int

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<totalSteps, id: \.self) { step in
                RoundedRectangle(cornerRadius: 2)
                    .fill(step <= currentStep ? Color.blue : Color.gray.opacity(0.3))
                    .frame(height: 4)
            }
        }
    }
}

// MARK: - Step Views

struct BasicInfoStep: View {
    @ObservedObject var viewModel: CreateExpenseViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Basic Information")
                .font(.title2)
                .fontWeight(.bold)

            VStack(alignment: .leading, spacing: 8) {
                Text("Description *")
                    .font(.headline)
                TextField("e.g., Dinner at restaurant", text: $viewModel.description)
                    .textFieldStyle(.roundedBorder)

                if let error = viewModel.validationErrors["description"] {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }

            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Amount *")
                        .font(.headline)
                    TextField("0.00", text: $viewModel.amount)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.decimalPad)

                    if let error = viewModel.validationErrors["amount"] {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Currency")
                        .font(.headline)
                    Picker("Currency", selection: $viewModel.currency) {
                        Text("USD").tag("USD")
                        Text("EUR").tag("EUR")
                        Text("GBP").tag("GBP")
                    }
                    .pickerStyle(.menu)
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Date *")
                    .font(.headline)
                DatePicker("", selection: $viewModel.expenseDate, displayedComponents: .date)
                    .datePickerStyle(.compact)
            }

            CategoryPicker(selectedCategory: $viewModel.category)

            VStack(alignment: .leading, spacing: 8) {
                Text("Notes (Optional)")
                    .font(.headline)
                TextEditor(text: $viewModel.notes)
                    .frame(height: 100)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                    )
            }
        }
    }
}

struct GroupStep: View {
    @ObservedObject var viewModel: CreateExpenseViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Select Group")
                .font(.title2)
                .fontWeight(.bold)

            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, alignment: .center)
            } else if viewModel.groups.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "person.3")
                        .font(.system(size: 48))
                        .foregroundColor(.secondary)
                    Text("No groups available")
                        .foregroundColor(.secondary)
                    Text("Create a group first to add expenses")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Group *")
                        .font(.headline)

                    Picker("Select Group", selection: $viewModel.selectedGroupId) {
                        Text("Choose a group").tag("")
                        ForEach(viewModel.groups, id: \.id) { group in
                            Text(group.name).tag(group.id)
                        }
                    }
                    .pickerStyle(.menu)
                    .onChange(of: viewModel.selectedGroupId) { _, newValue in
                        if !newValue.isEmpty {
                            Task {
                                await viewModel.loadGroupMembers(groupId: newValue)
                            }
                        }
                    }

                    if let error = viewModel.validationErrors["group"] {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }

                if !viewModel.groupMembers.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Who Paid? *")
                            .font(.headline)

                        Picker("Paid By", selection: $viewModel.paidBy) {
                            Text("Select who paid").tag("")
                            ForEach(viewModel.groupMembers, id: \.id) { member in
                                Text(member.name).tag(member.id)
                            }
                        }
                        .pickerStyle(.menu)

                        if let error = viewModel.validationErrors["paidBy"] {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }
                }
            }
        }
    }
}

struct SplitStep: View {
    @ObservedObject var viewModel: CreateExpenseViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Split Details")
                .font(.title2)
                .fontWeight(.bold)

            SplitMethodPicker(selectedMethod: $viewModel.shareType)

            ParticipantSelectionView(viewModel: viewModel)

            if let error = viewModel.validationErrors["participants"] {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }

            if !viewModel.participants.isEmpty,
               let amount = Double(viewModel.amount), amount > 0 {
                SplitPreviewCard(
                    participants: viewModel.participants,
                    totalAmount: amount,
                    currency: viewModel.currency,
                    shareType: viewModel.shareType
                )
            }
        }
    }
}

struct ParticipantSelectionView: View {
    @ObservedObject var viewModel: CreateExpenseViewModel
    @State private var selectedUserId = ""

    var availableUsers: [User] {
        viewModel.groupMembers.filter { member in
            !viewModel.participants.contains { $0.userId == member.id }
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Participants")
                .font(.headline)

            if !availableUsers.isEmpty {
                HStack {
                    Picker("Add participant", selection: $selectedUserId) {
                        Text("Select participant").tag("")
                        ForEach(availableUsers, id: \.id) { user in
                            Text(user.name).tag(user.id)
                        }
                    }
                    .pickerStyle(.menu)

                    Button("Add") {
                        if let user = viewModel.groupMembers.first(where: { $0.id == selectedUserId }) {
                            viewModel.addParticipant(user: user)
                            selectedUserId = ""
                        }
                    }
                    .disabled(selectedUserId.isEmpty)
                }
            }

            if viewModel.participants.isEmpty {
                Text("No participants added yet")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(8)
            } else {
                ForEach(viewModel.participants) { participant in
                    HStack {
                        Text(participant.user?.name ?? "Unknown")
                            .font(.subheadline)

                        Spacer()

                        TextField(
                            "Amount",
                            value: Binding(
                                get: { participant.share },
                                set: { viewModel.updateParticipantShare(userId: participant.userId, share: $0) }
                            ),
                            format: .number
                        )
                        .keyboardType(.decimalPad)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 100)
                        .disabled(viewModel.shareType == .equal)

                        Button {
                            viewModel.removeParticipant(userId: participant.userId)
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.red)
                        }
                    }
                    .padding()
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(8)
                }
            }
        }
    }
}

struct ReceiptStep: View {
    @ObservedObject var viewModel: CreateExpenseViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Receipt Images")
                .font(.title2)
                .fontWeight(.bold)

            Text("Upload receipt images (optional)")
                .font(.subheadline)
                .foregroundColor(.secondary)

            PhotosPicker(
                selection: $viewModel.selectedPhotos,
                maxSelectionCount: 5,
                matching: .images
            ) {
                Label("Select Photos", systemImage: "photo.on.rectangle")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
            .onChange(of: viewModel.selectedPhotos) { _, _ in
                viewModel.loadPhotoImages()
            }

            if !viewModel.receiptImages.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(0..<viewModel.receiptImages.count, id: \.self) { index in
                            Image(uiImage: viewModel.receiptImages[index])
                                .resizable()
                                .scaledToFill()
                                .frame(width: 100, height: 100)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }

                Text("\(viewModel.receiptImages.count) image(s) selected")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

#Preview {
    CreateExpenseView()
}
