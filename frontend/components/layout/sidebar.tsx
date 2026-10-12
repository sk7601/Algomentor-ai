"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Brain,
  Code2,
  LayoutDashboard,
  LogOut,
  Map,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi, clearTokens } from "@/lib/api";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/tutor", label: "AI Tutor", icon: Brain },
  { href: "/code-review", label: "Code Review", icon: Code2 },
  { href: "/recommendations", label: "Recommendations", icon: Target },
  { href: "/predictions", label: "Predictions", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearTokens();
      router.push("/login");
    }
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-border px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">AlgoMentor AI</p>
          <p className="text-xs text-muted-foreground">Competitive Coach</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="flex items-center gap-2 border-b border-border bg-card/50 px-4 py-3 md:hidden">
      <BookOpen className="h-5 w-5 text-primary" />
      <span className="font-semibold">AlgoMentor AI</span>
    </header>
  );
}
