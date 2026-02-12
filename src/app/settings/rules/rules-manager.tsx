'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  createCategoryRule, 
  deleteCategoryRule,
  updateCategoryRule,
  applyCategorizationRules,
} from '@/lib/actions';
import type { Category, CategoryRule } from '@/db/schema';

interface RulesManagerProps {
  initialRules: Array<{ rule: CategoryRule; category: Category | null }>;
  categories: Category[];
}

const matchTypes = [
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'exact', label: 'Exact' },
  { value: 'regex', label: 'Regex' },
];

export function RulesManager({ initialRules, categories }: RulesManagerProps) {
  const router = useRouter();
  const [rules, setRules] = useState(initialRules);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [applying, setApplying] = useState(false);
  const [formData, setFormData] = useState({
    pattern: '',
    categoryId: '',
    matchType: 'contains',
  });

  // Group rules by category
  const groupedRules = useMemo(() => {
    const filtered = rules.filter(({ rule, category }) => {
      const matchesSearch = !search || 
        rule.pattern.toLowerCase().includes(search.toLowerCase()) ||
        category?.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || 
        category?.id.toString() === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(item => {
      const catName = item.category?.name || 'Uncategorized';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(item);
    });

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rules, search, categoryFilter]);

  const handleApplyRules = async () => {
    setApplying(true);
    try {
      const result = await applyCategorizationRules();
      alert(`Categorized ${result.categorized} of ${result.total} transactions`);
      router.refresh();
    } finally {
      setApplying(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.pattern || !formData.categoryId) return;
    await createCategoryRule({
      pattern: formData.pattern,
      categoryId: parseInt(formData.categoryId),
      matchType: formData.matchType,
    });
    setFormData({ pattern: '', categoryId: '', matchType: 'contains' });
    setShowAddForm(false);
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    await deleteCategoryRule(id);
    setRules(rules.filter(r => r.rule.id !== id));
  };

  const handleUpdate = async (id: number, data: { pattern?: string; categoryId?: number; matchType?: string }) => {
    await updateCategoryRule(id, data);
    setEditingId(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Search rules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyRules}
              disabled={applying}
            >
              {applying ? 'Applying...' : 'Apply All Rules'}
            </Button>
            <Button
              size="sm"
              className="bg-gold-500 text-navy-950 hover:bg-gold-400"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : '+ Add Rule'}
            </Button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  placeholder="Pattern (e.g., netflix)"
                  value={formData.pattern}
                  onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                />
                <Select
                  value={formData.categoryId}
                  onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formData.matchType}
                  onValueChange={(v) => setFormData({ ...formData, matchType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {matchTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleCreate}
                  disabled={!formData.pattern || !formData.categoryId}
                  className="bg-gold-500 text-navy-950 hover:bg-gold-400"
                >
                  Create
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rules grouped by category */}
      <div className="space-y-2">
        {groupedRules.map(([categoryName, categoryRules]) => {
          const isExpanded = expandedCategory === categoryName || search.length > 0 || categoryFilter !== 'all';
          const category = categoryRules[0]?.category;
          
          return (
            <Card key={categoryName}>
              <CardHeader 
                className="py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedCategory(isExpanded && !search ? null : categoryName)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                    <span className="text-xl">{category?.icon || '📁'}</span>
                    <CardTitle className="text-base font-medium">
                      {categoryName}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {categoryRules.length}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0 pb-3">
                  <div className="space-y-1 ml-8">
                    {categoryRules.map(({ rule }) => (
                      <RuleRow
                        key={rule.id}
                        rule={rule}
                        categories={categories}
                        isEditing={editingId === rule.id}
                        onEdit={() => setEditingId(rule.id)}
                        onCancelEdit={() => setEditingId(null)}
                        onUpdate={(data) => handleUpdate(rule.id, data)}
                        onDelete={() => handleDelete(rule.id)}
                      />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {groupedRules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No rules found
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface RuleRowProps {
  rule: CategoryRule;
  categories: Category[];
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: { pattern?: string; categoryId?: number; matchType?: string }) => void;
  onDelete: () => void;
}

function RuleRow({ rule, categories, isEditing, onEdit, onCancelEdit, onUpdate, onDelete }: RuleRowProps) {
  const [editData, setEditData] = useState({
    pattern: rule.pattern,
    categoryId: rule.categoryId.toString(),
    matchType: rule.matchType,
  });

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
        <Input
          value={editData.pattern}
          onChange={(e) => setEditData({ ...editData, pattern: e.target.value })}
          className="flex-1 h-8"
        />
        <Select
          value={editData.categoryId}
          onValueChange={(v) => setEditData({ ...editData, categoryId: v })}
        >
          <SelectTrigger className="w-40 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={editData.matchType}
          onValueChange={(v) => setEditData({ ...editData, matchType: v })}
        >
          <SelectTrigger className="w-28 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              { value: 'contains', label: 'Contains' },
              { value: 'starts_with', label: 'Starts' },
              { value: 'exact', label: 'Exact' },
              { value: 'regex', label: 'Regex' },
            ].map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={onCancelEdit}>✕</Button>
        <Button 
          size="sm" 
          className="bg-gold-500 text-navy-950 hover:bg-gold-400"
          onClick={() => onUpdate({
            pattern: editData.pattern,
            categoryId: parseInt(editData.categoryId),
            matchType: editData.matchType,
          })}
        >
          Save
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 group">
      <code className="flex-1 text-sm font-mono truncate">{rule.pattern}</code>
      <Badge variant="outline" className="text-xs shrink-0">
        {rule.matchType}
      </Badge>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
        <Button size="sm" variant="ghost" className="h-6 px-2" onClick={onEdit}>
          Edit
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-6 px-2 text-red-500 hover:text-red-600"
          onClick={onDelete}
        >
          ✕
        </Button>
      </div>
    </div>
  );
}
