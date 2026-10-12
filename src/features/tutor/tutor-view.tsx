"use client";

import { useEffect, useRef, useState } from "react";
import {
  sendChatMessageAction,
  getChatSessionsAction,
  getChatMessagesAction,
} from "@/actions/tutor.actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Bot, User } from "lucide-react";

const SUGGESTIONS = [
  "Explain DSU Rollback",
  "Explain Digit DP",
  "Explain Mo's Algorithm",
  "Explain Centroid Decomposition",
  "Explain Heavy Light Decomposition",
];

export function TutorView() {
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Array<{ id: string; title: string }>>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getChatSessionsAction().then((r) => {
      if (r.success) setSessions(r.data);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(msg?: string) {
    const text = msg || message;
    if (!text.trim()) return;

    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setMessage("");

    const result = await sendChatMessageAction({ sessionId, message: text });
    setLoading(false);

    if (result.success) {
      setSessionId(result.data.sessionId);
      setMessages((prev) => [...prev, { role: "assistant", content: result.data.reply }]);
    } else {
      toast.error(result.error);
    }
  }

  async function loadSession(id: string) {
    setSessionId(id);
    const result = await getChatMessagesAction(id);
    if (result.success) {
      setMessages(result.data.map((m) => ({ role: m.role, content: m.content })));
    }
  }

  return (
    <DashboardShell title="AI Tutor" description="Ask anything about competitive programming">
      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Sessions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full" onClick={() => { setSessionId(undefined); setMessages([]); }}>
              New Chat
            </Button>
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className="w-full text-left rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 truncate"
              >
                {s.title}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 flex flex-col h-[calc(100vh-12rem)]">
          <CardHeader>
            <CardTitle>Chat</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTIONS.map((s) => (
                <Badge
                  key={s}
                  className="cursor-pointer hover:bg-violet-600/30"
                  onClick={() => send(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 && (
                <p className="text-center text-zinc-500 py-12">
                  Ask me to explain any algorithm or data structure!
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "assistant" && <Bot className="h-6 w-6 text-violet-400 shrink-0" />}
                  <div className={`rounded-lg px-4 py-3 max-w-[80%] text-sm ${
                    m.role === "user"
                      ? "bg-violet-600/20 text-zinc-100"
                      : "bg-zinc-800 text-zinc-300"
                  }`}>
                    <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                  </div>
                  {m.role === "user" && <User className="h-6 w-6 text-zinc-400 shrink-0" />}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <Bot className="h-6 w-6 text-violet-400" />
                  <div className="rounded-lg bg-zinc-800 px-4 py-3 text-sm text-zinc-500">Thinking...</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about algorithms, data structures, techniques..."
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                className="min-h-[60px]"
              />
              <Button onClick={() => send()} disabled={loading} size="icon" className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
