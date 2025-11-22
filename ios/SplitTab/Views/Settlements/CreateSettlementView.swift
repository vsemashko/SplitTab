import SwiftUI
import PhotosUI

struct CreateSettlementView: View {
    @StateObject private var viewModel = CreateSettlementViewModel()
    @Environment(\.dismiss) private var dismiss
    @State private var showingError = false

    var body: some View {
        Form {
            // Group Selection
            Section {
                Picker("Group (Optional)", selection: $viewModel.selectedGroup) {
                    Text("No group").tag(nil as Group?)
                    ForEach(viewModel.groups) { group in
                        Text(group.name).tag(group as Group?)
                    }
                }
                .onChange(of: viewModel.selectedGroup) { _ in
                    // Reset payer and payee when group changes
                    viewModel.payeeId = ""
                }
            } header: {
                Text("Group")
            }

            // Participants
            Section {
                if let group = viewModel.selectedGroup {
                    // Payer Picker
                    Picker("Payer", selection: $viewModel.payerId) {
                        ForEach(viewModel.availablePayers, id: \.userId) { member in
                            HStack {
                                Text(member.user?.name ?? "Unknown")
                                if member.userId == viewModel.currentUserId {
                                    Text("(You)").foregroundColor(.secondary)
                                }
                            }
                            .tag(member.userId)
                        }
                    }

                    // Payee Picker
                    Picker("Payee (Recipient)", selection: $viewModel.payeeId) {
                        Text("Select payee").tag("")
                        ForEach(viewModel.availablePayees, id: \.userId) { member in
                            HStack {
                                Text(member.user?.name ?? "Unknown")
                                if member.userId == viewModel.currentUserId {
                                    Text("(You)").foregroundColor(.secondary)
                                }
                            }
                            .tag(member.userId)
                        }
                    }

                    if let error = viewModel.validationErrors["payeeId"] {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                } else {
                    Text("Please select a group first")
                        .foregroundColor(.secondary)
                }
            } header: {
                Text("Participants")
            }

            // Amount
            Section {
                HStack {
                    Text("$")
                        .foregroundColor(.secondary)

                    TextField("0.00", text: $viewModel.amount)
                        .keyboardType(.decimalPad)
                }

                if let error = viewModel.validationErrors["amount"] {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                }
            } header: {
                Text("Amount")
            }

            // Payment Details
            Section {
                PaymentMethodPicker(selectedMethod: $viewModel.paymentMethod)

                TextField("Reference Number (Optional)", text: $viewModel.referenceNumber)

                DatePicker("Settlement Date", selection: $viewModel.settlementDate, displayedComponents: .date)
            } header: {
                Text("Payment Details")
            }

            // Notes
            Section {
                TextEditor(text: $viewModel.notes)
                    .frame(minHeight: 100)

                Text("\(viewModel.notes.count)/500")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            } header: {
                Text("Notes (Optional)")
            }

            // Proof of Payment
            Section {
                PhotosPicker(selection: $viewModel.selectedPhotosItems,
                           maxSelectionCount: 5,
                           matching: .images) {
                    Label("Add Proof of Payment", systemImage: "photo")
                }
                .onChange(of: viewModel.selectedPhotosItems) { _ in
                    viewModel.loadPhotos()
                }

                if !viewModel.proofImages.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(Array(viewModel.proofImages.enumerated()), id: \.offset) { index, image in
                                ZStack(alignment: .topTrailing) {
                                    Image(uiImage: image)
                                        .resizable()
                                        .scaledToFill()
                                        .frame(width: 100, height: 100)
                                        .clipShape(RoundedRectangle(cornerRadius: 8))

                                    Button(action: {
                                        viewModel.removeImage(at: index)
                                    }) {
                                        Image(systemName: "xmark.circle.fill")
                                            .foregroundColor(.white)
                                            .background(Circle().fill(Color.black.opacity(0.5)))
                                    }
                                    .padding(4)
                                }
                            }
                        }
                    }
                }
            } header: {
                Text("Proof of Payment (Optional)")
            }

            // Summary
            if viewModel.isValid {
                Section {
                    VStack(spacing: 12) {
                        Text("Summary")
                            .font(.headline)

                        HStack {
                            Text(viewModel.getUserName(for: viewModel.payerId))
                                .fontWeight(.semibold)

                            Image(systemName: "arrow.right")
                                .foregroundColor(.secondary)

                            Text(viewModel.getUserName(for: viewModel.payeeId))
                                .fontWeight(.semibold)
                        }

                        if let amount = Double(viewModel.amount) {
                            Text("$\(String(format: "%.2f", amount))")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.green)
                        }

                        if let method = viewModel.paymentMethod {
                            Text("via \(method.displayName)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                }
            }
        }
        .navigationTitle("New Settlement")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
            }

            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Create") {
                    Task {
                        do {
                            try await viewModel.createSettlement()
                            dismiss()
                        } catch {
                            viewModel.error = error.localizedDescription
                            showingError = true
                        }
                    }
                }
                .disabled(!viewModel.isValid || viewModel.isLoading)
            }
        }
        .task {
            await viewModel.loadData()
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK") {}
        } message: {
            Text(viewModel.error ?? "An error occurred")
        }
        .overlay {
            if viewModel.isLoading {
                ProgressView()
                    .scaleEffect(1.5)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.black.opacity(0.1))
            }
        }
    }
}
