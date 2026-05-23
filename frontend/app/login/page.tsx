"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, Sun, Moon, Laptop } from "lucide-react";
import { clsx } from "clsx";

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Timezone clock states
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timezones = [
    { label: "UTC -8", offset: -8 },
    { label: "UTC -6", offset: -6 },
    { label: "UTC -4", offset: -4 },
    { label: "UTC -2", offset: -2 },
    { label: "UTC +0", offset: 0 },
    { label: "UTC +2", offset: 2 },
    { label: "UTC +4", offset: 4 },
    { label: "UTC +6", offset: 6 },
    { label: "UTC +8", offset: 8 },
  ];

  const formatTimeForOffset = (date: Date, offset: number) => {
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const targetDate = new Date(utc + 3600000 * offset);
    return targetDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-white text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100">

      {/* Floating Theme Toggle Pill (Top-Right) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-0.5 rounded-full border border-zinc-100 bg-white/80 p-0.5 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        {([
          { mode: "system", icon: Laptop, label: "System" },
          { mode: "light", icon: Sun, label: "Light" },
          { mode: "dark", icon: Moon, label: "Dark" }
        ] as const).map(({ mode, icon: Icon, label }) => {
          const active = theme === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setTheme(mode)}
              className={clsx(
                "p-1.5 rounded-full transition-all duration-150 relative group",
                active
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
              )}
              title={label}
            >
              <Icon size={13} />
            </button>
          );
        })}
      </div>

      {/* World Map Background with Dot Pattern */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none overflow-hidden">
        <svg
          viewBox="0 0 1000 500"
          className="w-full max-w-[1200px] h-[550px] opacity-[0.55] dark:opacity-[0.2] transition-opacity duration-300"
        >
          <defs>
            <pattern id="dotPattern" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.1" className="fill-zinc-300 dark:fill-zinc-800 transition-colors duration-300" />
            </pattern>
            <mask id="mapMask">
              <rect width="100%" height="100%" fill="url(#maskGradient)" />
            </mask>
            <radialGradient id="maskGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="60%" stopColor="white" stopOpacity="0.7" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g mask="url(#mapMask)">
            {/* Greenland */}
            <path d="M240,40 L280,30 L290,60 L250,70 Z" fill="url(#dotPattern)" />
            {/* North America */}
            <path
              d="M100,80 L180,80 L200,50 L240,50 L250,90 L290,110 L300,160 L240,180 L250,220 L220,260 L210,260 L210,220 L180,180 L150,180 L110,130 L90,130 Z"
              fill="url(#dotPattern)"
            />
            {/* South America */}
            <path
              d="M220,260 L250,280 L290,320 L270,400 L240,460 L230,460 L210,380 L200,320 Z"
              fill="url(#dotPattern)"
            />
            {/* Europe & Asia */}
            <path
              d="M350,120 L380,80 L440,60 L500,50 L600,50 L700,60 L800,80 L880,100 L900,150 L840,180 L820,230 L800,260 L740,280 L680,240 L640,240 L600,280 L520,280 L480,220 L400,220 L380,180 L350,185 Z"
              fill="url(#dotPattern)"
            />
            {/* Africa */}
            <path
              d="M450,220 L510,210 L560,240 L570,280 L550,340 L510,400 L490,400 L470,330 L430,260 Z"
              fill="url(#dotPattern)"
            />
            {/* Australia */}
            <path
              d="M780,340 L830,350 L850,380 L810,410 L770,380 Z"
              fill="url(#dotPattern)"
            />
            {/* Madagascar */}
            <path d="M560,350 A12,18 0 1 1 560,351 Z" fill="url(#dotPattern)" />
            {/* UK */}
            <path d="M345,95 A8,8 0 1 1 345,96 Z" fill="url(#dotPattern)" />
            {/* Japan */}
            <path d="M880,160 A8,15 0 1 1 880,161 Z" fill="url(#dotPattern)" />
          </g>
        </svg>
      </div>

      {/* Main Content (Vertically & Horizontally Centered Card) */}
      <div className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-[430px] transition-all">

          {/* Authentic Cal.com Login Card */}
          <div className="overflow-hidden rounded-[20px] border border-gray-150 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.015)] transition-all duration-300 dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:backdrop-blur-md">

            {/* Main Form Content Area */}
            <div className="px-9 pt-9 pb-7 sm:px-10 sm:pt-10">

              {/* Header Logo & Title */}
              <div className="mb-7 text-center">
                <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-zinc-900 dark:text-white">
                  Cal.com
                </h1>
                <p className="mt-1 text-[13.5px] font-normal text-zinc-400 dark:text-zinc-500">
                  Welcome back! Sign in to continue
                </p>
              </div>

              {/* OAuth Identity Providers */}
              <div className="space-y-2">

                {/* Google Sign-in */}
                <button
                  type="button"
                  className="flex h-[38px] w-full items-center justify-center gap-2.5 rounded-[8px] bg-zinc-900 text-[13.5px] font-medium text-white transition-opacity duration-150 hover:opacity-95 dark:bg-white dark:text-zinc-950 dark:hover:opacity-90 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.42-4.67H24v8.87h12.71c-.55 2.92-2.2 5.39-4.68 7.05l7.25 5.62C43.5 36.33 46.5 30.73 46.5 24z" />
                    <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.25-5.62c-2.03 1.37-4.63 2.18-8.64 2.18-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  Sign in with Google
                </button>

                {/* Microsoft Sign-in */}
                <button
                  type="button"
                  className="flex h-[38px] w-full items-center justify-center gap-2.5 rounded-[8px] bg-zinc-50 border border-zinc-200/60 text-[13.5px] font-medium text-zinc-800 transition-colors duration-150 hover:bg-zinc-100 dark:bg-zinc-800/80 dark:border-zinc-700/60 dark:text-zinc-100 dark:hover:bg-zinc-700/80 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                  Sign in with Microsoft
                </button>
              </div>

              {/* Minimal Divider ("or") */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-100 dark:border-zinc-800/80" />
                </div>
                <span className="relative bg-white px-3 text-[12px] font-normal text-zinc-400 dark:bg-zinc-900/30 dark:text-zinc-600">
                  or
                </span>
              </div>

              {/* Render Backend Errors Dynamically */}
              {error && (
                <div className="mb-4 rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2 text-xs text-red-500 transition-all dark:border-red-500/20 dark:bg-red-500/10">
                  {error}
                </div>
              )}

              {/* Login Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">

                {/* Email Field */}
                <div>
                  <label className="ml-4 mb-1 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-[38px] w-full rounded-[8px] border border-zinc-200 bg-white px-3 text-[13.5px] text-zinc-900 outline-none transition-all placeholder:text-zinc-300 hover:border-zinc-300 focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:placeholder:text-zinc-700 dark:hover:border-zinc-700 dark:focus:border-zinc-500"
                    placeholder="you@example.com"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-[12.5px] font-medium text-zinc-400 hover:text-zinc-600 transition-colors dark:text-zinc-500 dark:hover:text-zinc-300"
                    >
                      Forgot?
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-[38px] w-full rounded-[8px] border border-zinc-200 bg-white px-3 pr-10 text-[13.5px] text-zinc-900 outline-none transition-all placeholder:text-zinc-300 hover:border-zinc-300 focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:placeholder:text-zinc-700 dark:hover:border-zinc-700 dark:focus:border-zinc-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  loading={loading}
                  className="mt-1 h-[38px] w-full rounded-[8px] bg-zinc-900 text-[13.5px] font-medium text-white hover:bg-black transition-all dark:bg-white dark:text-zinc-950 dark:hover:opacity-90 cursor-pointer"
                  size="lg"
                >
                  Continue
                </Button>
              </form>
            </div>

            {/* Shaded bottom box for Call-To-Action / SAML options */}
            <div className="border-t border-zinc-100 bg-zinc-50/40 px-9 py-4 dark:border-zinc-800/80 dark:bg-zinc-900/20">
              <div className="flex items-center justify-center gap-2.5 text-[13px] font-medium">
                <Link
                  href="/register"
                  className="text-zinc-850 hover:text-zinc-950 transition-colors dark:text-zinc-300 dark:hover:text-white"
                >
                  Create account
                </Link>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <button
                  type="button"
                  className="text-zinc-400 hover:text-zinc-600 transition-colors dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                >
                  Sign in with SAML/OIDC
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Dynamic Timezone Clock Footer (Absolute Bottom) */}
      <div className="w-full border-t border-zinc-100 bg-white/70 py-3.5 backdrop-blur-md z-20 dark:border-zinc-900/60 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-7 px-5 sm:gap-9 md:gap-11 overflow-x-auto no-scrollbar">
          {timezones.map((zone) => {
            const formattedTime = mounted && currentTime
              ? formatTimeForOffset(currentTime, zone.offset)
              : "--:-- --";
            return (
              <div key={zone.label} className="text-center min-w-[65px] shrink-0">
                <div className="text-[11.5px] font-semibold text-amber-500 dark:text-amber-400/90 transition-colors tabular-nums">
                  {formattedTime}
                </div>
                <div className="mt-0.5 text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  {zone.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}