import Foundation
import Combine

@MainActor
class SettlementDetailViewModel: ObservableObject {
    @Published var settlement: Settlement?
    @Published var isLoading = false
    @Published var error: String?

    private let settlementId: String
    private let apiService: APIService
    private var cancellables = Set<AnyCancellable>()
    private(set) var currentUserId: String = ""

    init(settlementId: String, apiService: APIService = .shared) {
        self.settlementId = settlementId
        self.apiService = apiService
    }

    func loadData() async {
        isLoading = true
        error = nil

        do {
            async let settlementData = apiService.get(
                endpoint: "/settlements/\(settlementId)",
                responseType: Settlement.self
            )
            async let userData = apiService.get(
                endpoint: "/users/me",
                responseType: User.self
            )

            let (fetchedSettlement, user) = try await (settlementData, userData)

            settlement = fetchedSettlement
            currentUserId = user.id

        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func confirmSettlement() async throws {
        guard let settlement = settlement else { return }

        let confirmed = try await apiService.post(
            endpoint: "/settlements/\(settlement.id)/confirm",
            body: EmptyBody(),
            responseType: Settlement.self
        )

        self.settlement = confirmed
    }

    func cancelSettlement() async throws {
        guard let settlement = settlement else { return }

        let cancelled = try await apiService.post(
            endpoint: "/settlements/\(settlement.id)/cancel",
            body: EmptyBody(),
            responseType: Settlement.self
        )

        self.settlement = cancelled
    }

    func deleteSettlement() async throws {
        guard let settlement = settlement else { return }
        try await apiService.delete(endpoint: "/settlements/\(settlement.id)")
    }

    var isPayer: Bool {
        settlement?.payerId == currentUserId
    }

    var isPayee: Bool {
        settlement?.payeeId == currentUserId
    }

    var canConfirm: Bool {
        isPayee && settlement?.status == .pending
    }

    var canCancel: Bool {
        (isPayer || isPayee) && settlement?.status == .pending
    }

    var canDelete: Bool {
        (isPayer || isPayee) && settlement?.status != .confirmed
    }

    func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = settlement?.currency ?? "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }

    func getPaymentMethodLabel(_ method: PaymentMethod?) -> String {
        guard let method = method else { return "Not specified" }

        switch method {
        case .cash: return "Cash"
        case .creditCard: return "Credit Card"
        case .debitCard: return "Debit Card"
        case .bankTransfer: return "Bank Transfer"
        case .venmo: return "Venmo"
        case .paypal: return "PayPal"
        case .zelle: return "Zelle"
        case .applePay: return "Apple Pay"
        case .googlePay: return "Google Pay"
        case .other: return "Other"
        }
    }

    func getStatusColor(_ status: SettlementStatus) -> String {
        switch status {
        case .pending: return "yellow"
        case .confirmed: return "green"
        case .cancelled: return "gray"
        }
    }

    func getStatusIcon(_ status: SettlementStatus) -> String {
        switch status {
        case .pending: return "clock"
        case .confirmed: return "checkmark.circle.fill"
        case .cancelled: return "xmark.circle.fill"
        }
    }
}

private struct EmptyBody: Codable {}
