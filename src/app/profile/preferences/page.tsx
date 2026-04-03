"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { savePreference, getPreference } from "@/lib/api/preference";
import {
  PreferenceFormData,
  TRAVEL_STYLES,
  TRANSPORT_PREFERENCES,
  ACCOMMODATION_TYPES,
  DIETARY_OPTIONS,
  ACTIVITY_OPTIONS,
} from "@/types/preference";
import { cn } from "@/lib/utils";
import { RotateCcw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const DEMO_USER_ID = "demo-user-001";

const DEFAULT_FORM: PreferenceFormData = {
  budgetMin: undefined,
  budgetMax: undefined,
  currency: "CNY",
  travelerCount: 1,
  travelStyle: "moderate",
  dietaryRestrictions: [],
  preferredActivities: [],
  transportPreference: "plane",
  accommodationType: "hotel",
  accessibilityNeeds: false,
};

interface FormErrors {
  budgetMin?: string;
  budgetMax?: string;
  travelerCount?: string;
}

function validateForm(data: PreferenceFormData): FormErrors {
  const errors: FormErrors = {};

  if (data.budgetMin != null && data.budgetMin < 0) {
    errors.budgetMin = "最低预算不能为负数";
  }
  if (data.budgetMax != null && data.budgetMax < 0) {
    errors.budgetMax = "最高预算不能为负数";
  }
  if (
    data.budgetMin != null &&
    data.budgetMax != null &&
    data.budgetMin > data.budgetMax
  ) {
    errors.budgetMax = "最高预算不能低于最低预算";
  }

  if (data.travelerCount < 1 || data.travelerCount > 20) {
    errors.travelerCount = "出行人数需在 1-20 人之间";
  }

  return errors;
}

export default function PreferencesPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<PreferenceFormData>(DEFAULT_FORM);

  useEffect(() => {
    loadPreference();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const loadPreference = async () => {
    setLoading(true);
    try {
      const preference = await getPreference(DEMO_USER_ID);
      if (preference) {
        setFormData({
          budgetMin: preference.budgetMin ?? undefined,
          budgetMax: preference.budgetMax ?? undefined,
          currency: preference.currency,
          travelerCount: preference.travelerCount,
          travelStyle: preference.travelStyle ?? "moderate",
          dietaryRestrictions: preference.dietaryRestrictions,
          preferredActivities: preference.preferredActivities,
          transportPreference: preference.transportPreference ?? "plane",
          accommodationType: preference.accommodationType ?? "hotel",
          accessibilityNeeds: preference.accessibilityNeeds,
        });
      }
    } catch (error) {
      console.error("加载偏好失败:", error);
      setMessage({ type: "error", text: "加载偏好设置失败，请重试" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await savePreference(DEMO_USER_ID, formData);
      setMessage({ type: "success", text: "偏好设置已保存！" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "保存失败，请重试",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = useCallback(() => {
    setFormData(DEFAULT_FORM);
    setErrors({});
    setMessage(null);
  }, []);

  const toggleArrayItem = (
    field: "dietaryRestrictions" | "preferredActivities",
    item: string
  ) => {
    setErrors({});
    setFormData((prev) => {
      const arr = prev[field] || [];
      const exists = arr.includes(item);
      return {
        ...prev,
        [field]: exists ? arr.filter((i) => i !== item) : [...arr, item],
      };
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">加载偏好设置...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">旅行偏好设置</h1>
            <p className="mt-2 text-gray-600">
              设置您的旅行偏好，我们将为您提供更个性化的推荐
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            重置
          </Button>
        </div>

        {message && (
          <div
            className={cn(
              "mb-6 flex items-center gap-2 rounded-lg p-4 transition-all",
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            )}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <fieldset className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-gray-900">
              预算设置
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  最低预算 (元)
                </label>
                <input
                  type="number"
                  value={formData.budgetMin ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budgetMin: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                    errors.budgetMin
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-white"
                  )}
                  placeholder="0"
                />
                {errors.budgetMin && (
                  <p className="mt-1 text-xs text-red-600">{errors.budgetMin}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  最高预算 (元)
                </label>
                <input
                  type="number"
                  value={formData.budgetMax ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budgetMax: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                    errors.budgetMax
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-white"
                  )}
                  placeholder="10000"
                />
                {errors.budgetMax && (
                  <p className="mt-1 text-xs text-red-600">{errors.budgetMax}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                出行人数
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={formData.travelerCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    travelerCount: Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                  })
                }
                className={cn(
                  "w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                  errors.travelerCount
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 bg-white"
                )}
              />
              {errors.travelerCount && (
                <p className="mt-1 text-xs text-red-600">{errors.travelerCount}</p>
              )}
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-gray-900">
              旅行风格
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {TRAVEL_STYLES.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, travelStyle: style.value })
                  }
                  className={cn(
                    "rounded-lg border-2 p-4 text-left transition-all",
                    formData.travelStyle === style.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="font-medium text-gray-900">{style.label}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    {style.description}
                  </div>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-gray-900">
              交通偏好
            </legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TRANSPORT_PREFERENCES.map((transport) => (
                <button
                  key={transport.value}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      transportPreference: transport.value,
                    })
                  }
                  className={cn(
                    "rounded-lg border-2 p-3 text-center transition-all",
                    formData.transportPreference === transport.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="text-2xl">{transport.icon}</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">
                    {transport.label}
                  </div>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-gray-900">
              住宿偏好
            </legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ACCOMMODATION_TYPES.map((accommodation) => (
                <button
                  key={accommodation.value}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      accommodationType: accommodation.value,
                    })
                  }
                  className={cn(
                    "rounded-lg border-2 p-3 text-center transition-all",
                    formData.accommodationType === accommodation.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="text-2xl">{accommodation.icon}</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">
                    {accommodation.label}
                  </div>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-gray-900">
              饮食限制
            </legend>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleArrayItem("dietaryRestrictions", option)}
                  className={cn(
                    "rounded-full border-2 px-4 py-2 text-sm transition-all",
                    formData.dietaryRestrictions?.includes(option)
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-gray-900">
              偏好活动
            </legend>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleArrayItem("preferredActivities", option)}
                  className={cn(
                    "rounded-full border-2 px-4 py-2 text-sm transition-all",
                    formData.preferredActivities?.includes(option)
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-gray-900">
              特殊需求
            </legend>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={formData.accessibilityNeeds}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    accessibilityNeeds: e.target.checked,
                  })
                }
                className="h-5 w-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-gray-700">需要无障碍设施</span>
            </label>
          </fieldset>

          <div className="flex gap-4 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存偏好"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
