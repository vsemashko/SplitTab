# UI/UX Design Guidelines

## Overview

This document outlines the design principles, patterns, and guidelines for creating a consistent and intuitive user experience across all SplitTab platforms.

**Version**: 1.0
**Last Updated**: 2025-11-21

---

## Design Principles

### 1. Simplicity First
- Minimize cognitive load
- Clear hierarchy and information architecture
- Hide complexity, reveal gradually
- One primary action per screen

### 2. Financial Clarity
- Money amounts always prominent and clear
- Show who owes whom without ambiguity
- Visual indicators for debt direction (owe vs. owed)
- Clear currency indicators

### 3. Trust & Transparency
- All calculations visible and explainable
- Audit trail for changes
- Clear ownership of expenses
- Transparent split breakdowns

### 4. Speed & Efficiency
- Quick expense entry (< 30 seconds)
- Smart defaults based on context
- Bulk actions where appropriate
- Keyboard shortcuts (web)

### 5. Social & Friendly
- Human-friendly language
- Avoid financial jargon
- Celebratory moments (debt cleared!)
- Friendly reminders, not nagging

---

## Brand Identity

### Brand Values
- **Trustworthy**: Reliable, accurate, secure
- **Friendly**: Approachable, helpful, non-judgmental
- **Efficient**: Fast, simple, smart
- **Fair**: Transparent, unbiased, equitable

### Tone of Voice
- **Casual but professional**: "You owe Alice $20" not "Outstanding debt: $20"
- **Helpful**: Guide users, suggest actions
- **Positive**: "You're all settled up!" not "No debts remaining"
- **Direct**: Clear, concise, no fluff

---

## Color System

### Primary Colors

```css
/* Green - Primary actions, positive balances */
--color-primary: #10B981;
--color-primary-dark: #059669;
--color-primary-light: #D1FAE5;

/* Red - Negative balances, deletions */
--color-danger: #EF4444;
--color-danger-dark: #DC2626;
--color-danger-light: #FEE2E2;

/* Blue - Information, links */
--color-info: #3B82F6;
--color-info-dark: #2563EB;
--color-info-light: #DBEAFE;

/* Amber - Warnings, pending */
--color-warning: #F59E0B;
--color-warning-dark: #D97706;
--color-warning-light: #FEF3C7;
```

### Neutral Colors

```css
/* Gray scale */
--color-gray-50: #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-200: #E5E7EB;
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;
--color-gray-500: #6B7280;
--color-gray-600: #4B5563;
--color-gray-700: #374151;
--color-gray-800: #1F2937;
--color-gray-900: #111827;
```

### Semantic Colors

```css
/* Balance indicators */
--color-owed: var(--color-primary); /* They owe you (positive) */
--color-owing: var(--color-danger); /* You owe them (negative) */
--color-settled: var(--color-gray-400); /* Balanced */

/* Status */
--color-success: #10B981;
--color-error: #EF4444;
--color-pending: #F59E0B;
```

---

## Typography

### Font Family

```css
/* Primary font - System UI */
--font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                     Roboto, 'Helvetica Neue', Arial, sans-serif;

/* Monospace - For amounts */
--font-family-mono: 'SF Mono', Monaco, 'Cascadia Code',
                     'Courier New', monospace;
```

### Type Scale

