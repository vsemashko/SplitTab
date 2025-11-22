//
//  CategoryIcon.swift
//  SplitTab
//
//  Category Icon Component
//

import SwiftUI

struct CategoryIconView: View {
    let category: ExpenseCategory
    var size: CGFloat = 40

    var body: some View {
        ZStack {
            Circle()
                .fill(categoryColor.opacity(0.2))
                .frame(width: size, height: size)

            Image(systemName: category.iconName)
                .font(.system(size: size * 0.5))
                .foregroundColor(categoryColor)
        }
    }

    private var categoryColor: Color {
        switch category {
        case .food:
            return .orange
        case .transport:
            return .blue
        case .accommodation:
            return .purple
        case .entertainment:
            return .pink
        case .shopping:
            return .green
        case .utilities:
            return .yellow
        case .other:
            return .gray
        }
    }
}

struct CategoryPicker: View {
    @Binding var selectedCategory: ExpenseCategory

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Category")
                .font(.headline)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(ExpenseCategory.allCases, id: \.self) { category in
                        VStack(spacing: 8) {
                            CategoryIconView(category: category, size: 50)

                            Text(category.displayName)
                                .font(.caption)
                                .lineLimit(1)
                        }
                        .frame(width: 80)
                        .padding(.vertical, 8)
                        .background(
                            selectedCategory == category ?
                                Color.primary.opacity(0.1) : Color.clear
                        )
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(
                                    selectedCategory == category ?
                                        Color.primary : Color.clear,
                                    lineWidth: 2
                                )
                        )
                        .onTapGesture {
                            selectedCategory = category
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

#Preview {
    VStack {
        CategoryIconView(category: .food)
        CategoryPicker(selectedCategory: .constant(.food))
    }
}
