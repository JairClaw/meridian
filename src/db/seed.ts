import { db, schema } from './index';

const defaultCategories = [
  { name: 'Income', icon: '💰', color: '#10B981', isIncome: true },
  { name: 'Salary', icon: '💵', color: '#10B981', isIncome: true },
  { name: 'Freelance', icon: '💻', color: '#10B981', isIncome: true },
  { name: 'Investments', icon: '📈', color: '#10B981', isIncome: true },
  
  { name: 'Housing', icon: '🏠', color: '#6366F1', isIncome: false },
  { name: 'Rent/Mortgage', icon: '🔑', color: '#6366F1', isIncome: false },
  { name: 'Utilities', icon: '💡', color: '#6366F1', isIncome: false },
  
  { name: 'Transportation', icon: '🚗', color: '#F59E0B', isIncome: false },
  { name: 'Food & Dining', icon: '🍽️', color: '#EF4444', isIncome: false },
  { name: 'Groceries', icon: '🛒', color: '#EF4444', isIncome: false },
  { name: 'Restaurants', icon: '🍜', color: '#EF4444', isIncome: false },
  
  { name: 'Shopping', icon: '🛍️', color: '#EC4899', isIncome: false },
  { name: 'Entertainment', icon: '🎬', color: '#8B5CF6', isIncome: false },
  { name: 'Subscriptions', icon: '📱', color: '#8B5CF6', isIncome: false },
  
  { name: 'Health', icon: '🏥', color: '#14B8A6', isIncome: false },
  { name: 'Education', icon: '📚', color: '#0EA5E9', isIncome: false },
  { name: 'Travel', icon: '✈️', color: '#F97316', isIncome: false },
  
  { name: 'Personal Care', icon: '💅', color: '#D946EF', isIncome: false },
  { name: 'Gifts', icon: '🎁', color: '#F43F5E', isIncome: false },
  { name: 'Other', icon: '📋', color: '#6B7280', isIncome: false },
];

async function seed() {
  console.log('🌱 Seeding database...');
  
  // Check if categories already exist
  const existingCategories = await db.select().from(schema.categories);
  
  if (existingCategories.length === 0) {
    console.log('Adding default categories...');
    await db.insert(schema.categories).values(defaultCategories);
    console.log(`✅ Added ${defaultCategories.length} categories`);
  } else {
    console.log(`Categories already exist (${existingCategories.length})`);
  }
  
  // Add default settings
  const existingSettings = await db.select().from(schema.settings);
  
  if (existingSettings.length === 0) {
    console.log('Adding default settings...');
    await db.insert(schema.settings).values([
      { key: 'default_currency', value: 'EUR' },
      { key: 'date_format', value: 'YYYY-MM-DD' },
      { key: 'theme', value: 'dark' },
    ]);
    console.log('✅ Added default settings');
  }
  
  console.log('🎉 Seed complete!');
}

seed().catch(console.error);
