import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCategories } from '@/lib/actions';
import { CategoryRulesManager } from './category-rules';
import { AddCategoryForm } from './add-category-form';

export default async function SettingsPage() {
  const categories = await getCategories();
  
  const incomeCategories = categories.filter(c => c.isIncome);
  const expenseCategories = categories.filter(c => !c.isIncome);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your finance tracker</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">General</CardTitle>
          <CardDescription>Basic configuration options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Default Currency</p>
              <p className="text-sm text-muted-foreground">Currency used for new transactions</p>
            </div>
            <Badge variant="secondary">EUR</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Date Format</p>
              <p className="text-sm text-muted-foreground">How dates are displayed</p>
            </div>
            <Badge variant="secondary">YYYY-MM-DD</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">Application color scheme</p>
            </div>
            <Badge variant="secondary">Dark</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display">Categories</CardTitle>
              <CardDescription>{categories.length} categories configured</CardDescription>
            </div>
            <AddCategoryForm />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Income Categories */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Income ({incomeCategories.length})</p>
            <div className="flex flex-wrap gap-2">
              {incomeCategories.map((category) => (
                <Badge 
                  key={category.id} 
                  variant="outline"
                  className="gap-1.5 py-1.5 px-3"
                >
                  <span>{category.icon}</span>
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Expense Categories */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Expenses ({expenseCategories.length})</p>
            <div className="flex flex-wrap gap-2">
              {expenseCategories.map((category) => (
                <Badge 
                  key={category.id} 
                  variant="outline"
                  className="gap-1.5 py-1.5 px-3"
                >
                  <span>{category.icon}</span>
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Categorization Rules */}
      <CategoryRulesManager />

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Data Management</CardTitle>
          <CardDescription>Export and backup options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium">Export Transactions</p>
              <p className="text-sm text-muted-foreground">Download all transactions as CSV</p>
            </div>
            <a href="/api/export/transactions" download>
              <Button variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </Button>
            </a>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium">Backup Database</p>
              <p className="text-sm text-muted-foreground">Download a full backup of your data</p>
            </div>
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
              Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">About Meridian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold-500 to-gold-400 flex items-center justify-center">
              <svg className="w-6 h-6 text-navy-950" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <p className="font-display text-lg">Meridian</p>
              <p className="text-sm text-muted-foreground">Personal Finance Tracker v0.1.0</p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            A sophisticated personal finance tracker with a elegant, wealth-management inspired design aesthetic. 
            Built with Next.js, TypeScript, SQLite, and Tailwind CSS.
          </p>
          
          <div className="flex gap-4 text-sm">
            <a href="https://github.com/JairClaw/meridian" className="text-gold-500 hover:text-gold-400 transition-colors">
              GitHub →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
