export interface BudgetItem {
  category: BudgetCategory;
  name: string;
  estimatedCost: number;
  actualCost?: number;
  currency: string;
  note?: string;
  quantity?: number;
  unitPrice?: number;
}

export type BudgetCategory = 
  | 'transportation'
  | 'accommodation'
  | 'food'
  | 'attractions'
  | 'shopping'
  | 'entertainment'
  | 'insurance'
  | 'visa'
  | 'communication'
  | 'miscellaneous';

export interface BudgetSummary {
  transportation: number;
  accommodation: number;
  food: number;
  attractions: number;
  shopping: number;
  entertainment: number;
  insurance: number;
  visa: number;
  communication: number;
  miscellaneous: number;
  total: number;
  currency: string;
  perPerson?: number;
  days?: number;
}

export interface BudgetPlan {
  id: string;
  userId: string;
  itineraryId?: string;
  totalBudget: number;
  currency: string;
  items: BudgetItem[];
  summary: BudgetSummary;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetAlert {
  type: 'warning' | 'exceeded';
  category?: BudgetCategory;
  message: string;
  amount: number;
  threshold: number;
}

export interface BudgetOptimization {
  currentTotal: number;
  targetBudget: number;
  suggestions: BudgetSuggestion[];
  potentialSavings: number;
}

export interface BudgetSuggestion {
  category: BudgetCategory;
  currentCost: number;
  suggestedCost: number;
  savings: number;
  actions: string[];
}

export interface BudgetComparison {
  planned: BudgetSummary;
  actual: BudgetSummary;
  difference: BudgetSummary;
  percentageChange: BudgetSummary;
}

export interface BudgetQueryParams {
  itineraryId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  category?: BudgetCategory;
}

export interface BudgetEstimationParams {
  destination: string;
  days: number;
  travelerCount: number;
  travelStyle: 'budget' | 'moderate' | 'luxury';
  includeFlights?: boolean;
  includeHotels?: boolean;
}
