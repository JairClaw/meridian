import { getCategoryRules, getCategories } from '@/lib/actions';
import { RulesManager } from './rules-manager';

export default async function RulesPage() {
  const [rules, categories] = await Promise.all([
    getCategoryRules(),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display">Categorization Rules</h1>
        <p className="text-muted-foreground mt-1">
          {rules.length} rules • Auto-categorize your transactions
        </p>
      </div>

      <RulesManager initialRules={rules} categories={categories} />
    </div>
  );
}
