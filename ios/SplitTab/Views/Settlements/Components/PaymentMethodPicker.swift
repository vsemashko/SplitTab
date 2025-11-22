import SwiftUI

struct PaymentMethodPicker: View {
    @Binding var selectedMethod: PaymentMethod?

    var body: some View {
        Menu {
            Button(action: { selectedMethod = nil }) {
                Label("None", systemImage: "xmark")
            }

            ForEach(PaymentMethod.allCases, id: \.self) { method in
                Button(action: { selectedMethod = method }) {
                    Label(method.displayName, systemImage: method.iconName)
                }
            }
        } label: {
            HStack {
                if let method = selectedMethod {
                    Image(systemName: method.iconName)
                        .foregroundColor(.blue)

                    Text(method.displayName)
                        .foregroundColor(.primary)
                } else {
                    Text("Select payment method")
                        .foregroundColor(.secondary)
                }

                Spacer()

                Image(systemName: "chevron.down")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(10)
        }
    }
}

extension PaymentMethod {
    var displayName: String {
        switch self {
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

    var iconName: String {
        switch self {
        case .cash: return "banknote"
        case .creditCard, .debitCard: return "creditcard"
        case .bankTransfer: return "building.columns"
        case .venmo, .paypal, .zelle: return "dollarsign.circle"
        case .applePay: return "apple.logo"
        case .googlePay: return "g.circle"
        case .other: return "ellipsis.circle"
        }
    }
}
