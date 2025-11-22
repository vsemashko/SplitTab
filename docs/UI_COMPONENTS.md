# UI Components Guide

Comprehensive guide to UI components in SplitTab Web and iOS applications.

## Table of Contents

1. [Overview](#overview)
2. [Web Components](#web-components)
3. [iOS Components](#ios-components)
4. [Design System](#design-system)
5. [Component Patterns](#component-patterns)
6. [Accessibility](#accessibility)
7. [Best Practices](#best-practices)

## Overview

SplitTab uses a component-based architecture with reusable UI elements across the application.

### Web: shadcn/ui + Radix UI

- Built on Radix UI primitives
- Styled with Tailwind CSS
- Fully customizable
- Accessible by default

### iOS: SwiftUI

- Native Apple design language
- Declarative syntax
- Built-in animations
- System integration

## Web Components

### Base UI Components

Located in `web/src/components/ui/`:

#### Button

```tsx
import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <IconComponent />
</Button>

// States
<Button disabled>Disabled</Button>
<Button loading>Loading...</Button>
```

#### Input

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="Enter email"
  />
</div>
```

#### Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

#### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

#### Toast

```tsx
import { toast } from 'sonner';

// Success
toast.success('Operation successful!');

// Error
toast.error('Something went wrong');

// Info
toast.info('Information message');

// Loading
const toastId = toast.loading('Processing...');
// Later: toast.success('Done!', { id: toastId });
```

### Feature Components

Located in `web/src/components/features/`:

#### ExpenseCard

```tsx
interface ExpenseCardProps {
  expense: Expense;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{expense.description}</CardTitle>
          <span className="text-lg font-bold">
            {formatCurrency(expense.amount, expense.currency)}
          </span>
        </div>
        <CardDescription>
          Paid by {expense.payer?.name} on {formatDate(expense.expenseDate)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Badge>{expense.category}</Badge>
          <span className="text-sm text-muted-foreground">
            {expense.participants?.length} participants
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
```

#### GroupCard

```tsx
interface GroupCardProps {
  group: Group;
  onClick?: () => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {getInitials(group.name)}
          </div>
          <div>
            <CardTitle>{group.name}</CardTitle>
            <CardDescription>
              {group.memberCount} members · {group.currency}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Your balance</span>
          <span className={cn(
            "font-semibold",
            group.yourBalance > 0 ? "text-green-600" : "text-red-600"
          )}>
            {formatCurrency(group.yourBalance, group.currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

## iOS Components

### SwiftUI Views

#### Custom Button

```swift
struct PrimaryButton: View {
    let title: String
    let action: () -> Void
    var isLoading: Bool = false
    var isDisabled: Bool = false

    var body: some View {
        Button(action: action) {
            HStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    Text(title)
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(isDisabled ? Color.gray : Color.blue)
            .foregroundColor(.white)
            .cornerRadius(10)
        }
        .disabled(isDisabled || isLoading)
    }
}

// Usage
PrimaryButton(title: "Submit", action: submit, isLoading: viewModel.isLoading)
```

#### Card View

```swift
struct CardView<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

// Usage
CardView {
    VStack(alignment: .leading) {
        Text("Title")
            .font(.headline)
        Text("Content")
            .font(.subheadline)
    }
}
```

#### Expense Row

```swift
struct ExpenseRowView: View {
    let expense: Expense

    var body: some View {
        HStack {
            // Category icon
            Image(systemName: expense.category.iconName)
                .font(.title2)
                .foregroundColor(.blue)
                .frame(width: 40, height: 40)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(8)

            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text(expense.description)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text("Paid by \(expense.payer?.name ?? "Unknown")")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Amount
            Text(formatCurrency(expense.amount, expense.currency))
                .font(.subheadline)
                .fontWeight(.semibold)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}
```

#### Group Card

```swift
struct GroupCardView: View {
    let group: Group

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 50, height: 50)
                    .overlay(
                        Text(getInitials(group.name))
                            .foregroundColor(.white)
                            .fontWeight(.bold)
                    )

                VStack(alignment: .leading) {
                    Text(group.name)
                        .font(.headline)

                    Text("\(group.memberCount ?? 0) members")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()
            }

            Divider()

            // Balance
            HStack {
                Text("Your balance")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Text(formatCurrency(group.yourBalance ?? 0, group.currency))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(group.yourBalance ?? 0 >= 0 ? .green : .red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}
```

## Design System

### Colors

**Web (Tailwind):**
```css
/* Primary */
--primary: 221.2 83.2% 53.3%;
--primary-foreground: 210 40% 98%;

/* Secondary */
--secondary: 210 40% 96.1%;
--secondary-foreground: 222.2 47.4% 11.2%;

/* Destructive */
--destructive: 0 84.2% 60.2%;

/* Muted */
--muted: 210 40% 96.1%;
--muted-foreground: 215.4 16.3% 46.9%;
```

**iOS (SwiftUI):**
```swift
extension Color {
    static let primaryColor = Color.blue
    static let secondaryColor = Color.gray
    static let successColor = Color.green
    static let errorColor = Color.red
    static let warningColor = Color.orange
}
```

### Typography

**Web:**
```tsx
<h1 className="text-4xl font-bold">Heading 1</h1>
<h2 className="text-3xl font-semibold">Heading 2</h2>
<h3 className="text-2xl font-semibold">Heading 3</h3>
<p className="text-base">Body text</p>
<span className="text-sm text-muted-foreground">Caption</span>
```

**iOS:**
```swift
Text("Heading 1").font(.largeTitle).fontWeight(.bold)
Text("Heading 2").font(.title).fontWeight(.semibold)
Text("Heading 3").font(.title2).fontWeight(.semibold)
Text("Body").font(.body)
Text("Caption").font(.caption).foregroundColor(.secondary)
```

### Spacing

**Web:**
```tsx
className="p-4"     // Padding: 1rem (16px)
className="m-4"     // Margin: 1rem
className="gap-4"   // Gap: 1rem
className="space-y-4"  // Vertical spacing: 1rem
```

**iOS:**
```swift
.padding()              // Default padding
.padding(16)            // 16 points
VStack(spacing: 16) {}  // 16 points gap
```

### Border Radius

**Web:**
```tsx
className="rounded-lg"   // 0.5rem (8px)
className="rounded-md"   // 0.375rem (6px)
className="rounded-sm"   // 0.125rem (2px)
```

**iOS:**
```swift
.cornerRadius(12)
.clipShape(RoundedRectangle(cornerRadius: 12))
```

## Component Patterns

### Loading State

**Web:**
```tsx
function Component() {
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return <div>Content</div>;
}
```

**iOS:**
```swift
struct ContentView: View {
    @State private var isLoading = false

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
            } else {
                Text("Content")
            }
        }
    }
}
```

### Empty State

**Web:**
```tsx
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-4xl mb-4">📭</div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
```

**iOS:**
```swift
struct EmptyStateView: View {
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            Text("📭")
                .font(.system(size: 60))

            Text(message)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}
```

### Error State

**Web:**
```tsx
function ErrorState({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <p className="text-red-600 mb-4">{error.message}</p>
      <Button onClick={retry}>Retry</Button>
    </div>
  );
}
```

**iOS:**
```swift
struct ErrorStateView: View {
    let error: Error
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Text("⚠️")
                .font(.system(size: 60))

            Text(error.localizedDescription)
                .foregroundColor(.red)
                .multilineTextAlignment(.center)

            Button("Retry", action: retry)
        }
        .padding()
    }
}
```

## Accessibility

### Web

**Semantic HTML:**
```tsx
<button aria-label="Close dialog">
  <CloseIcon aria-hidden="true" />
</button>

<label htmlFor="email">Email</label>
<input id="email" type="email" />

<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/">Home</a></li>
  </ul>
</nav>
```

**Keyboard Navigation:**
```tsx
<div
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Clickable div
</div>
```

### iOS

**VoiceOver:**
```swift
Text("Profile")
    .accessibilityLabel("User profile")
    .accessibilityHint("Double tap to view profile")

Button(action: delete) {
    Image(systemName: "trash")
}
.accessibilityLabel("Delete")
.accessibilityHint("Deletes the selected item")
```

## Best Practices

### 1. Reusability

**Good:**
```tsx
// Reusable component
function StatusBadge({ status }: { status: string }) {
  const variant = status === 'active' ? 'success' : 'default';
  return <Badge variant={variant}>{status}</Badge>;
}
```

**Bad:**
```tsx
// Inline styles everywhere
<span className="px-2 py-1 bg-green-500 text-white rounded">{status}</span>
```

### 2. Composition

**Good:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

**Bad:**
```tsx
<CustomCard title="Title" content="Content" />
```

### 3. Separation of Concerns

**Good:**
```tsx
// Separate presentation from logic
function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>;
}

function UserList() {
  const { users } = useUsers();
  return users.map(user => <UserCard key={user.id} user={user} />);
}
```

**Bad:**
```tsx
// Mixed concerns
function UserList() {
  const [users, setUsers] = useState([]);
  useEffect(() => { /* fetch users */ }, []);
  return users.map(user => <div>{user.name}</div>);
}
```

### 4. Performance

**Good:**
```tsx
// Memoized expensive component
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  return <div>{processData(data)}</div>;
});
```

**Good (iOS):**
```swift
// LazyVStack for long lists
LazyVStack {
    ForEach(items) { item in
        ItemRow(item: item)
    }
}
```

## Resources

- [Radix UI Documentation](https://www.radix-ui.com)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)

## Next Steps

- Review [Web Development Guide](./WEB_DEVELOPMENT.md)
- Review [iOS Development Guide](./IOS_DEVELOPMENT.md)
- Check [Frontend Setup Guide](./FRONTEND_SETUP.md)
