//
//  CreateGroupViewModel.swift
//  SplitTab
//
//  Create Group View Model
//

import Foundation
import Combine

@MainActor
class CreateGroupViewModel: ObservableObject {
    @Published var name = ""
    @Published var description = ""
    @Published var selectedCurrency = "USD"
    @Published var selectedCategory: GroupCategory?
    @Published var memberEmail = ""
    @Published var memberEmails: [String] = []
    @Published var isSubmitting = false
    @Published var error: String?
    @Published var validationErrors: [String: String] = [:]

    private let networkManager = NetworkManager.shared

    enum GroupCategory: String, CaseIterable {
        case trip = "Trip/Vacation"
        case household = "Household/Roommates"
        case event = "Event/Party"
        case couple = "Couple"
        case friends = "Friends"
        case project = "Project"
        case other = "Other"

        var icon: String {
            switch self {
            case .trip: return "✈️"
            case .household: return "🏠"
            case .event: return "🎉"
            case .couple: return "💑"
            case .friends: return "👥"
            case .project: return "💼"
            case .other: return "📋"
            }
        }
    }

    let currencyOptions = [
        "USD", "EUR", "GBP", "JPY", "CAD",
        "AUD", "CHF", "CNY", "INR", "SGD"
    ]

    func validate() -> Bool {
        validationErrors.removeAll()

        if name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            validationErrors["name"] = "Group name is required"
        } else if name.count < 2 {
            validationErrors["name"] = "Group name must be at least 2 characters"
        } else if name.count > 100 {
            validationErrors["name"] = "Group name must not exceed 100 characters"
        }

        if description.count > 500 {
            validationErrors["description"] = "Description must not exceed 500 characters"
        }

        return validationErrors.isEmpty
    }

    func addMemberEmail() {
        let trimmedEmail = memberEmail.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !trimmedEmail.isEmpty else { return }

        guard isValidEmail(trimmedEmail) else {
            error = "Please enter a valid email address"
            return
        }

        guard !memberEmails.contains(trimmedEmail) else {
            error = "Email already added"
            return
        }

        memberEmails.append(trimmedEmail)
        memberEmail = ""
        error = nil
    }

    func removeMemberEmail(_ email: String) {
        memberEmails.removeAll { $0 == email }
    }

    func createGroup() async throws -> Group {
        guard validate() else {
            throw NSError(
                domain: "ValidationError",
                code: 400,
                userInfo: [NSLocalizedDescriptionKey: validationErrors.values.first ?? "Validation failed"]
            )
        }

        isSubmitting = true
        error = nil

        defer { isSubmitting = false }

        let groupCreate = GroupCreate(
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            description: description.isEmpty ? nil : description.trimmingCharacters(in: .whitespacesAndNewlines),
            currency: selectedCurrency,
            memberEmails: memberEmails.isEmpty ? nil : memberEmails
        )

        let endpoint = APIEndpoint.groups
        let response: APIResponse<Group> = try await networkManager.request(
            endpoint,
            method: .post,
            body: groupCreate
        )

        guard let group = response.data else {
            throw NSError(
                domain: "CreateGroupError",
                code: 500,
                userInfo: [NSLocalizedDescriptionKey: "Failed to create group"]
            )
        }

        return group
    }

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
}
