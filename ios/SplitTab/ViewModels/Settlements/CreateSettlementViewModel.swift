import Foundation
import SwiftUI
import PhotosUI
import Combine

@MainActor
class CreateSettlementViewModel: ObservableObject {
    @Published var groups: [Group] = []
    @Published var selectedGroup: Group?
    @Published var payerId: String = ""
    @Published var payeeId: String = ""
    @Published var amount: String = ""
    @Published var paymentMethod: PaymentMethod?
    @Published var referenceNumber: String = ""
    @Published var notes: String = ""
    @Published var settlementDate = Date()
    @Published var proofImages: [UIImage] = []
    @Published var selectedPhotosItems: [PhotosPickerItem] = []

    @Published var isLoading = false
    @Published var error: String?
    @Published var validationErrors: [String: String] = [:]

    private let apiService: APIService
    private var cancellables = Set<AnyCancellable>()
    private(set) var currentUserId: String = ""

    init(apiService: APIService = .shared, groupId: String? = nil, payeeId: String? = nil, amount: Double? = nil) {
        self.apiService = apiService

        // Pre-fill if provided
        if let groupId = groupId {
            self.selectedGroup = Group(id: groupId, name: "", currency: "USD")
        }
        if let payeeId = payeeId {
            self.payeeId = payeeId
        }
        if let amount = amount {
            self.amount = String(format: "%.2f", amount)
        }
    }

    func loadData() async {
        isLoading = true
        error = nil

        do {
            async let groupsData = apiService.get(endpoint: "/groups", responseType: [Group].self)
            async let userData = apiService.get(endpoint: "/users/me", responseType: User.self)

            let (fetchedGroups, user) = try await (groupsData, userData)

            groups = fetchedGroups
            currentUserId = user.id
            payerId = user.id

            // Update selected group if pre-filled
            if let groupId = selectedGroup?.id {
                selectedGroup = groups.first { $0.id == groupId }
            }

        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func validate() -> Bool {
        validationErrors.removeAll()

        if payerId.isEmpty {
            validationErrors["payerId"] = "Payer is required"
        }

        if payeeId.isEmpty {
            validationErrors["payeeId"] = "Payee is required"
        }

        if payerId == payeeId {
            validationErrors["payeeId"] = "Payer and payee must be different"
        }

        guard let amountValue = Double(amount), amountValue > 0 else {
            validationErrors["amount"] = "Amount must be greater than 0"
            return false
        }

        if amountValue > 1_000_000 {
            validationErrors["amount"] = "Amount is too large"
        }

        if referenceNumber.count > 100 {
            validationErrors["referenceNumber"] = "Reference number is too long"
        }

        if notes.count > 500 {
            validationErrors["notes"] = "Notes are too long"
        }

        return validationErrors.isEmpty
    }

    func createSettlement() async throws {
        guard validate() else {
            throw NSError(domain: "Validation", code: 400, userInfo: [NSLocalizedDescriptionKey: "Please fix validation errors"])
        }

        guard let amountValue = Double(amount) else {
            throw NSError(domain: "Validation", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid amount"])
        }

        let settlementData = SettlementCreate(
            groupId: selectedGroup?.id,
            payerId: payerId,
            payeeId: payeeId,
            amount: amountValue,
            paymentMethod: paymentMethod,
            referenceNumber: referenceNumber.isEmpty ? nil : referenceNumber,
            notes: notes.isEmpty ? nil : notes,
            settledAt: ISO8601DateFormatter().string(from: settlementDate)
        )

        _ = try await apiService.post(
            endpoint: "/settlements",
            body: settlementData,
            responseType: Settlement.self
        )

        // TODO: Upload proof images if any
        if !proofImages.isEmpty {
            print("Images to upload: \(proofImages.count)")
        }
    }

    func loadPhotos() {
        Task {
            for item in selectedPhotosItems {
                if let data = try? await item.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    proofImages.append(image)
                }
            }
        }
    }

    func removeImage(at index: Int) {
        proofImages.remove(at: index)
    }

    var groupMembers: [GroupMember] {
        selectedGroup?.members ?? []
    }

    var availablePayers: [GroupMember] {
        groupMembers.filter { $0.userId != payeeId }
    }

    var availablePayees: [GroupMember] {
        groupMembers.filter { $0.userId != payerId }
    }

    func getUserName(for userId: String) -> String {
        if userId == currentUserId {
            return "Me"
        }

        if let member = groupMembers.first(where: { $0.userId == userId }) {
            return member.user?.name ?? "Unknown"
        }

        return "Unknown"
    }

    var isValid: Bool {
        !payerId.isEmpty &&
        !payeeId.isEmpty &&
        payerId != payeeId &&
        Double(amount) ?? 0 > 0
    }
}
