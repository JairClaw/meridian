import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const transactions = await db.select({
      transaction: schema.transactions,
      account: schema.accounts,
      category: schema.categories,
    })
      .from(schema.transactions)
      .leftJoin(schema.accounts, eq(schema.transactions.accountId, schema.accounts.id))
      .leftJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
      .orderBy(desc(schema.transactions.date));
    
    // Build CSV
    const headers = ['Date', 'Description', 'Merchant', 'Amount', 'Currency', 'Category', 'Account', 'Notes'];
    const rows = transactions.map(({ transaction, account, category }) => [
      transaction.date,
      `"${transaction.description.replace(/"/g, '""')}"`,
      transaction.merchant ? `"${transaction.merchant.replace(/"/g, '""')}"` : '',
      (transaction.amountCents / 100).toFixed(2),
      transaction.currency,
      category?.name || '',
      account?.name || '',
      transaction.notes ? `"${transaction.notes.replace(/"/g, '""')}"` : '',
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Failed to export transactions:', error);
    return NextResponse.json(
      { error: 'Failed to export transactions' },
      { status: 500 }
    );
  }
}
