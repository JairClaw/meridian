import { NextResponse } from 'next/server';
import { fetchExchangeRates } from '@/lib/exchange-rates';
import { db, schema } from '@/db';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = searchParams.get('base') || 'EUR';
  
  try {
    // Check if we have recent rates in the database (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const today = new Date().toISOString().split('T')[0];
    
    const cachedRates = await db.select()
      .from(schema.exchangeRates)
      .where(eq(schema.exchangeRates.date, today))
      .orderBy(desc(schema.exchangeRates.id));
    
    if (cachedRates.length > 0) {
      // Convert to rates object
      const rates: Record<string, number> = {};
      cachedRates.forEach(rate => {
        if (rate.fromCurrency === base) {
          rates[rate.toCurrency] = rate.rate;
        }
      });
      
      return NextResponse.json({
        base,
        date: today,
        rates,
        cached: true,
      });
    }
    
    // Fetch fresh rates
    const freshRates = await fetchExchangeRates(base);
    
    // Store in database
    const ratesToInsert = Object.entries(freshRates.rates).map(([currency, rate]) => ({
      date: freshRates.date,
      fromCurrency: base,
      toCurrency: currency,
      rate: rate as number,
    }));
    
    if (ratesToInsert.length > 0) {
      await db.insert(schema.exchangeRates).values(ratesToInsert);
    }
    
    return NextResponse.json({
      ...freshRates,
      cached: false,
    });
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
