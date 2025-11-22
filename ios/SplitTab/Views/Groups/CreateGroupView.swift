//
//  CreateGroupView.swift
//  SplitTab
//
//  Create Group View
//

import SwiftUI

struct CreateGroupView: View {
    @StateObject private var viewModel = CreateGroupViewModel()
    @Environment(\.dismiss) var dismiss
    @State private var showError = false

    var body: some View {
        NavigationStack {
            Form {
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
                }

                // Category
                Section("Category") {
                    Picker("Select Category", selection: $viewModel.selectedCategory) {
                        Text("None").tag(nil as CreateGroupViewModel.GroupCategory?)

                        ForEach(CreateGroupViewModel.GroupCategory.allCases, id: \.self) { category in
                            HStack {
                                Text(category.icon)
                                Text(category.rawValue)
                            }
                            .tag(category as CreateGroupViewModel.GroupCategory?)
                        }
                    }
                }

                // Currency
                Section("Currency") {
                    Picker("Select Currency", selection: $viewModel.selectedCurrency) {
                        ForEach(viewModel.currencyOptions, id: \.self) { currency in
                            Text(currency).tag(currency)
                        }
                    }
                }

                // Initial Members
                Section {
                    VStack(spacing: 12) {
                        HStack {
                            TextField("Email address", text: $viewModel.memberEmail)
                                .textContentType(.emailAddress)
                                .keyboardType(.emailAddress)
                                .textInputAutocapitalization(.never)

                            Button {
                                viewModel.addMemberEmail()
                            } label: {
                                Image(systemName: "plus.circle.fill")
                                    .foregroundColor(.blue)
                            }
                            .disabled(viewModel.memberEmail.isEmpty)
                        }

                        if !viewModel.memberEmails.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Members to invite (\(viewModel.memberEmails.count))")
                                    .font(.caption)
                                    .foregroundColor(.secondary)

                                FlowLayout(spacing: 8) {
                                    ForEach(viewModel.memberEmails, id: \.self) { email in
                                        EmailBadge(email: email) {
                                            viewModel.removeMemberEmail(email)
                                        }
                                    }
                                }
                            }
                            .padding(.top, 8)
                        }
                    }
                } header: {
                    Text("Initial Members (Optional)")
                } footer: {
                    Text("Add members by email to invite them to join this group")
                }
            }
            .navigationTitle("Create Group")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        Task {
                            do {
                                _ = try await viewModel.createGroup()
                                dismiss()
                            } catch {
                                viewModel.error = error.localizedDescription
                                showError = true
                            }
                        }
                    }
                    .disabled(viewModel.isSubmitting || viewModel.name.isEmpty)
                }
            }
            .alert("Error", isPresented: $showError, presenting: viewModel.error) { _ in
                Button("OK", role: .cancel) {}
            } message: { error in
                Text(error)
            }
            .disabled(viewModel.isSubmitting)
        }
    }
}

struct EmailBadge: View {
    let email: String
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 4) {
            Text(email)
                .font(.caption)

            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .font(.caption)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.blue.opacity(0.2))
        .foregroundColor(.blue)
        .cornerRadius(16)
    }
}

// Flow Layout for wrapping email badges
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(
            in: proposal.replacingUnspecifiedDimensions().width,
            subviews: subviews,
            spacing: spacing
        )
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(
            in: bounds.width,
            subviews: subviews,
            spacing: spacing
        )
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.frames[index].minX,
                                     y: bounds.minY + result.frames[index].minY),
                         proposal: .unspecified)
        }
    }

    struct FlowResult {
        var frames: [CGRect] = []
        var size: CGSize = .zero

        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var lineHeight: CGFloat = 0

            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)

                if currentX + size.width > maxWidth && currentX > 0 {
                    currentX = 0
                    currentY += lineHeight + spacing
                    lineHeight = 0
                }

                frames.append(CGRect(x: currentX, y: currentY, width: size.width, height: size.height))
                lineHeight = max(lineHeight, size.height)
                currentX += size.width + spacing
            }

            self.size = CGSize(width: maxWidth, height: currentY + lineHeight)
        }
    }
}

#Preview {
    CreateGroupView()
}
