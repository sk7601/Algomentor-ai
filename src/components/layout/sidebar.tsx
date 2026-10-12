"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Brain,
  Code2,
  Gauge,
  LayoutDashboard,
  Map,
  MessageSquare,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Profile Analytics", icon: BarChart3 },
  { href: "/topics", label: "Topic Analysis", icon: Brain },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/tutor", label: "AI Tutor", icon: MessageSquare },
  { href: "/code-review", label: "Code Review", icon: Code2 },
  { href: "/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/predictions", label: "Contest Predictor", icon: TrendingUp },
  { href: "/interview", label: "Interview Ready", icon: Target },
  { href: "/advanced-analytics", label: "Advanced Analytics", icon: Gauge },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100">AlgoMentor AI</p>
          <p className="text-xs text-zinc-500">CP Intelligence</p>
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-violet-600/15 text-violet-300"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 p-4">
        <div className="rounded-lg bg-zinc-900 p-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <BookOpen className="h-3 w-3" />
            Powered by OpenRouter
          </div>
        </div>
      </div>
    </aside>
  );
}
