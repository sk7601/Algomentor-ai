"use client";

import { useState } from "react";
import { updateSettingsAction } from "@/actions/profile.actions";
import { syncProfileAction } from "@/actions/profile.actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const [cfHandle, setCfHandle] = useState("");
  const [lcUser, setLcUser] = useState("");
  const [targetRating, setTargetRating] = useState(1600);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateSettingsAction({
      codeforcesHandle: cfHandle || undefined,
      leetcodeUsername: lcUser || undefined,
      targetRating,
      bio: bio || undefined,
      theme: (theme as "dark" | "light" | "system") || "dark",
    });
    setSaving(false);
    if (result.success) toast.success(result.data.message);
    else toast.error(result.error);
  }

  async function handleSync() {
    setSyncing(true);
    const result = await syncProfileAction({
      codeforcesHandle: cfHandle || undefined,
      leetcodeUsername: lcUser || undefined,
    });
    setSyncing(false);
    if (result.success) toast.success(result.data.message);
    else toast.error(result.error);
  }

  return (
    <DashboardShell title="Settings" description="Profile, theme, and API configuration">
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Connect your competitive programming accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Codeforces Handle</Label>
                  <Input value={cfHandle} onChange={(e) => setCfHandle(e.target.value)} placeholder="tourist" />
                </div>
                <div className="space-y-2">
                  <Label>LeetCode Username</Label>
                  <Input value={lcUser} onChange={(e) => setLcUser(e.target.value)} placeholder="username" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Target Rating</Label>
                <Input type="number" value={targetRating} onChange={(e) => setTargetRating(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about your CP journey..." />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Profile"}</Button>
                <Button variant="outline" onClick={handleSync} disabled={syncing}>{syncing ? "Syncing..." : "Sync Data"}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Customize the appearance of AlgoMentor AI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {(["dark", "light", "system"] as const).map((t) => (
                  <Button
                    key={t}
                    variant={theme === t ? "default" : "outline"}
                    onClick={() => setTheme(t)}
                    className="capitalize"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your AlgoMentor AI account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-400">
                Your account data is stored securely. Profile sync data is cached in Redis for 24 hours.
              </p>
              <p className="text-sm text-zinc-400">
                JWT sessions expire after 30 days. Use the logout button in the header to sign out.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
