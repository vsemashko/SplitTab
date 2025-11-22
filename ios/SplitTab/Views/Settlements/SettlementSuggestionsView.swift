import SwiftUI

struct SettlementSuggestionsView: View {
    let suggestions: [SettlementSuggestion]
    let currentUserId: String
    let originalTransactionCount: Int?
    var onCreateSettlement: ((SettlementSuggestion) -> Void)?
    var onSettleAll: (() -> Void)?

    @State private var createdSettlements: Set<String> = []
    @State private var isCreating = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 12) {
                    HStack {
                        Image(systemName: "sparkles")
                            .font(.title2)
                            .foregroundColor(.yellow)

                        Text("Smart Settlement Suggestions")
                            .font(.title3)
                            .fontWeight(.bold)

                        Spacer()

                        Button(action: {
                            // Info about optimization
                        }) {
                            Image(systemName: "info.circle")
                                .foregroundColor(.secondary)
                        }
                    }

                    // Optimization info
                    if let originalCount = originalTransactionCount, originalCount > suggestions.count {
                        HStack(spacing: 8) {
                            Image(systemName: "chart.line.downtrend.xyaxis")
                                .foregroundColor(.green)

                            Text("Optimized from \(originalCount) to \(suggestions.count) transactions")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            Spacer()

                            Text("Saved \(originalCount - suggestions.count)")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(.green)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.green.opacity(0.1))
                                .cornerRadius(6)
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(10)
                    }
                }
                .padding(.horizontal)

                // Settle All Button
                if onSettleAll != nil && createdSettlements.count < suggestions.count {
                    Button(action: {
                        isCreating = true
                        onSettleAll?()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            isCreating = false
                        }
                    }) {
                        HStack {
                            if isCreating {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Settle All (\(suggestions.count) settlements)")
                            }
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(12)
                    }
                    .disabled(isCreating)
                    .padding(.horizontal)
                }

                // Suggestions List
                if suggestions.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.green)

                        Text("All Balanced!")
                            .font(.title2)
                            .fontWeight(.bold)

                        Text("No settlements needed.\nEveryone is even.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.vertical, 60)
                } else {
                    VStack(spacing: 12) {
                        ForEach(Array(suggestions.enumerated()), id: \.offset) { index, suggestion in
                            let settlementKey = "\(suggestion.payerId)-\(suggestion.payeeId)"
                            let isCreated = createdSettlements.contains(settlementKey)

                            SuggestionCard(
                                suggestion: suggestion,
                                index: index,
                                currentUserId: currentUserId,
                                isCreated: isCreated,
                                onCreate: {
                                    createdSettlements.insert(settlementKey)
                                    onCreateSettlement?(suggestion)
                                }
                            )
                        }
                    }
                    .padding(.horizontal)
                }

                // Explanation
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "lightbulb.fill")
                            .foregroundColor(.yellow)

                        Text("How it works")
                            .font(.headline)
                    }

                    Text("Our smart algorithm minimizes the number of transactions needed to settle all debts in your group. Instead of everyone paying everyone else, we calculate the optimal payment flow.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
                .padding(.horizontal)
                .padding(.top, 20)
            }
            .padding(.vertical)
        }
        .navigationTitle("Suggestions")
        .navigationBarTitleDisplayMode(.inline)
    }
}
