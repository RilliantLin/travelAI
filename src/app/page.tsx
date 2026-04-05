import { ChatWindow } from "@/components/chat";
import Link from "next/link";
import { LayoutDashboard, ArrowRight, MapPin, Calendar, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Hero section for Plan mode */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="mb-2 text-lg font-bold text-gray-900">
                智能行程规划
              </h2>
              <p className="mb-4 max-w-md text-sm text-gray-600">
                三栏交互式规划体验 — 与 AI 对话的同时实时查看和调整你的行程安排与地图路线
              </p>
              <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                  AI 对话驱动
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  实时行程卡片
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  地图联动
                </span>
              </div>
              <Link
                href="/plan/new"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <LayoutDashboard className="h-4 w-4" />
                开始规划行程
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-2 opacity-80">
              <div className="w-24 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <div className="mb-1 h-2 w-12 rounded bg-blue-200" />
                <div className="h-1.5 w-16 rounded bg-gray-200" />
                <div className="mt-2 h-1.5 w-10 rounded bg-gray-100" />
              </div>
              <div className="w-32 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <div className="mb-1 h-2 w-16 rounded bg-red-200" />
                <div className="h-1.5 w-20 rounded bg-gray-200" />
                <div className="mt-1 h-1.5 w-14 rounded bg-gray-100" />
                <div className="mt-2 h-2 w-12 rounded bg-green-200" />
                <div className="mt-1 h-1.5 w-18 rounded bg-gray-200" />
              </div>
              <div className="w-28 rounded-lg border border-gray-200 bg-green-50 p-3 shadow-sm">
                <div className="h-16 rounded bg-green-100" />
              </div>
            </div>
          </div>
        </div>

        {/* Existing chat window */}
        <ChatWindow />
      </div>
    </main>
  );
}
