'use client';

import { PaymentMethod } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  DollarSign,
} from 'lucide-react';

interface PaymentMethodPickerProps {
  value?: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  placeholder?: string;
}

export function PaymentMethodPicker({
  value,
  onChange,
  placeholder = 'Select payment method',
}: PaymentMethodPickerProps) {
  const paymentMethods: Array<{ value: PaymentMethod; label: string; icon: any }> = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
    { value: 'debit_card', label: 'Debit Card', icon: CreditCard },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
    { value: 'venmo', label: 'Venmo', icon: Smartphone },
    { value: 'paypal', label: 'PayPal', icon: DollarSign },
    { value: 'zelle', label: 'Zelle', icon: Smartphone },
    { value: 'apple_pay', label: 'Apple Pay', icon: Smartphone },
    { value: 'google_pay', label: 'Google Pay', icon: Smartphone },
    { value: 'other', label: 'Other', icon: DollarSign },
  ];

  const getIcon = (method: string) => {
    const item = paymentMethods.find((pm) => pm.value === method);
    if (!item) return null;
    const Icon = item.icon;
    return <Icon className="h-4 w-4 mr-2" />;
  };

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {value && (
            <div className="flex items-center">
              {getIcon(value)}
              {paymentMethods.find((pm) => pm.value === value)?.label}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <SelectItem key={method.value} value={method.value}>
              <div className="flex items-center">
                <Icon className="h-4 w-4 mr-2" />
                {method.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
