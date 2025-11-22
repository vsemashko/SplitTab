//
//  MembersView.swift
//  SplitTab
//
//  Members View
//

import SwiftUI

struct MembersView: View {
    @StateObject private var viewModel: GroupSettingsViewModel
    @State private var searchText = ""
    @State private var roleFilter: RoleFilter = .all
    @State private var memberToRemove: GroupMember?
    @State private var showRemoveAlert = false
    @State private var showInviteSheet = false

    enum RoleFilter: String, CaseIterable {
        case all = "All"
        case owner = "Owner"
        case admin = "Admin"
        case member = "Member"
    }

    init(groupId: String) {
        _viewModel = StateObject(wrappedValue: GroupSettingsViewModel(groupId: groupId))
    }

    var filteredMembers: [GroupMember] {
        guard let members = viewModel.group?.members else { return [] }

        var filtered = members

        // Search filter
        if !searchText.isEmpty {
            filtered = filtered.filter { member in
                member.user?.name.localizedCaseInsensitiveContains(searchText) == true ||
                member.user?.email.localizedCaseInsensitiveContains(searchText) == true
            }
        }

        // Role filter
        if roleFilter != .all {
            filtered = filtered.filter { member in
                member.role.rawValue == roleFilter.rawValue.lowercased()
            }
        }

        // Sort by role priority, then name
        return filtered.sorted { member1, member2 in
            let rolePriority: [GroupRole: Int] = [.owner: 0, .admin: 1, .member: 2]
            let priority1 = rolePriority[member1.role] ?? 3
            let priority2 = rolePriority[member2.role] ?? 3

            if priority1 != priority2 {
                return priority1 < priority2
            }

            return (member1.user?.name ?? "") < (member2.user?.name ?? "")
        }
    }

    var body: some View {
        List {
            if viewModel.isLoading {
                Section {
                    HStack {
                        Spacer()
                        ProgressView()
                        Spacer()
                    }
                }
            } else {
                Section {
                    Picker("Filter", selection: $roleFilter) {
                        ForEach(RoleFilter.allCases, id: \.self) { filter in
                            Text(filter.rawValue).tag(filter)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Section {
                    ForEach(filteredMembers) { member in
                        MemberRow(
                            member: member,
                            isCurrentUser: member.userId == viewModel.currentUserId,
                            canManage: viewModel.isUserAdmin() && member.role != .owner,
                            onChangeRole: { newRole in
                                Task {
                                    do {
                                        try await viewModel.changeMemberRole(
                                            memberId: member.id,
                                            newRole: newRole
                                        )
                                    } catch {
                                        // Handle error
                                    }
                                }
                            },
                            onRemove: {
                                memberToRemove = member
                                showRemoveAlert = true
                            }
                        )
                    }
                } header: {
                    HStack {
                        Text("Members")
                        Spacer()
                        Text("\(filteredMembers.count)")
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .navigationTitle("Members")
        .navigationBarTitleDisplayMode(.inline)
        .searchable(text: $searchText, prompt: "Search members")
        .toolbar {
            if viewModel.isUserAdmin() {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showInviteSheet = true
                    } label: {
                        Image(systemName: "person.badge.plus")
                    }
                }
            }
        }
        .alert("Remove Member", isPresented: $showRemoveAlert, presenting: memberToRemove) { member in
            Button("Cancel", role: .cancel) {}
            Button("Remove", role: .destructive) {
                Task {
                    do {
                        try await viewModel.removeMember(memberId: member.id)
                    } catch {
                        // Handle error
                    }
                }
            }
        } message: { member in
            Text("Are you sure you want to remove \(member.user?.name ?? "this member") from the group?")
        }
        .sheet(isPresented: $showInviteSheet) {
            InviteMembersSheet(viewModel: viewModel)
        }
        .task {
            await viewModel.fetchData()
        }
    }
}

#Preview {
    NavigationStack {
        MembersView(groupId: "sample-group-id")
    }
}
