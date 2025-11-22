import SwiftUI

struct SettlementDetailView: View {
    let settlementId: String
    @StateObject private var viewModel: SettlementDetailViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showingConfirmDialog = false
    @State private var showingCancelDialog = false
    @State private var showingDeleteAlert = false
    @State private var showingError = false

    init(settlementId: String) {
        self.settlementId = settlementId
        _viewModel = StateObject(wrappedValue: SettlementDetailViewModel(settlementId: settlementId))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                if let settlement = viewModel.settlement {
                    // Status Badge
                    HStack {
                        Spacer()
                        StatusBadge(status: settlement.status)
                        Spacer()
                    }

                    // Amount Card
                    VStack(spacing: 20) {
                        HStack(spacing: 16) {
                            // Payer
                            VStack(spacing: 8) {
                                Circle()
                                    .fill(Color.gray.opacity(0.2))
                                    .frame(width: 60, height: 60)
                                    .overlay(
                                        Text(settlement.payer?.name?.prefix(1).uppercased() ?? "U")
                                            .font(.title2)
                                            .fontWeight(.bold)
                                    )

                                Text(settlement.payer?.name ?? "Unknown")
                                    .font(.subheadline)
                                    .fontWeight(.semibold)

                                Text("Payer")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            // Arrow and Amount
                            VStack(spacing: 8) {
                                Image(systemName: "arrow.right")
                                    .font(.title)
                                    .foregroundColor(.green)

                                Text(viewModel.formatCurrency(settlement.amount))
                                    .font(.system(size: 32, weight: .bold))
                                    .foregroundColor(.green)
                            }

                            // Payee
                            VStack(spacing: 8) {
                                Circle()
                                    .fill(Color.gray.opacity(0.2))
                                    .frame(width: 60, height: 60)
                                    .overlay(
                                        Text(settlement.payee?.name?.prefix(1).uppercased() ?? "U")
                                            .font(.title2)
                                            .fontWeight(.bold)
                                    )

                                Text(settlement.payee?.name ?? "Unknown")
                                    .font(.subheadline)
                                    .fontWeight(.semibold)

                                Text("Payee")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding()
                        .background(Color.green.opacity(0.1))
                        .cornerRadius(16)

                        // User indicator
                        if viewModel.isPayer {
                            Label("You paid \(settlement.payee?.name ?? "someone")", systemImage: "arrow.up.circle.fill")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.orange)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color.orange.opacity(0.1))
                                .cornerRadius(8)
                        } else if viewModel.isPayee {
                            Label("\(settlement.payer?.name ?? "Someone") paid you", systemImage: "arrow.down.circle.fill")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.green)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color.green.opacity(0.1))
                                .cornerRadius(8)
                        }
                    }

                    // Payment Information
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Payment Information")
                            .font(.headline)

                        VStack(spacing: 12) {
                            InfoRow(
                                icon: "creditcard",
                                title: "Payment Method",
                                value: viewModel.getPaymentMethodLabel(settlement.paymentMethod)
                            )

                            InfoRow(
                                icon: "calendar",
                                title: "Settlement Date",
                                value: settlement.settledAt != nil ?
                                    settlement.settledAt!.formatted(date: .long, time: .omitted) :
                                    "Not specified"
                            )

                            if let refNumber = settlement.referenceNumber {
                                InfoRow(
                                    icon: "number",
                                    title: "Reference Number",
                                    value: refNumber
                                )
                            }

                            if let group = settlement.group {
                                InfoRow(
                                    icon: "person.3",
                                    title: "Group",
                                    value: group.name
                                )
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    // Notes
                    if let notes = settlement.notes, !notes.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Notes")
                                .font(.headline)

                            Text(notes)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .padding()
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color(.systemGray6))
                                .cornerRadius(12)
                        }
                    }

                    // Proof of Payment
                    if let proofUrl = settlement.proofOfPaymentUrl {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Proof of Payment")
                                .font(.headline)

                            AsyncImage(url: URL(string: proofUrl)) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                                    .cornerRadius(12)
                            } placeholder: {
                                ProgressView()
                            }
                        }
                    }

                    // Activity Timeline
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Activity")
                            .font(.headline)

                        VStack(alignment: .leading, spacing: 16) {
                            TimelineItem(
                                icon: "clock",
                                title: "Settlement created",
                                date: settlement.createdAt,
                                color: .blue
                            )

                            if settlement.status == .confirmed {
                                TimelineItem(
                                    icon: "checkmark.circle.fill",
                                    title: "Payment confirmed",
                                    date: settlement.updatedAt,
                                    color: .green,
                                    isLast: true
                                )
                            } else if settlement.status == .cancelled {
                                TimelineItem(
                                    icon: "xmark.circle.fill",
                                    title: "Settlement cancelled",
                                    date: settlement.updatedAt,
                                    color: .gray,
                                    isLast: true
                                )
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    // Action Buttons
                    VStack(spacing: 12) {
                        if viewModel.canConfirm {
                            Button(action: { showingConfirmDialog = true }) {
                                Label("Confirm Payment", systemImage: "checkmark.circle.fill")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.green)
                                    .foregroundColor(.white)
                                    .cornerRadius(12)
                            }
                        }

                        if viewModel.canCancel {
                            Button(action: { showingCancelDialog = true }) {
                                Label("Cancel Settlement", systemImage: "xmark.circle")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color(.systemGray5))
                                    .foregroundColor(.primary)
                                    .cornerRadius(12)
                            }
                        }

                        if viewModel.canDelete {
                            Button(action: { showingDeleteAlert = true }) {
                                Label("Delete", systemImage: "trash")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.red.opacity(0.1))
                                    .foregroundColor(.red)
                                    .cornerRadius(12)
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Settlement Details")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadData()
        }
        .confirmationDialog("Confirm Settlement", isPresented: $showingConfirmDialog) {
            Button("Confirm Payment") {
                Task {
                    do {
                        try await viewModel.confirmSettlement()
                    } catch {
                        viewModel.error = error.localizedDescription
                        showingError = true
                    }
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            if let settlement = viewModel.settlement {
                Text("Confirm that you received \(viewModel.formatCurrency(settlement.amount))?")
            }
        }
        .confirmationDialog("Cancel Settlement", isPresented: $showingCancelDialog) {
            Button("Cancel Settlement", role: .destructive) {
                Task {
                    do {
                        try await viewModel.cancelSettlement()
                    } catch {
                        viewModel.error = error.localizedDescription
                        showingError = true
                    }
                }
            }
            Button("Keep", role: .cancel) {}
        } message: {
            Text("Are you sure you want to cancel this settlement?")
        }
        .alert("Delete Settlement", isPresented: $showingDeleteAlert) {
            Button("Delete", role: .destructive) {
                Task {
                    do {
                        try await viewModel.deleteSettlement()
                        dismiss()
                    } catch {
                        viewModel.error = error.localizedDescription
                        showingError = true
                    }
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This action cannot be undone.")
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

struct InfoRow: View {
    let icon: String
    let title: String
    let value: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.secondary)
                .frame(width: 24)

            Text(title)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .fontWeight(.medium)
        }
    }
}

struct TimelineItem: View {
    let icon: String
    let title: String
    let date: Date
    let color: Color
    var isLast: Bool = false

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(spacing: 0) {
                Circle()
                    .fill(color)
                    .frame(width: 32, height: 32)
                    .overlay(
                        Image(systemName: icon)
                            .font(.caption)
                            .foregroundColor(.white)
                    )

                if !isLast {
                    Rectangle()
                        .fill(Color(.systemGray4))
                        .frame(width: 2, height: 30)
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(date.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.top, 4)
        }
    }
}
