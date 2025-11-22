'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ReceiptUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ReceiptUpload({
  images,
  onChange,
  maxImages = 5,
  disabled = false,
}: ReceiptUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Filter for images only
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    // Check max images limit
    if (images.length + imageFiles.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      return;
    }

    // Create previews
    const newPreviews: string[] = [];
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === imageFiles.length) {
          setPreviews([...previews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    onChange([...images, ...imageFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    onChange(newImages);
    setPreviews(newPreviews);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Receipt Images (Optional)</Label>
        <p className="text-sm text-muted-foreground">
          Upload up to {maxImages} receipt images
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || images.length >= maxImages}
      />

      {/* Upload button */}
      {images.length < maxImages && (
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileInput}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Receipt Image
        </Button>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {previews.map((preview, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative rounded-md overflow-hidden bg-muted">
                  <Image
                    src={preview}
                    alt={`Receipt ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              No receipt images uploaded
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
