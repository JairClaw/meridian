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
  '🏷️', '🛒', '🍔', '🚗', '🏠', '💡', '📱', '🎬', '✈️', '🏥', '📚',
  '👕', '💇', '🎁', '🐕', '💰', '📈', '💳', '🏦', '💵', '🎯', '⚡',
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
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="w-6 h-6 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center text-xs">+</span>
        Add category
      </button>
    );
  }

  return (
    <div className="pt-4 border-t border-border">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">New Category</p>
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
        
        <div className="flex gap-3 items-end">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Icon</label>
            <Select
              value={formData.icon}
              onValueChange={(value) => setFormData({ ...formData, icon: value })}
            >
              <SelectTrigger className="w-16">
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
          
          <div className="space-y-1.5 flex-1">
            <label className="text-xs text-muted-foreground">Name</label>
            <Input
              placeholder="Category name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Type</label>
            <Select
              value={formData.isIncome}
              onValueChange={(value) => setFormData({ ...formData, isIncome: value })}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Expense</SelectItem>
                <SelectItem value="true">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            disabled={loading || !formData.name}
            size="sm"
            className="bg-gold-500 text-navy-950 hover:bg-gold-400"
          >
            {loading ? '...' : 'Add'}
          </Button>
        </div>
      </form>
    </div>
  );
}
