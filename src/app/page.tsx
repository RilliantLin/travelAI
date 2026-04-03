import { ChatWindow } from "@/components/chat";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <ChatWindow />
      </div>
    </main>
  );
}
