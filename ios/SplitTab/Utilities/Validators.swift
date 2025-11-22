//
//  Validators.swift
//  SplitTab
//
//  Input validation utilities
//

import Foundation

struct Validators {
    // MARK: - Email Validation

    static func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }

    // MARK: - Password Validation

    static func isValidPassword(_ password: String) -> Bool {
        return password.count >= AppConfig.minPasswordLength
    }

    static func passwordStrength(_ password: String) -> PasswordStrength {
        var strength = 0

        if password.count >= 8 { strength += 1 }
        if password.count >= 12 { strength += 1 }
        if password.range(of: "[A-Z]", options: .regularExpression) != nil { strength += 1 }
        if password.range(of: "[a-z]", options: .regularExpression) != nil { strength += 1 }
        if password.range(of: "[0-9]", options: .regularExpression) != nil { strength += 1 }
        if password.range(of: "[^A-Za-z0-9]", options: .regularExpression) != nil { strength += 1 }

        switch strength {
        case 0...2:
            return .weak
        case 3...4:
            return .medium
        default:
            return .strong
        }
    }

    enum PasswordStrength {
        case weak
        case medium
        case strong

        var color: Color {
            switch self {
            case .weak:
                return .red
            case .medium:
                return .orange
            case .strong:
                return .green
            }
        }

        var text: String {
            switch self {
            case .weak:
                return "Weak"
            case .medium:
                return "Medium"
            case .strong:
                return "Strong"
            }
        }
    }

    // MARK: - Name Validation

    static func isValidName(_ name: String) -> Bool {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.count > 0 && trimmed.count <= AppConfig.maxNameLength
    }

    // MARK: - Amount Validation

    static func isValidAmount(_ amount: Double) -> Bool {
        return amount > 0 && amount < 1_000_000_000
    }

    // MARK: - Currency Validation

    static func isValidCurrency(_ currency: String) -> Bool {
        return currency.count == 3 && currency.uppercased() == currency
    }
}
