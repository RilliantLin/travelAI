"use client";

import type { BudgetSummary } from "@/types/itinerary";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  AlertTriangle,
} from "lucide-react";

interface BudgetCardProps {
  budget: BudgetSummary;
  compact?: boolean;
}

export function BudgetCard({ budget, compact = false }: BudgetCardProps) {
  const percentage = budget.totalBudget > 0
    ? Math.round((budget.totalEstimated / budget.totalBudget) * 100)
    : 0;

  const isOverBudget = budget.totalEstimated > budget.totalBudget && budget.totalBudget > 0;

  if (compact) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">预估总费用</p>
            <p className="text-xl font-bold text-gray-900">
              ¥{budget.totalEstimated.toLocaleString()}
            </p>
          </div>
          {isOverBudget && (
            <div className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
              <AlertTriangle className="h-3 w-3" />
              超预算
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">费用预算</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs text-gray-500">预估总费用</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            ¥{budget.totalEstimated.toLocaleString()}
          </p>
        </div>
        {budget.totalBudget > 0 && (
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500">总预算</p>
            <p className="mt-1 text-2xl font-bold text-gray-700">
              ¥{budget.totalBudget.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {budget.totalBudget > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">预算使用率</span>
            <span
              className={cn(
                "font-semibold",
                isOverBudget ? "text-red-600" : percentage > 80 ? "text-yellow-600" : "text-green-600"
              )}
            >
              {percentage}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isOverBudget ? "bg-red-500" : percentage > 80 ? "bg-yellow-500" : "bg-green-500"
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          {isOverBudget && (
            <p className="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle className="h-3 w-3" />
              超出预算 ¥{(budget.totalEstimated - budget.totalBudget).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">费用明细</h4>
        <div className="space-y-2">
          {budget.breakdown.map((item) => (
            <div key={item.category} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.category}</span>
                  <span className="font-medium text-gray-900">
                    ¥{item.amount.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
