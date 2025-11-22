//
//  CreateExpenseViewModel.swift
//  SplitTab
//
//  Create Expense View Model
//

import Foundation
import SwiftUI
import PhotosUI

@MainActor
class CreateExpenseViewModel: ObservableObject {
    // Basic info
    @Published var description = ""
    @Published var amount = ""
    @Published var currency = "USD"
    @Published var expenseDate = Date()
    @Published var category: ExpenseCategory = .food
    @Published var notes = ""

    // Group and payer
    @Published var selectedGroupId = ""
    @Published var paidBy = ""
    @Published var groups: [Group] = []
    @Published var groupMembers: [User] = []

    // Split details
    @Published var shareType: ShareType = .equal
    @Published var participants: [ParticipantShare] = []

    // Receipt images
    @Published var selectedPhotos: [PhotosPickerItem] = []
    @Published var receiptImages: [UIImage] = []

    // State
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var error: String?
    @Published var validationErrors: [String: String] = [:]

    private let networkManager = NetworkManager.shared

    struct ParticipantShare: Identifiable, Hashable {
        let id = UUID()
        var userId: String
        var share: Double
        var shareType: ShareType
        var user: User?
    }

    func loadGroups() async {
        isLoading = true

        do {
            let endpoint = APIEndpoint.groups
            let response: APIResponse<[Group]> = try await networkManager.request(endpoint)
            groups = response.data ?? []
        } catch {
            self.error = "Failed to load groups: \(error.localizedDescription)"
        }

        isLoading = false
    }

    func loadGroupMembers(groupId: String) async {
        do {
            let endpoint = APIEndpoint.groupMembers(groupId: groupId)
            let response: APIResponse<[User]> = try await networkManager.request(endpoint)
            groupMembers = response.data ?? []

            // Set default payer to current user if in group
            if let currentUserId = UserManager.shared.user?.id,
               groupMembers.contains(where: { $0.id == currentUserId }) {
                paidBy = currentUserId
            }
        } catch {
            self.error = "Failed to load group members: \(error.localizedDescription)"
        }
    }

    func addParticipant(user: User) {
        // Check if already added
        guard !participants.contains(where: { $0.userId == user.id }) else { return }

        let defaultShare = calculateDefaultShare()

        let participant = ParticipantShare(
            userId: user.id,
            share: defaultShare,
            shareType: shareType,
            user: user
        )

        participants.append(participant)

        // For equal split, recalculate all shares
        if shareType == .equal {
            recalculateEqualShares()
        }
    }

    func removeParticipant(userId: String) {
        participants.removeAll { $0.userId == userId }

        // For equal split, recalculate shares
        if shareType == .equal && !participants.isEmpty {
            recalculateEqualShares()
        }
    }

    func updateParticipantShare(userId: String, share: Double) {
        if let index = participants.firstIndex(where: { $0.userId == userId }) {
            participants[index].share = share
            participants[index].shareType = shareType

            // For equal split, update all
            if shareType == .equal {
                recalculateEqualShares()
            }
        }
    }

    private func calculateDefaultShare() -> Double {
        guard let totalAmount = Double(amount), totalAmount > 0 else { return 0 }

        switch shareType {
        case .equal:
            return totalAmount / Double(participants.count + 1)
        case .percentage:
            let usedPercentage = participants.reduce(0) { $0 + $1.share }
            return max(0, 100 - usedPercentage)
        case .exact:
            let usedAmount = participants.reduce(0) { $0 + $1.share }
            return max(0, totalAmount - usedAmount)
        case .shares:
            return 1
        }
    }

    private func recalculateEqualShares() {
        guard let totalAmount = Double(amount), totalAmount > 0, !participants.isEmpty else { return }
        let equalShare = totalAmount / Double(participants.count)

        for index in participants.indices {
            participants[index].share = equalShare
            participants[index].shareType = .equal
        }
    }

    func validateBasicInfo() -> Bool {
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

    func validateGroupInfo() -> Bool {
        validationErrors.removeAll()

        if selectedGroupId.isEmpty {
            validationErrors["group"] = "Please select a group"
        }

        if paidBy.isEmpty {
            validationErrors["paidBy"] = "Please select who paid"
        }

        return validationErrors.isEmpty
    }

    func validateSplit() -> Bool {
        validationErrors.removeAll()

        guard !participants.isEmpty else {
            validationErrors["participants"] = "At least one participant is required"
            return false
        }

        guard let totalAmount = Double(amount), totalAmount > 0 else {
            return false
        }

        let total = participants.reduce(0.0) { result, participant in
            switch shareType {
            case .equal:
                return result + (totalAmount / Double(participants.count))
            case .percentage:
                return result + participant.share
            case .exact:
                return result + participant.share
            case .shares:
                let totalShares = participants.reduce(0.0) { $0 + $1.share }
                return result + (totalAmount * participant.share / totalShares)
            }
        }

        let isValid: Bool
        switch shareType {
        case .percentage:
            isValid = abs(total - 100) < 0.01
        case .exact:
            isValid = abs(total - totalAmount) < 0.01
        default:
            isValid = true
        }

        if !isValid {
            validationErrors["participants"] = "Participant shares do not add up correctly"
        }

        return isValid
    }

    func createExpense() async throws -> Expense {
        guard validateBasicInfo() && validateGroupInfo() && validateSplit() else {
            throw NSError(domain: "ValidationError", code: 1, userInfo: [
                NSLocalizedDescriptionKey: validationErrors.values.first ?? "Validation failed"
            ])
        }

        isSaving = true
        error = nil

        defer { isSaving = false }

        let expenseCreate = ExpenseCreate(
            groupId: selectedGroupId,
            description: description.trimmingCharacters(in: .whitespaces),
            amount: Double(amount) ?? 0,
            currency: currency,
            paidBy: paidBy,
            expenseDate: expenseDate,
            category: category,
            notes: notes.isEmpty ? nil : notes.trimmingCharacters(in: .whitespaces),
            participants: participants.map { participant in
                ExpenseParticipantCreate(
                    userId: participant.userId,
                    share: participant.share,
                    shareType: participant.shareType
                )
            }
        )

        let endpoint = APIEndpoint.createExpense
        let response: APIResponse<Expense> = try await networkManager.request(
            endpoint,
            body: expenseCreate
        )

        guard let expense = response.data else {
            throw NSError(domain: "APIError", code: 2, userInfo: [
                NSLocalizedDescriptionKey: "No expense data returned"
            ])
        }

        // Upload receipt images if any
        if !receiptImages.isEmpty {
            await uploadReceiptImages(expenseId: expense.id)
        }

        return expense
    }

    private func uploadReceiptImages(expenseId: String) async {
        for image in receiptImages {
            guard let imageData = image.jpegData(compressionQuality: 0.8) else { continue }

            do {
                let endpoint = APIEndpoint.uploadReceipt(expenseId: expenseId)
                // Upload image data
                // Note: This would need a proper multipart upload implementation
                print("Would upload image for expense: \(expenseId)")
            } catch {
                print("Failed to upload receipt: \(error)")
            }
        }
    }

    func loadPhotoImages() {
        Task {
            var images: [UIImage] = []

            for item in selectedPhotos {
                if let data = try? await item.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    images.append(image)
                }
            }

            await MainActor.run {
                self.receiptImages = images
            }
        }
    }
}
