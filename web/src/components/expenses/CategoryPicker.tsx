'use client';

import { ExpenseCategory } from '@/types';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categoryIcons, categoryLabels } from '@/lib/validations/expense';

interface CategoryPickerProps {
  value: ExpenseCategory;
  onChange: (value: ExpenseCategory) => void;
  disabled?: boolean;
}

export function CategoryPicker({ value, onChange, disabled = false }: CategoryPickerProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="category">Category</Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as ExpenseCategory)}
        disabled={disabled}
      >
        <SelectTrigger id="category">
          <SelectValue placeholder="Select a category">
            {value && (
              <span className="flex items-center gap-2">
                <span>{categoryIcons[value]}</span>
                <span>{categoryLabels[value]}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              <span className="flex items-center gap-2">
                <span>{categoryIcons[key as ExpenseCategory]}</span>
                <span>{label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
