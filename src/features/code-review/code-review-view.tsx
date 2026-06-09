"use client";

import { useState } from "react";
import { reviewCodeAction } from "@/actions/code-review.actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { CodeReviewResult } from "@/types";

export function CodeReviewView() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<"cpp" | "java" | "py">("cpp");
  const [review, setReview] = useState<CodeReviewResult | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "cpp" || ext === "cc") setLanguage("cpp");
    else if (ext === "java") setLanguage("java");
    else if (ext === "py") setLanguage("py");

    const reader = new FileReader();
    reader.onload = (ev) => setCode(ev.target?.result as string);
    reader.readAsText(file);
  }

  async function handleReview() {
    if (!code.trim()) {
      toast.error("Please paste or upload code first");
      return;
    }
    setLoading(true);
    const result = await reviewCodeAction({
      fileName: `solution.${language}`,
      language,
      sourceCode: code,
    });
    setLoading(false);

    if (result.success) {
      setReview(result.data);
      toast.success("Review complete!");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <DashboardShell title="AI Code Review" description="Upload .cpp, .java, or .py for analysis">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Your Code</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload File</Label>
              <input type="file" accept=".cpp,.cc,.java,.py" onChange={handleFileUpload} className="text-sm text-zinc-400" />
            </div>
            <Tabs value={language} onValueChange={(v) => setLanguage(v as "cpp" | "java" | "py")}>
              <TabsList>
                <TabsTrigger value="cpp">C++</TabsTrigger>
                <TabsTrigger value="java">Java</TabsTrigger>
                <TabsTrigger value="py">Python</TabsTrigger>
              </TabsList>
            </Tabs>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your solution here..."
              className="min-h-[400px] font-mono text-xs"
            />
            <Button onClick={handleReview} disabled={loading} className="w-full">
              {loading ? "Analyzing..." : "Review Code"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Review Report</CardTitle></CardHeader>
          <CardContent>
            {!review ? (
              <p className="text-zinc-500 text-sm py-12 text-center">Submit code to see the AI review</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-zinc-300">{review.summary}</p>
                <div className="flex gap-2">
                  <Badge>Time: {review.timeComplexity}</Badge>
                  <Badge variant="secondary">Space: {review.spaceComplexity}</Badge>
                </div>
                <Section title="Edge Cases" items={review.edgeCases} />
                <Section title="Optimizations" items={review.optimizations} />
                <Section title="Alternatives" items={review.alternatives} />
                <Section title="Bugs" items={review.bugs} />
                <div>
                  <p className="text-sm font-medium text-zinc-300 mb-1">Code Quality</p>
                  <p className="text-sm text-zinc-400">{review.codeQuality}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-sm font-medium text-zinc-300 mb-1">{title}</p>
      <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