```css
/* Mobile first, then desktop */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Type Usage

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| H1 | 2xl-3xl | Bold | Page titles |
| H2 | xl-2xl | Semibold | Section headers |
| H3 | lg-xl | Semibold | Subsection headers |
| Body | base | Normal | Body text |
| Caption | sm | Normal | Secondary info |
| Label | sm | Medium | Form labels |
| Amount | lg-2xl | Semibold | Money amounts |

---

## Spacing System

### Scale

```css
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.5rem;   /* 24px */
--space-6: 2rem;     /* 32px */
--space-8: 3rem;     /* 48px */
--space-10: 4rem;    /* 64px */
```

### Usage Guidelines

- **Tight spacing (4-8px)**: Related items, list items
- **Medium spacing (16-24px)**: Sections, cards
- **Loose spacing (32-48px)**: Major sections, page padding

---

## Components

### Buttons

#### Primary Button
```css
.button-primary {
  background: var(--color-primary);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
}
```

**Usage**: Main actions (Save, Create, Pay)

#### Secondary Button
```css
.button-secondary {
  background: white;
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
  padding: 12px 24px;
  border-radius: 8px;
}
```

**Usage**: Secondary actions (Cancel, Back)

#### Danger Button
```css
.button-danger {
  background: var(--color-danger);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
}
```

**Usage**: Destructive actions (Delete, Remove)

#### Button States
- **Default**: Normal appearance
- **Hover**: Darken by 10%
- **Active**: Darken by 15%, slight scale down
- **Disabled**: 40% opacity, no pointer events
- **Loading**: Show spinner, disable interaction

---

### Cards

```css
.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

**Usage**: Expenses, groups, settlements

---

### Input Fields

```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 16px;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.input.error {
  border-color: var(--color-danger);
}
```

**Label above input**:
```html
<label class="label">Amount</label>
<input type="number" class="input" placeholder="0.00" />
<span class="error-message">Amount is required</span>
```

---

### Amount Display

```css
.amount {
  font-family: var(--font-family-mono);
  font-size: 1.5rem;
  font-weight: 600;
}

.amount.positive {
  color: var(--color-owed);
}

.amount.negative {
  color: var(--color-owing);
}

.amount-currency {
  font-size: 0.875em;
  opacity: 0.7;
  margin-right: 4px;
}
```

**Example**:
```html
<div class="amount positive">
  <span class="amount-currency">$</span>
  <span class="amount-value">45.50</span>
</div>
```

---

### Balance Indicators

#### Balance Card
```
┌─────────────────────────────────┐
│ You owe                         │
│ $75.50                          │
│                                 │
│ You are owed                    │
│ $120.00                         │
│                                 │
│ Net balance                     │
│ +$44.50 ✓                       │
└─────────────────────────────────┘
```

