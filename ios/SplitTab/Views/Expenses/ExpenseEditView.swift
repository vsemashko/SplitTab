//
//  ExpenseEditView.swift
//  SplitTab
//
//  Expense Edit View
//

import SwiftUI

struct ExpenseEditView: View {
    @Environment(\.dismiss) var dismiss
    let expense: Expense

    @State private var description: String
    @State private var amount: String
    @State private var expenseDate: Date
    @State private var category: ExpenseCategory
    @State private var notes: String

    @State private var isSaving = false
    @State private var error: String?
    @State private var showError = false
    @State private var validationErrors: [String: String] = [:]

    init(expense: Expense) {
        self.expense = expense
        _description = State(initialValue: expense.description)
        _amount = State(initialValue: String(expense.amount))
        _expenseDate = State(initialValue: expense.expenseDate)
        _category = State(initialValue: expense.category)
        _notes = State(initialValue: expense.notes ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack(spacing: 8) {
                        Image(systemName: "info.circle")
                            .foregroundColor(.blue)
                        Text("You can only edit basic information. To change the split or participants, please delete and create a new expense.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Section("Basic Information") {
                    VStack(alignment: .leading, spacing: 4) {
                        TextField("Description", text: $description)
                        if let error = validationErrors["description"] {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text("Amount")
                            Spacer()
                            TextField("0.00", text: $amount)
                                .keyboardType(.decimalPad)
                                .multilineTextAlignment(.trailing)
                        }
                        Text("Currency: \(expense.currency)")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        if let error = validationErrors["amount"] {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }

                    DatePicker("Date", selection: $expenseDate, displayedComponents: .date)
                }

                Section("Details") {
                    Picker("Category", selection: $category) {
                        ForEach(ExpenseCategory.allCases, id: \.self) { cat in
                            HStack {
                                Image(systemName: cat.iconName)
                                Text(cat.displayName)
                            }
                            .tag(cat)
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Notes (Optional)")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        TextEditor(text: $notes)
                            .frame(height: 100)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.secondary.opacity(0.3), lineWidth: 1)
                            )

                        Text("\(notes.count)/500 characters")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Section("Read-Only Information") {
                    HStack {
                        Text("Group")
                        Spacer()
                        Text(expense.group?.name ?? "Unknown")
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Text("Paid By")
                        Spacer()
                        Text(expense.payer?.name ?? "Unknown")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Edit Expense")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .disabled(isSaving)
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        Task {
                            await saveChanges()
                        }
                    }
                    .disabled(isSaving)
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(error ?? "An error occurred")
            }
        }
    }

    private func validate() -> Bool {
        validationErrors.removeAll()

        if description.trimmingCharacters(in: .whitespaces).isEmpty {
            validationErrors["description"] = "Description is required"
        } else if description.count < 3 {
            validationErrors["description"] = "Description must be at least 3 characters"
        }

        guard let amountValue = Double(amount), amountValue > 0 else {
            validationErrors["amount"] = "Amount must be greater than 0"
            return false
        }

        if amountValue > 1_000_000 {
            validationErrors["amount"] = "Amount is too large"
        }

        return validationErrors.isEmpty
    }

    private func saveChanges() async {
        guard validate() else { return }

        isSaving = true
        defer { isSaving = false }

        do {
            let updateData = ExpenseUpdate(
                description: description.trimmingCharacters(in: .whitespaces),
                amount: Double(amount),
                expenseDate: expenseDate,
                category: category,
                notes: notes.isEmpty ? nil : notes.trimmingCharacters(in: .whitespaces)
            )

            let endpoint = APIEndpoint.updateExpense(id: expense.id)
            let _: APIResponse<Expense> = try await NetworkManager.shared.request(
                endpoint,
                body: updateData
            )

            dismiss()
        } catch {
            self.error = error.localizedDescription
            showError = true
        }
    }
}

#Preview {
    ExpenseEditView(expense: Expense(
        id: "1",
        groupId: "group1",
        description: "Dinner at restaurant",
        amount: 125.50,
        currency: "USD",
        paidBy: "user1",
        expenseDate: Date(),
        category: .food,
        receiptUrl: nil,
        notes: "Great dinner with friends",
        createdAt: Date(),
        updatedAt: Date(),
        participants: nil,
        payer: User(
            id: "user1",
            email: "john@example.com",
            emailVerified: true,
            name: "John Doe",
            profilePictureUrl: nil,
            phoneNumber: nil,
            phoneVerified: false,
            defaultCurrency: "USD",
            timezone: "UTC",
            language: "en",
            googleId: nil,
            appleId: nil,
            twoFactorEnabled: false,
            lastLoginAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        ),
        group: Group(
            id: "group1",
            name: "Weekend Trip",
            description: nil,
            imageUrl: nil,
            currency: "USD",
            createdBy: "user1",
            isActive: true,
            createdAt: Date(),
            updatedAt: Date(),
            members: nil,
            memberCount: nil,
            totalExpenses: nil,
            yourBalance: nil
        )
    ))
}
