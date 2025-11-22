//
//  MemberRow.swift
//  SplitTab
//
//  Member Row Component
//

import SwiftUI

struct MemberRow: View {
    let member: GroupMember
    let isCurrentUser: Bool
    let canManage: Bool
    var onChangeRole: ((GroupRole) -> Void)?
    var onRemove: (() -> Void)?

    @State private var showActionSheet = false

    var body: some View {
        HStack(spacing: 12) {
            // User Avatar
            if let profileUrl = member.user?.profilePictureUrl {
                AsyncImage(url: URL(string: profileUrl)) { image in
                    image
                        .resizable()
                        .scaledToFill()
                } placeholder: {
                    UserAvatarPlaceholder(name: member.user?.name ?? "U")
                }
                .frame(width: 48, height: 48)
                .clipShape(Circle())
            } else {
                UserAvatarPlaceholder(name: member.user?.name ?? "U")
                    .frame(width: 48, height: 48)
            }

            // Member Info
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text(member.user?.name ?? "Unknown User")
                        .font(.headline)

                    if isCurrentUser {
                        Text("(You)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    RoleBadge(role: member.role)
                }

                Text(member.user?.email ?? "")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text("Joined \(formatDate(member.joinedAt))")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Actions
            if canManage && !isCurrentUser && member.role != .owner {
                Button {
                    showActionSheet = true
                } label: {
                    Image(systemName: "ellipsis")
                        .foregroundColor(.secondary)
                        .frame(width: 32, height: 32)
                }
                .confirmationDialog("Member Actions", isPresented: $showActionSheet) {
                    if member.role != .admin {
                        Button("Make Admin") {
                            onChangeRole?(.admin)
                        }
                    }

                    if member.role == .admin {
                        Button("Make Member") {
                            onChangeRole?(.member)
                        }
                    }

                    Button("Remove from Group", role: .destructive) {
                        onRemove?()
                    }

                    Button("Cancel", role: .cancel) {}
                }
            }
        }
        .padding(.vertical, 8)
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

struct UserAvatarPlaceholder: View {
    let name: String

    var body: some View {
        ZStack {
            Circle()
                .fill(Color.blue.opacity(0.2))

            Text(name.prefix(1).uppercased())
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.blue)
        }
    }
}

#Preview {
    VStack {
        MemberRow(
            member: GroupMember(
                id: "1",
                groupId: "group1",
                userId: "user1",
                role: .admin,
                joinedAt: Date(),
                user: User(
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
                )
            ),
            isCurrentUser: false,
            canManage: true
        )
        .padding()
    }
}
