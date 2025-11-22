//
//  ThemeManager.swift
//  SplitTab
//
//  Manages app theme and appearance
//

import SwiftUI

class ThemeManager: ObservableObject {
    @Published var colorScheme: ColorScheme?

    private let themeKey = "com.splittab.theme"

    enum Theme: String, CaseIterable {
        case light
        case dark
        case system

        var displayName: String {
            rawValue.capitalized
        }

        var colorScheme: ColorScheme? {
            switch self {
            case .light:
                return .light
            case .dark:
                return .dark
            case .system:
                return nil
            }
        }
    }

    var currentTheme: Theme {
        get {
            if let themeString = UserDefaults.standard.string(forKey: themeKey),
               let theme = Theme(rawValue: themeString) {
                return theme
            }
            return .system
        }
        set {
            UserDefaults.standard.set(newValue.rawValue, forKey: themeKey)
            colorScheme = newValue.colorScheme
        }
    }

    init() {
        colorScheme = currentTheme.colorScheme
    }
}
