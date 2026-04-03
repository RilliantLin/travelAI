import { BudgetSummary, BudgetItem, BudgetCategory, BudgetEstimationParams } from '../../types/budget';
import { calculateBudgetSummary, calculatePerPersonBudget, calculateDailyBudget } from '../utils/budget';

export class BudgetCalculator {
  calculateTotalBudget(items: BudgetItem[]): number {
    return items.reduce((total, item) => total + item.estimatedCost, 0);
  }

  calculateCategoryBreakdown(items: BudgetItem[]): Record<BudgetCategory, number> {
    const breakdown: Record<BudgetCategory, number> = {
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
    };

    items.forEach(item => {
      breakdown[item.category] += item.estimatedCost;
    });

    return breakdown;
  }

  checkBudgetStatus(
    items: BudgetItem[],
    budget: number
  ): {
    total: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
    warning: boolean;
  } {
    const total = this.calculateTotalBudget(items);
    const remaining = budget - total;
    const percentage = (total / budget) * 100;
    const isOverBudget = total > budget;
    const warning = percentage >= 80 && percentage < 100;

    return {
      total,
      remaining,
      percentage: Math.round(percentage * 100) / 100,
      isOverBudget,
      warning,
    };
  }

  optimizeBudget(
    items: BudgetItem[],
    targetBudget: number
  ): {
    canOptimize: boolean;
    suggestions: Array<{
      category: BudgetCategory;
      currentCost: number;
      suggestedCost: number;
      savings: number;
      actions: string[];
    }>;
  } {
    const total = this.calculateTotalBudget(items);
    const needsSaving = total - targetBudget;

    if (needsSaving <= 0) {
      return {
        canOptimize: true,
        suggestions: [],
      };
    }

    const breakdown = this.calculateCategoryBreakdown(items);
    const suggestions: any[] = [];

    const flexibleCategories: BudgetCategory[] = [
      'shopping',
      'entertainment',
      'food',
      'accommodation',
    ];

    let remainingToSave = needsSaving;

    for (const category of flexibleCategories) {
      if (remainingToSave <= 0) break;

      const currentCost = breakdown[category];
      if (currentCost > 0) {
        const savingsRatio = 0.2;
        const potentialSavings = currentCost * savingsRatio;

        if (potentialSavings > 0) {
          const actualSavings = Math.min(potentialSavings, remainingToSave);
          const suggestedCost = currentCost - actualSavings;

          suggestions.push({
            category,
            currentCost,
            suggestedCost,
            savings: actualSavings,
            actions: this.getOptimizationActions(category, actualSavings),
          });

          remainingToSave -= actualSavings;
        }
      }
    }

    return {
      canOptimize: remainingToSave <= 0,
      suggestions,
    };
  }

  private getOptimizationActions(category: BudgetCategory, savings: number): string[] {
    const actions: Record<BudgetCategory, string[]> = {
      transportation: [
        '选择经济舱机票',
        '使用公共交通代替出租车',
        '提前预订车票享受折扣',
      ],
      accommodation: [
        '选择性价比更高的酒店',
        '考虑民宿或青旅',
        '缩短住宿天数',
      ],
      food: [
        '选择当地特色小吃',
        '避免景区内餐厅',
        '自己准备部分餐食',
      ],
      attractions: [
        '购买景点联票',
        '关注免费景点',
        '选择重要景点参观',
      ],
      shopping: [
        '减少购物预算',
        '选择当地市场',
        '避免景区购物',
      ],
      entertainment: [
        '选择免费娱乐活动',
        '减少付费项目',
      ],
      insurance: ['比较不同保险公司报价'],
      visa: ['自行办理签证'],
      communication: ['购买当地电话卡'],
      miscellaneous: ['预留应急资金'],
    };

    return actions[category] || [];
  }

  estimateDailyBudget(
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
}

export const budgetCalculator = new BudgetCalculator();
