import { BudgetSummary, BudgetItem, BudgetCategory } from '../../types/budget';

export function calculateTotalBudget(items: BudgetItem[]): number {
  return items.reduce((total, item) => total + item.estimatedCost, 0);
}

export function calculateBudgetSummary(items: BudgetItem[]): BudgetSummary {
  const summary: BudgetSummary = {
    transportation: 0,
    accommodation: 0,
    food: 0,
    attractions: 0,
    shopping: 0,
    entertainment: 0,
    insurance: 0,
    visa: 0,
    communication: 0,
    miscellaneous: 0,
    total: 0,
    currency: 'CNY',
  };

  items.forEach(item => {
    if (summary[item.category] !== undefined) {
      summary[item.category] += item.estimatedCost;
    }
    summary.total += item.estimatedCost;
  });

  return summary;
}

export function calculatePerPersonBudget(
  summary: BudgetSummary,
  travelerCount: number
): BudgetSummary {
  const perPerson: BudgetSummary = {
    transportation: summary.transportation / travelerCount,
    accommodation: summary.accommodation / travelerCount,
    food: summary.food / travelerCount,
    attractions: summary.attractions / travelerCount,
    shopping: summary.shopping / travelerCount,
    entertainment: summary.entertainment / travelerCount,
    insurance: summary.insurance / travelerCount,
    visa: summary.visa / travelerCount,
    communication: summary.communication / travelerCount,
    miscellaneous: summary.miscellaneous / travelerCount,
    total: summary.total / travelerCount,
    currency: summary.currency,
    perPerson: summary.total / travelerCount,
    days: summary.days,
  };

  return perPerson;
}

export function calculateDailyBudget(summary: BudgetSummary, days: number): number {
  return Math.round((summary.total / days) * 100) / 100;
}

export function isBudgetExceeded(
  summary: BudgetSummary,
  budget: number
): { exceeded: boolean; percentage: number; amount: number } {
  const percentage = (summary.total / budget) * 100;
  const exceeded = summary.total > budget;
  const amount = exceeded ? summary.total - budget : budget - summary.total;

  return {
    exceeded,
    percentage: Math.round(percentage * 100) / 100,
    amount: Math.round(amount * 100) / 100,
  };
}

export function getBudgetBreakdown(summary: BudgetSummary): Array<{
  category: BudgetCategory;
  amount: number;
  percentage: number;
}> {
  const breakdown: Array<{
    category: BudgetCategory;
    amount: number;
    percentage: number;
  }> = [];

  const categories: BudgetCategory[] = [
    'transportation',
    'accommodation',
    'food',
    'attractions',
    'shopping',
    'entertainment',
    'insurance',
    'visa',
    'communication',
    'miscellaneous',
  ];

  categories.forEach(category => {
    const amount = summary[category];
    const percentage = (amount / summary.total) * 100;
    breakdown.push({
      category,
      amount,
      percentage: Math.round(percentage * 100) / 100,
    });
  });

  return breakdown.sort((a, b) => b.amount - a.amount);
}

export function estimateBudget(
  destination: string,
  days: number,
  travelerCount: number,
  travelStyle: 'budget' | 'moderate' | 'luxury'
): BudgetSummary {
  const baseCosts = {
    budget: {
      accommodation: 200,
      food: 150,
      attractions: 100,
      transportation: 50,
      miscellaneous: 50,
    },
    moderate: {
      accommodation: 500,
      food: 300,
      attractions: 150,
      transportation: 100,
      miscellaneous: 100,
    },
    luxury: {
      accommodation: 1200,
      food: 600,
      attractions: 250,
      transportation: 200,
      miscellaneous: 200,
    },
  };

  const costs = baseCosts[travelStyle];

  const summary: BudgetSummary = {
    transportation: costs.transportation * days * travelerCount,
    accommodation: costs.accommodation * days * travelerCount,
    food: costs.food * days * travelerCount,
    attractions: costs.attractions * days * travelerCount,
    shopping: 0,
    entertainment: 0,
    insurance: 100 * travelerCount,
    visa: 0,
    communication: 50 * days,
    miscellaneous: costs.miscellaneous * days * travelerCount,
    total: 0,
    currency: 'CNY',
  };

  summary.total = 
    summary.transportation +
    summary.accommodation +
    summary.food +
    summary.attractions +
    summary.shopping +
    summary.entertainment +
    summary.insurance +
    summary.visa +
    summary.communication +
    summary.miscellaneous;

  return summary;
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate?: number
): number {
  const exchangeRates: Record<string, number> = {
    'CNY-USD': 0.14,
    'USD-CNY': 7.1,
    'CNY-EUR': 0.13,
    'EUR-CNY': 7.7,
    'CNY-JPY': 20.5,
    'JPY-CNY': 0.049,
    'CNY-KRW': 180,
    'KRW-CNY': 0.0056,
    'CNY-THB': 4.8,
    'THB-CNY': 0.21,
  };

  if (fromCurrency === toCurrency) return amount;

  const key = `${fromCurrency}-${toCurrency}`;
  const exchangeRate = rate || exchangeRates[key] || 1;

  return Math.round(amount * exchangeRate * 100) / 100;
}
