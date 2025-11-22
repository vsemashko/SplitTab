//
//  GroupListView.swift
//  SplitTab
//
//  Group List View
//

import SwiftUI

struct GroupListView: View {
    @StateObject private var viewModel = GroupListViewModel()
    @State private var showFilters = false
    @State private var showCreateGroup = false
    @State private var groupToDelete: Group?
    @State private var showDeleteAlert = false

    var body: some View {
        NavigationStack {
            ZStack {
                if viewModel.isLoading && viewModel.groups.isEmpty {
                    // Loading state
                    VStack(spacing: 16) {
                        ProgressView()
                        Text("Loading groups...")
                            .foregroundColor(.secondary)
                    }
                } else if let error = viewModel.error {
                    // Error state
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 48))
                            .foregroundColor(.red)

                        Text("Error")
                            .font(.headline)

                        Text(error)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)

                        Button("Retry") {
                            Task {
                                await viewModel.fetchGroups()
                            }
                        }
                        .buttonStyle(.bordered)
                    }
                } else if viewModel.filteredGroups.isEmpty {
                    // Empty state
                    VStack(spacing: 16) {
                        Image(systemName: "person.2.circle")
                            .font(.system(size: 64))
                            .foregroundColor(.secondary)

                        Text("No Groups")
                            .font(.title2)
                            .fontWeight(.semibold)

                        Text(viewModel.groups.isEmpty ?
                             "Get started by creating your first group" :
                             "Try adjusting your filters")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)

                        if viewModel.groups.isEmpty {
                            Button {
                                showCreateGroup = true
                            } label: {
                                Label("Create Group", systemImage: "plus")
                            }
                            .buttonStyle(.borderedProminent)
                            .padding(.top)
                        }
                    }
                    .padding()
                } else {
                    // Group list
                    List {
                        // Stats section
                        Section {
                            GroupStatsView(
                                totalGroups: viewModel.totalGroups,
                                adminGroups: viewModel.adminGroups,
                                totalMembers: viewModel.totalMembers
                            )
                        }

                        // Groups
                        Section {
                            ForEach(viewModel.filteredGroups) { group in
                                NavigationLink(destination: GroupDetailView(groupId: group.id)) {
                                    GroupCard(
                                        group: group,
                                        isAdmin: viewModel.isUserAdmin(for: group)
                                    )
                                }
                                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                                .listRowSeparator(.hidden)
                                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                    if viewModel.isUserAdmin(for: group) {
                                        Button(role: .destructive) {
                                            groupToDelete = group
                                            showDeleteAlert = true
                                        } label: {
                                            Label("Delete", systemImage: "trash")
                                        }
                                    } else {
                                        Button(role: .destructive) {
                                            Task {
                                                do {
                                                    try await viewModel.leaveGroup(group)
                                                } catch {
                                                    // Show error
                                                }
                                            }
                                        } label: {
                                            Label("Leave", systemImage: "arrow.right.square")
                                        }
                                    }
                                }
                            }
                        } header: {
                            HStack {
                                Text("Groups")
                                Spacer()
                                Text("\(viewModel.filteredGroups.count)")
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                    .refreshable {
                        await viewModel.fetchGroups()
                    }
                }
            }
            .navigationTitle("Groups")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $viewModel.searchText, prompt: "Search groups")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showFilters = true
                    } label: {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showCreateGroup = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showFilters) {
                GroupFiltersSheet(viewModel: viewModel)
            }
            .sheet(isPresented: $showCreateGroup) {
                CreateGroupView()
            }
            .alert("Delete Group", isPresented: $showDeleteAlert, presenting: groupToDelete) { group in
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    Task {
                        do {
                            try await viewModel.deleteGroup(group)
                        } catch {
                            // Show error
                        }
                    }
                }
            } message: { group in
                Text("Are you sure you want to delete \"\(group.name)\"? This action cannot be undone.")
            }
            .task {
                await viewModel.fetchGroups()
            }
        }
    }
}

struct GroupStatsView: View {
    let totalGroups: Int
    let adminGroups: Int
    let totalMembers: Int

    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 16) {
                StatCard(
                    title: "Total Groups",
                    value: "\(totalGroups)",
                    icon: "person.2.circle",
                    color: .blue
                )

                StatCard(
                    title: "Admin",
                    value: "\(adminGroups)",
                    icon: "shield.fill",
                    color: .green
                )

                StatCard(
                    title: "Members",
                    value: "\(totalMembers)",
                    icon: "person.3.fill",
                    color: .orange
                )
            }
        }
    }
}

struct GroupFiltersSheet: View {
    @ObservedObject var viewModel: GroupListViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Role") {
                    Picker("Filter by role", selection: $viewModel.roleFilter) {
                        ForEach(GroupListViewModel.RoleFilter.allCases, id: \.self) { filter in
                            Text(filter.rawValue).tag(filter)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Section("Sort") {
                    Picker("Sort by", selection: $viewModel.sortOption) {
                        ForEach(GroupListViewModel.SortOption.allCases, id: \.self) { option in
                            Text(option.rawValue).tag(option)
                        }
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    GroupListView()
}
