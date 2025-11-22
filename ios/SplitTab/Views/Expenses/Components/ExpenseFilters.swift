//
//  ExpenseFilters.swift
//  SplitTab
//
//  Expense Filters Component
//

import SwiftUI

struct ExpenseFiltersSheet: View {
    @Environment(\.dismiss) var dismiss
    @ObservedObject var viewModel: ExpenseListViewModel
    let groups: [Group]

    var body: some View {
        NavigationView {
            Form {
                Section("Search") {
                    TextField("Search expenses...", text: $viewModel.searchText)
                }

                if !groups.isEmpty {
                    Section("Group") {
                        Picker("Group", selection: $viewModel.selectedGroupId) {
                            Text("All Groups").tag(nil as String?)
                            ForEach(groups, id: \.id) { group in
                                Text(group.name).tag(group.id as String?)
                            }
                        }
                    }
                }

                Section("Category") {
                    Picker("Category", selection: $viewModel.selectedCategory) {
                        Text("All Categories").tag(nil as ExpenseCategory?)
                        ForEach(ExpenseCategory.allCases, id: \.self) { category in
                            HStack {
                                Image(systemName: category.iconName)
                                Text(category.displayName)
                            }
                            .tag(category as ExpenseCategory?)
                        }
                    }
                }

                Section("Date Range") {
                    DatePicker(
                        "Start Date",
                        selection: Binding(
                            get: { viewModel.startDate ?? Date() },
                            set: { viewModel.startDate = $0 }
                        ),
                        displayedComponents: .date
                    )

                    DatePicker(
                        "End Date",
                        selection: Binding(
                            get: { viewModel.endDate ?? Date() },
                            set: { viewModel.endDate = $0 }
                        ),
                        displayedComponents: .date
                    )
                }

                Section("Sort By") {
                    Picker("Sort", selection: $viewModel.sortOption) {
                        ForEach(ExpenseListViewModel.SortOption.allCases, id: \.self) { option in
                            Text(option.rawValue).tag(option)
                        }
                    }
                }

                Section {
                    Button("Reset Filters", role: .destructive) {
                        viewModel.resetFilters()
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    ExpenseFiltersSheet(
        viewModel: ExpenseListViewModel(),
        groups: []
    )
}
