import SwiftUI

struct SettlementListView: View {
    @StateObject private var viewModel = SettlementListViewModel()
    @State private var selectedTab = 0
    @State private var showingCreateSheet = false
    @State private var showingError = false
    @State private var settlementToConfirm: Settlement?
    @State private var settlementToCancel: Settlement?
    @State private var settlementToDelete: Settlement?

    var body: some View {
        VStack(spacing: 0) {
            // Stats
            if let stats = viewModel.stats {
                SettlementStatsView(stats: stats)
                    .padding()
            }

            // Search Bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)

                TextField("Search settlements...", text: $viewModel.searchQuery)
                    .textFieldStyle(.plain)

                if !viewModel.searchQuery.isEmpty {
                    Button(action: { viewModel.searchQuery = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(10)
            .padding(.horizontal)

            // Filters
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    // Sort Menu
                    Menu {
                        ForEach(SettlementListViewModel.SortOption.allCases, id: \.self) { option in
                            Button(action: { viewModel.sortOption = option }) {
                                HStack {
                                    Text(option.rawValue)
                                    if viewModel.sortOption == option {
                                        Image(systemName: "checkmark")
                                    }
                                }
                            }
                        }
                    } label: {
                        HStack {
                            Image(systemName: "arrow.up.arrow.down")
                            Text(viewModel.sortOption.rawValue)
                        }
                        .font(.subheadline)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                    }

                    // Status Filter
                    Menu {
                        Button(action: { viewModel.filterStatus = nil }) {
                            Text("All Statuses")
                        }
                        ForEach([SettlementStatus.pending, .confirmed, .cancelled], id: \.self) { status in
                            Button(action: { viewModel.filterStatus = status }) {
                                HStack {
                                    Text(status.rawValue.capitalized)
                                    if viewModel.filterStatus == status {
                                        Image(systemName: "checkmark")
                                    }
                                }
                            }
                        }
                    } label: {
                        HStack {
                            Image(systemName: "line.3.horizontal.decrease.circle")
                            Text(viewModel.filterStatus?.rawValue.capitalized ?? "All")
                        }
                        .font(.subheadline)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical, 8)

            // Tabs
            Picker("Filter", selection: $selectedTab) {
                Text("All (\(viewModel.filteredAndSortedSettlements.count))").tag(0)
                Text("Pending (\(viewModel.pendingSettlements.count))").tag(1)
                Text("Confirmed (\(viewModel.confirmedSettlements.count))").tag(2)
                Text("Cancelled (\(viewModel.cancelledSettlements.count))").tag(3)
            }
            .pickerStyle(.segmented)
            .padding()

            // Content
            TabView(selection: $selectedTab) {
                SettlementsList(
                    settlements: viewModel.filteredAndSortedSettlements,
                    currentUserId: viewModel.currentUserId,
                    onConfirm: { settlementToConfirm = $0 },
                    onCancel: { settlementToCancel = $0 },
                    onDelete: { settlementToDelete = $0 }
                )
                .tag(0)

                SettlementsList(
                    settlements: viewModel.pendingSettlements,
                    currentUserId: viewModel.currentUserId,
                    onConfirm: { settlementToConfirm = $0 },
                    onCancel: { settlementToCancel = $0 },
                    onDelete: { settlementToDelete = $0 }
                )
                .tag(1)

                SettlementsList(
                    settlements: viewModel.confirmedSettlements,
                    currentUserId: viewModel.currentUserId
                )
                .tag(2)

                SettlementsList(
                    settlements: viewModel.cancelledSettlements,
                    currentUserId: viewModel.currentUserId
                )
                .tag(3)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
        }
        .navigationTitle("Settlements")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingCreateSheet = true }) {
                    Image(systemName: "plus")
                }
            }
        }
        .task {
            await viewModel.loadData()
        }
        .refreshable {
            await viewModel.loadData()
        }
        .sheet(isPresented: $showingCreateSheet) {
            NavigationView {
                CreateSettlementView()
            }
        }
        .confirmationDialog("Confirm Settlement",
                           isPresented: Binding(
                            get: { settlementToConfirm != nil },
                            set: { if !$0 { settlementToConfirm = nil }}
                           ),
                           presenting: settlementToConfirm) { settlement in
            Button("Confirm Payment") {
                Task {
                    do {
                        try await viewModel.confirmSettlement(settlement.id)
                        settlementToConfirm = nil
                    } catch {
                        viewModel.error = error.localizedDescription
                        showingError = true
                    }
                }
            }
            Button("Cancel", role: .cancel) {
                settlementToConfirm = nil
            }
        } message: { settlement in
            Text("Confirm that you received \(formatCurrency(settlement.amount, currency: settlement.currency ?? "USD"))?")
        }
        .confirmationDialog("Cancel Settlement",
                           isPresented: Binding(
                            get: { settlementToCancel != nil },
                            set: { if !$0 { settlementToCancel = nil }}
                           ),
                           presenting: settlementToCancel) { settlement in
            Button("Cancel Settlement", role: .destructive) {
                Task {
                    do {
                        try await viewModel.cancelSettlement(settlement.id)
                        settlementToCancel = nil
                    } catch {
                        viewModel.error = error.localizedDescription
                        showingError = true
                    }
                }
            }
            Button("Keep", role: .cancel) {
                settlementToCancel = nil
            }
        } message: { _ in
            Text("Are you sure you want to cancel this settlement?")
        }
        .alert("Delete Settlement",
               isPresented: Binding(
                get: { settlementToDelete != nil },
                set: { if !$0 { settlementToDelete = nil }}
               ),
               presenting: settlementToDelete) { settlement in
            Button("Delete", role: .destructive) {
                Task {
                    do {
                        try await viewModel.deleteSettlement(settlement.id)
                        settlementToDelete = nil
                    } catch {
                        viewModel.error = error.localizedDescription
                        showingError = true
                    }
                }
            }
            Button("Cancel", role: .cancel) {
                settlementToDelete = nil
            }
        } message: { _ in
            Text("This action cannot be undone.")
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK") {}
        } message: {
            Text(viewModel.error ?? "An error occurred")
        }
    }

    private func formatCurrency(_ amount: Double, currency: String) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }
}

struct SettlementsList: View {
    let settlements: [Settlement]
    let currentUserId: String
    var onConfirm: ((Settlement) -> Void)?
    var onCancel: ((Settlement) -> Void)?
    var onDelete: ((Settlement) -> Void)?

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                if settlements.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "doc.text.magnifyingglass")
                            .font(.system(size: 60))
                            .foregroundColor(.secondary)

                        Text("No settlements found")
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 60)
                } else {
                    ForEach(settlements) { settlement in
                        NavigationLink(destination: SettlementDetailView(settlementId: settlement.id)) {
                            SettlementRow(
                                settlement: settlement,
                                currentUserId: currentUserId
                            )
                        }
                        .buttonStyle(.plain)
                        .contextMenu {
                            if settlement.status == .pending && settlement.payeeId == currentUserId {
                                Button(action: { onConfirm?(settlement) }) {
                                    Label("Confirm Payment", systemImage: "checkmark.circle")
                                }
                            }

                            if settlement.status == .pending {
                                Button(action: { onCancel?(settlement) }) {
                                    Label("Cancel", systemImage: "xmark.circle")
                                }
                            }

                            if settlement.status != .confirmed {
                                Button(role: .destructive, action: { onDelete?(settlement) }) {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                        }
                    }
                }
            }
            .padding()
        }
    }
}
