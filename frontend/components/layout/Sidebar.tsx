"use client";
//kausar kausar kausar
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import {
  Link as LinkIcon, Calendar, Clock, Users, Grid, GitBranch, Zap, BarChart2,
  ExternalLink, Copy, Gift, Settings, Search, ChevronDown, LogOut,
  User, Sun, Moon, Monitor
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/event-types", label: "Event types", icon: LinkIcon },
  { href: "/bookings", label: "Bookings", icon: Calendar },
  { href: "/availability", label: "Availability", icon: Clock },
  { href: "/teams", label: "Teams", icon: Users },
  {
    href: "/apps", label: "Apps", icon: Grid, children: [
      { href: "/apps/store", label: "App store" },
      { href: "/apps/installed", label: "Installed apps" },
    ]
  },
  { href: "/routing", label: "Routing", icon: GitBranch },
  { href: "/workflows", label: "Workflows", icon: Zap },
  {
    href: "/insights", label: "Insights", icon: BarChart2, children: [
      { href: "/insights/bookings", label: "Bookings" },
      { href: "/routing", label: "Routing" },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["/apps", "/insights"]);

  const toggleExpand = (href: string) => {
    setExpandedItems(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="sticky top-0 h-screen w-[230px] flex flex-col shrink-0 bg-white border-r border-zinc-150 dark:bg-zinc-950 dark:border-zinc-900 z-40 select-none">

      {/* Premium Sidebar User Header */}
      <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-zinc-50 transition-colors dark:hover:bg-zinc-900/60 cursor-pointer"
          >
            {/* Display Avatar letter dynamically */}
            <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {user?.name?.charAt(0) || "M"}
            </div>

            <span className="text-[18px] font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[100px] text-left">
              {user?.name || "Mo Kausar"}
            </span>
            <ChevronDown size={11} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
          </button>

          {/* Header Search Trigger */}
          <button className="p-15 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-900 cursor-pointer">
            <Search size={14} />
          </button>
        </div>

        {/* User Settings / Logout Dropdown */}
        {userMenuOpen && (
          <div className="absolute left-3.5 right-3.5 mt-1.5 bg-white border border-zinc-150 rounded-lg shadow-lg z-50 py-1 dark:bg-zinc-900 dark:border-zinc-800 animate-fade-in">
            <Link
              href="/settings/profile"
              className="flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/80 transition-colors"
              onClick={() => setUserMenuOpen(false)}
            >
              <User size={13} className="text-zinc-400" /> My profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/80 transition-colors"
              onClick={() => setUserMenuOpen(false)}
            >
              <Settings size={13} className="text-zinc-400" /> My settings
            </Link>

            <div className="border-t border-zinc-100 my-1 dark:border-zinc-800" />

            {/* Quick theme selector pill inside menu */}
            <div className="px-3 py-1.5">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 dark:text-zinc-500">Theme</p>
              <div className="flex gap-1 bg-zinc-50 p-0.5 rounded-md dark:bg-zinc-950">
                {[
                  { value: "system" as const, icon: Monitor, title: "System" },
                  { value: "light" as const, icon: Sun, title: "Light" },
                  { value: "dark" as const, icon: Moon, title: "Dark" },
                ].map(({ value, icon: Icon, title }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={clsx(
                      "flex-1 flex items-center justify-center py-1 rounded-[4px] text-xs transition-colors cursor-pointer",
                      theme === value
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-400 hover:text-zinc-950 dark:text-zinc-500 dark:hover:text-white"
                    )}
                    title={title}
                  >
                    <Icon size={12} />
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-100 my-1 dark:border-zinc-800" />

            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-medium text-red-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation links */}
      <nav className="flex-1 overflow-y-auto pt-5 pl-4 ml-10 pr-3 space-y-2 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const expanded = expandedItems.includes(item.href);

          return (
            <div key={item.href}>
              {item.children ? (

                /* Collapsible Category Button */
                <button
                  onClick={() => toggleExpand(item.href)}
                  className={clsx(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-[18px] font-medium transition-all cursor-pointer",
                    active
                      ? "bg-zinc-100/70 text-zinc-900 dark:bg-zinc-900/60 dark:text-white"
                      : "text-zinc-550 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/40 dark:hover:text-white"
                  )}
                >
                  <Icon size={18} className={clsx("shrink-0", active ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500")} />
                  <span className="flex-1 text-left tracking-tight">{item.label}</span>
                  <ChevronDown size={12} className={clsx("text-zinc-400 transition-transform duration-200", expanded && "rotate-180")} />
                </button>
              ) : (

                /* Standard Menu Link */
                <Link
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2 rounded-[8px] text-[18px] font-medium transition-all",
                    active
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                      : "text-zinc-550 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/40 dark:hover:text-white"
                  )}
                >
                  <Icon size={15} className={clsx("shrink-0", active ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500")} />
                  <span className="tracking-tight">{item.label}</span>
                </Link>
              )}

              {/* Expandable Sub-items */}
              {item.children && expanded && (
                <div className="mr-11 mt-1 space-y-1 pl-2">
                  {item.children.map(child => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={clsx(
                        "flex items-center px-3 py-1.5 rounded-[6px] text-[18px] font-medium transition-all block",
                        pathname === child.href
                          ? "text-zinc-900 bg-zinc-100/50 dark:text-white dark:bg-zinc-900/30"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-900/20 dark:hover:text-white"
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Profile Links bar */}
      <div className="p-3 border-t border-zinc-100 dark:border-zinc-900 space-y-0.5">
        {user && (
          <>
            {/* Action 1: View Public Profile */}
            <a
              href={`/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-1.5 rounded-[8px] text-[13px] font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all dark:text-zinc-450 dark:hover:bg-zinc-900/40 dark:hover:text-white"
            >
              <ExternalLink size={14} className="shrink-0 text-zinc-400" /> View public page
            </a>

            {/* Action 2: Copy Page Link */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/${user.username}`);
              }}
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-[8px] text-[13px] font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all dark:text-zinc-450 dark:hover:bg-zinc-900/40 dark:hover:text-white cursor-pointer"
            >
              <Copy size={14} className="shrink-0 text-zinc-400" /> Copy public page link
            </button>

            {/* Action 3: Refer and Earn */}
            <button
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-[8px] text-[13px] font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all dark:text-zinc-450 dark:hover:bg-zinc-900/40 dark:hover:text-white cursor-pointer"
            >
              <Gift size={14} className="shrink-0 text-zinc-400" /> Refer and earn
            </button>

            {/* Action 4: Account settings */}
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-1.5 rounded-[8px] text-[13px] font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all dark:text-zinc-450 dark:hover:bg-zinc-900/40 dark:hover:text-white"
            >
              <Settings size={14} className="shrink-0 text-zinc-400" /> Settings
            </Link>
          </>
        )}

        {/* Fine Wording Copyright details */}
        <div className="pt-3 pb-1 text-[9.5px] text-zinc-350 dark:text-zinc-650 text-center tracking-tight font-medium">
          © 2026 Cal.com, Inc. v.6.5.7-h-675eb77
        </div>
      </div>

    </aside>
  );
}