**Color coding**:
- Negative balance (you owe): Red
- Positive balance (you're owed): Green
- Settled (zero): Gray with checkmark

---

### Avatars

```css
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-sm { width: 32px; height: 32px; }
.avatar-lg { width: 56px; height: 56px; }
.avatar-xl { width: 80px; height: 80px; }
```

**Fallback**: Show initials on colored background

```css
.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  font-weight: 600;
  font-size: 16px;
}
```

---

### Lists

#### Expense List Item

```
┌────────────────────────────────────────────┐
│ [Icon] Groceries              Nov 21       │
│        You paid $45.50                     │
│        [Alice] [Bob]                       │
│                                      $45.50│
└────────────────────────────────────────────┘
```

**Structure**:
- Icon/category on left
- Description (bold)
- Date (secondary)
- Participants (avatars)
- Amount (right aligned, prominent)

---

### Empty States

```
┌────────────────────────────────────────────┐
│                                            │
│              [Empty Icon]                  │
│                                            │
│        No expenses yet                     │
│        Add your first expense to           │
│        start tracking                      │
│                                            │
│           [+ Add Expense]                  │
│                                            │
└────────────────────────────────────────────┘
```

**Guidelines**:
- Friendly illustration or icon
- Clear headline
- Helpful subtext
- Primary action button

---

## Screen Layouts

### iOS Navigation Patterns

#### Tab Bar (Bottom)
```
┌─────────────────────────────────┐
│                                 │
│         Screen Content          │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Home] [Groups] [+] [Activity]  │
│                      [Profile]  │
└─────────────────────────────────┘
```

**Tabs**:
1. Dashboard (Home icon)
2. Groups (Group icon)
3. Add Expense (Plus icon, prominent)
4. Activity (List icon)
5. Profile (Person icon)

#### Navigation Bar (Top)
```
┌─────────────────────────────────┐
│ [<] Screen Title       [Action] │
└─────────────────────────────────┘
```

---

### Web Layout

#### Desktop Layout (1280px+)
```
┌───────────────────────────────────────────────┐
│ [Logo]        Navigation            [Profile] │
├───────────────────────────────────────────────┤
│                                               │
│  ┌────────────┐  ┌──────────────────────────┐│
│  │  Sidebar   │  │   Main Content           ││
│  │            │  │                          ││
│  │  Groups    │  │   Expenses List          ││
│  │  Friends   │  │                          ││
│  │  Activity  │  │                          ││
│  │            │  │                          ││
│  └────────────┘  └──────────────────────────┘│
│                                               │
└───────────────────────────────────────────────┘
```

#### Tablet/Mobile (< 1280px)
```
┌────────────────────┐
│ [☰] Title [Action] │
├────────────────────┤
│                    │
│   Main Content     │
│                    │
│                    │
│                    │
└────────────────────┘
```

Hamburger menu reveals navigation

---

## User Flows

### Add Expense Flow

#### Step 1: Amount & Description
```
┌─────────────────────────────────┐
│        Add Expense              │
├─────────────────────────────────┤
│                                 │
│  Amount                         │
│  $ [________]                   │
│                                 │
│  Description                    │
│  [_____________________]        │
│                                 │
│  [Continue]                     │
└─────────────────────────────────┘
```

#### Step 2: Who Paid
```
┌─────────────────────────────────┐
│        Who paid?                │
├─────────────────────────────────┤
│                                 │
│  ☑ You ($45.50)                 │
│  ☐ Alice                        │
│  ☐ Bob                          │
│                                 │
│  [Continue]                     │
└─────────────────────────────────┘
```

#### Step 3: Split Method
```
┌─────────────────────────────────┐
│      How to split?              │
├─────────────────────────────────┤
│                                 │
│  ☑ Split equally                │
│  ☐ Enter exact amounts          │
│  ☐ Split by percentage          │
│                                 │
│  You:   $22.75                  │
│  Alice: $22.75                  │
│                                 │
│  [Save Expense]                 │
└─────────────────────────────────┘
```

**Flow Principles**:
- One question per screen (mobile)
- Show progress indicator
- Smart defaults (equal split)
- Allow back navigation
- Summary before save

---

### Settlement Flow

#### Suggested Payments
```
┌─────────────────────────────────┐
│        Settle Up                │
├─────────────────────────────────┤
│                                 │
│ To clear all debts:             │
│                                 │
│ [You] ──$50──> [Alice]          │
│                                 │
│ [Record Payment]                │
│                                 │
└─────────────────────────────────┘
```

#### Record Payment
```
┌─────────────────────────────────┐
│     Record Payment              │
├─────────────────────────────────┤
│                                 │
│  You paid Alice                 │
│  $50.00                         │
│                                 │
│  Payment method                 │
│  ○ Cash                         │
│  ○ Venmo                        │
│  ○ Bank Transfer                │
│                                 │
│  [Confirm]                      │
└─────────────────────────────────┘
```

---

## Interaction Patterns

### Pull to Refresh
- Available on all list views
- Shows loading spinner at top
- Subtle haptic feedback (iOS)

### Swipe Actions (iOS)

```
┌────────────────────────────────┐
│ Groceries    Nov 21     $45.50 │  ← Swipe left
│                                │
│              [Delete]           │
└────────────────────────────────┘

┌────────────────────────────────┐
│        [Edit] [Settle]          │  ← Swipe right
│                                │
│ Groceries    Nov 21     $45.50 │
└────────────────────────────────┘
```

### Loading States

#### Skeleton Screens
```
┌────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓    ▓▓▓▓    ▓▓▓▓▓▓   │
│ ▓▓▓▓▓       ▓▓      ▓▓       │
│                                │
│ ▓▓▓▓▓▓▓▓    ▓▓▓▓    ▓▓▓▓▓▓   │
│ ▓▓▓▓▓       ▓▓      ▓▓       │
└────────────────────────────────┘
```

**Use skeleton screens for**:
- Initial page load
- List loading
- Card loading

#### Spinners
- Use for actions (save, delete)
- Button loading states
- Inline updates

---

## Feedback & Confirmations

### Success Messages

```
┌────────────────────────────────┐
│  ✓ Expense saved successfully  │
└────────────────────────────────┘
```

**Toast notification**:
- 3 seconds duration
- Green background
- Slide in from top

### Error Messages

```
┌────────────────────────────────┐
│  ✕ Failed to save expense      │
│     Please try again            │
└────────────────────────────────┘
```

**Toast notification**:
- 5 seconds duration
- Red background
- Dismiss button

### Confirmation Dialogs

```
┌────────────────────────────────┐
│      Delete Expense?           │
│                                │
│  This action cannot be undone. │
│  All participants will be      │
│  notified.                     │
│                                │
│  [Cancel]     [Delete]         │
└────────────────────────────────┘
```

**Guidelines**:
- Clear action description
- Explain consequences
- Secondary action on left (Cancel)
- Primary/destructive on right

---

## Accessibility

### Color Contrast
- Text: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- UI components: Minimum 3:1 ratio

### Touch Targets
- Minimum 44×44pt (iOS)
- Minimum 48×48px (Web)
- Adequate spacing between targets

### Screen Readers
- Meaningful labels on all interactive elements
- Announce dynamic content changes
- Semantic HTML (web)
- VoiceOver support (iOS)

### Keyboard Navigation
- Logical tab order
- Visible focus indicators
- Skip links for main content
- Keyboard shortcuts for common actions

---

## Animation & Motion

### Principles
- **Purposeful**: Animations serve a function
- **Quick**: 200-300ms for most transitions
- **Natural**: Ease-in-out curves
- **Reduced motion**: Respect system preferences

### Transitions

```css
/* Page transitions */
.page-enter {
  animation: slideInRight 300ms ease-out;
}

/* Card hover */
.card {
  transition: box-shadow 200ms ease;
}

/* Button press */
.button:active {
  transform: scale(0.98);
  transition: transform 100ms ease;
}
```

### Loading Animations
- Skeleton screens: Subtle pulse
- Spinners: Smooth rotation
- Progress bars: Smooth fill

---

## Responsive Design

### Breakpoints

```css
/* Mobile first approach */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

### Responsive Patterns

#### Stack to Sidebar
- Mobile: Stacked content
- Desktop: Sidebar + main content

#### Single to Multi-column
- Mobile: Single column lists
- Tablet: 2-column grid
- Desktop: 3-column grid

#### Hide to Show
- Mobile: Hide secondary info
- Desktop: Show all details

---

## Dark Mode

### Color Adjustments

```css
/* Dark mode colors */
@media (prefers-color-scheme: dark) {
  --color-background: #111827;
  --color-surface: #1F2937;
  --color-text: #F9FAFB;
  --color-text-secondary: #D1D5DB;
}
```

### Guidelines
- Reduce contrast (not pure black/white)
- Adjust shadows (lighter, more subtle)
- Test color contrast in dark mode
- Use semantic colors that work in both modes

---

## Platform-Specific Guidelines

### iOS
- Follow Human Interface Guidelines
- Use native navigation patterns
- Support gestures (swipe back)
- Use SF Symbols for icons
- Haptic feedback for actions

### Web
- Responsive design
- Keyboard navigation
- Browser compatibility
- Progressive enhancement
- Print-friendly views

---

## Icon System

### Icon Library
- **iOS**: SF Symbols
- **Web**: Heroicons or Lucide Icons

### Icon Sizes
```css
--icon-xs: 16px;
--icon-sm: 20px;
--icon-md: 24px;
--icon-lg: 32px;
--icon-xl: 48px;
```

### Common Icons
- **Add**: Plus circle
- **Delete**: Trash
- **Edit**: Pencil
- **Settings**: Gear
- **Groups**: Users
- **Expense**: Receipt
- **Money**: Dollar sign
- **Check**: Checkmark circle

---

**Document Version**: 1.0
**Last Updated**: 2025-11-21
**Status**: Draft
