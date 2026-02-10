'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createCategory } from '@/lib/actions';

const commonIcons = [
  '🛒', '🍔', '🚗', '🏠', '💡', '📱', '🎬', '✈️', '🏥', '📚',
  '👕', '💇', '🎁', '🐕', '💰', '📈', '💳', '🏦', '💵', '🎯',
];

export function AddCategoryForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: '🏷️',
    isIncome: 'false',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createCategory({
        name: formData.name,
        icon: formData.icon,
        isIncome: formData.isIncome === 'true',
      });
      
      setIsOpen(false);
      setFormData({ name: '', icon: '🏷️', isIncome: 'false' });
      router.refresh();
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Add Category
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-lg bg-muted/50 border border-border space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">New Category</p>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Name *</label>
          <Input
            placeholder="e.g., Groceries"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Icon</label>
          <Select
            value={formData.icon}
            onValueChange={(value) => setFormData({ ...formData, icon: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {commonIcons.map((icon) => (
                <SelectItem key={icon} value={icon}>
                  {icon}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Type *</label>
          <Select
            value={formData.isIncome}
            onValueChange={(value) => setFormData({ ...formData, isIncome: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Expense</SelectItem>
              <SelectItem value="true">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={loading || !formData.name}
          className="bg-gold-500 text-navy-950 hover:bg-gold-400"
        >
          {loading ? 'Adding...' : 'Add Category'}
        </Button>
      </div>
    </form>
  );
}
