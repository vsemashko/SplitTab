//
//  RoleBadge.swift
//  SplitTab
//
//  Role Badge Component
//

import SwiftUI

struct RoleBadge: View {
    let role: GroupRole

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: roleIcon)
                .font(.caption2)

            Text(role.displayName)
                .font(.caption)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(roleBackgroundColor)
        .foregroundColor(roleForegroundColor)
        .cornerRadius(6)
    }

    private var roleIcon: String {
        switch role {
        case .owner:
            return "crown.fill"
        case .admin:
            return "shield.fill"
        case .member:
            return "person.fill"
        }
    }

    private var roleBackgroundColor: Color {
        switch role {
        case .owner:
            return Color.yellow.opacity(0.2)
        case .admin:
            return Color.blue.opacity(0.2)
        case .member:
            return Color.secondary.opacity(0.2)
        }
    }

    private var roleForegroundColor: Color {
        switch role {
        case .owner:
            return .yellow
        case .admin:
            return .blue
        case .member:
            return .secondary
        }
    }
}

#Preview {
    VStack(spacing: 12) {
        RoleBadge(role: .owner)
        RoleBadge(role: .admin)
        RoleBadge(role: .member)
    }
    .padding()
}
