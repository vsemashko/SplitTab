//
//  SplitMethodPicker.swift
//  SplitTab
//
//  Split Method Picker Component
//

import SwiftUI

struct SplitMethodPicker: View {
    @Binding var selectedMethod: ShareType

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Split Method")
                .font(.headline)

            Picker("Split Method", selection: $selectedMethod) {
                ForEach(ShareType.allCases, id: \.self) { method in
                    Text(method.displayName).tag(method)
                }
            }
            .pickerStyle(.segmented)

            Text(getDescription(for: selectedMethod))
                .font(.caption)
                .foregroundColor(.secondary)
                .padding(.top, 4)
        }
    }

    private func getDescription(for method: ShareType) -> String {
        switch method {
        case .equal:
            return "Split the total amount equally among all participants"
        case .percentage:
            return "Each participant pays a percentage of the total (must add up to 100%)"
        case .exact:
            return "Specify exact amounts for each participant (must add up to total)"
        case .shares:
            return "Assign shares to each participant (calculated proportionally)"
        }
    }
}

struct SplitPreviewCard: View {
    let participants: [CreateExpenseViewModel.ParticipantShare]
    let totalAmount: Double
    let currency: String
    let shareType: ShareType

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Split Preview")
                .font(.headline)

            VStack(spacing: 8) {
                ForEach(participants) { participant in
                    HStack {
                        Text(participant.user?.name ?? "Unknown")
                            .font(.subheadline)

                        Spacer()

                        VStack(alignment: .trailing, spacing: 2) {
                            Text(formatAmount(calculateAmount(for: participant)))
                                .font(.subheadline)
                                .fontWeight(.semibold)

                            if shareType == .percentage {
                                Text("\(String(format: "%.1f", participant.share))%")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            } else if shareType == .shares {
                                Text("\(String(format: "%.0f", participant.share)) shares")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 4)

                    if participant.id != participants.last?.id {
                        Divider()
                    }
                }

                Divider()
                    .background(Color.primary)

                HStack {
                    Text("Total")
                        .font(.headline)
                    Spacer()
                    Text(formatAmount(calculatedTotal))
                        .font(.headline)
                        .foregroundColor(isValid ? .green : .red)
                }
            }
            .padding()
            .background(Color.secondary.opacity(0.1))
            .cornerRadius(8)

            if !isValid {
                HStack(spacing: 4) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)
                    Text("Total does not match expense amount")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
        }
    }

    private func calculateAmount(for participant: CreateExpenseViewModel.ParticipantShare) -> Double {
        switch shareType {
        case .equal:
            return totalAmount / Double(participants.count)
        case .percentage:
            return totalAmount * (participant.share / 100)
        case .exact:
            return participant.share
        case .shares:
            let totalShares = participants.reduce(0.0) { $0 + $1.share }
            return totalAmount * (participant.share / totalShares)
        }
    }

    private var calculatedTotal: Double {
        participants.reduce(0.0) { $0 + calculateAmount(for: $1) }
    }

    private var isValid: Bool {
        abs(calculatedTotal - totalAmount) < 0.01
    }

    private func formatAmount(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

#Preview {
    VStack {
        SplitMethodPicker(selectedMethod: .constant(.equal))
            .padding()
    }
}
