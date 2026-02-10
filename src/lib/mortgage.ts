// Mortgage calculation utilities

export interface AmortizationRow {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
  totalPrincipal: number;
}

export interface MortgageCalculation {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: AmortizationRow[];
}

export function calculateMortgage(
  principal: number, // in cents
  annualRate: number, // as decimal (0.065 = 6.5%)
  termMonths: number,
  startDate: string,
  extraPayment: number = 0 // in cents
): MortgageCalculation {
  const monthlyRate = annualRate / 12;
  
  // Calculate monthly payment using standard formula
  // M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let totalInterest = 0;
  let totalPrincipal = 0;
  
  const start = new Date(startDate);
  
  for (let month = 1; month <= termMonths && balance > 0; month++) {
    const interestPayment = balance * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment + extraPayment;
    
    // Don't overpay
    if (principalPayment > balance) {
      principalPayment = balance;
    }
    
    balance -= principalPayment;
    totalInterest += interestPayment;
    totalPrincipal += principalPayment;
    
    const paymentDate = new Date(start);
    paymentDate.setMonth(paymentDate.getMonth() + month);
    
    schedule.push({
      month,
      date: paymentDate.toISOString().split('T')[0],
      payment: monthlyPayment + extraPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, balance),
      totalInterest,
      totalPrincipal,
    });
    
    if (balance <= 0) break;
  }
  
  return {
    monthlyPayment,
    totalPayment: totalPrincipal + totalInterest,
    totalInterest,
    schedule,
  };
}

export function formatAmortizationDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  });
}
