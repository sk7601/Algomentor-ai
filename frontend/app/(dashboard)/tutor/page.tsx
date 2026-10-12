"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Send } from "lucide-react";
import { tutorApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTIONS = [
  "Explain DSU Rollback",
  "Explain Digit DP",
  "Explain Centroid Decomposition",
  "How does binary lifting work?",
  "Explain convex hull trick",
];

export default function TutorPage() {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

  const { data: sessions } = useQuery({
    queryKey: ["tutor-sessions"],
    queryFn: tutorApi.listSessions,
  });

  const createSession = useMutation({
    mutationFn: () => tutorApi.createSession("Tutor Session"),
    onSuccess: (data) => {
      setSessionId(data.id as string);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ["tutor-sessions"] });
    },
  });

  const sendMessage = useMutation({
    mutationFn: (content: string) => tutorApi.sendMessage(sessionId!, content),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content as string },
      ]);
      setMessage("");
    },
  });

  const handleSend = () => {
    if (!message.trim() || !sessionId) return;
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    sendMessage.mutate(message);
  };

  const handleSuggestion = (text: string) => {
    if (!sessionId) {
      createSession.mutate(undefined, {
        onSuccess: () => {
          setMessage(text);
        },
      });
      return;
    }
    setMessage(text);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Tutor</h1>
          <p className="text-muted-foreground">Ask about algorithms, data structures, and techniques</p>
        </div>
        {!sessionId && (
          <Button onClick={() => createSession.mutate()} disabled={createSession.isPending}>
            New Session
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(sessions || []).map((s) => (
              <button
                key={s.id as string}
                onClick={() => {
                  setSessionId(s.id as string);
                  tutorApi.getSession(s.id as string).then((session) => {
                    setMessages(
                      ((session.messages as Array<{ role: string; content: string }>) || [])
                    );
                  });
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {s.title as string}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 lg:col-span-3">
          <CardHeader>
            <CardTitle>Chat</CardTitle>
            <CardDescription>Powered by Gemini AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Button key={s} variant="outline" size="sm" onClick={() => handleSuggestion(s)}>
                  {s}
                </Button>
              ))}
            </div>

            <div className="h-96 space-y-4 overflow-y-auto rounded-lg border border-border p-4">
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground">
                  Start a session and ask a question
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-3 text-sm ${
                    m.role === "user" ? "ml-8 bg-primary/10" : "mr-8 bg-muted"
                  }`}
                >
                  <p className="mb-1 text-xs font-medium capitalize text-muted-foreground">{m.role}</p>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
              {sendMessage.isPending && (
                <p className="text-sm text-muted-foreground">Thinking...</p>
              )}
            </div>

            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about any CP topic..."
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button onClick={handleSend} disabled={!sessionId || sendMessage.isPending} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
