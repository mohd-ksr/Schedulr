"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, ArrowLeft, Sun, Moon, Laptop, Calendar, Clock, Share2 } from "lucide-react";
import { clsx } from "clsx";

export default function RegisterPage() {
  const { register } = useAuth();
  const { theme, setTheme } = useTheme();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    timezone: "Asia/Kolkata",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        setForm(prev => ({ ...prev, timezone: tz }));
      }
    } catch (e) {}
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasMinLength = form.password.length >= 8;
  const hasUpperLower = /[a-z]/.test(form.password) && /[A-Z]/.test(form.password);
  const hasNumber = /[0-9]/.test(form.password);

  return (
    <div className="relative min-h-screen flex bg-white text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100">
      
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

      {/* Left - Signup Form Column (Centered Horizontally within Left Half) */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12 md:px-12 lg:px-16 z-10">
        <div className="w-full max-w-[400px] sm:max-w-[420px] transition-all">
          
          {/* Back Link */}
          <Link 
            href="/login" 
            className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-zinc-400 hover:text-zinc-900 transition-colors mb-6 dark:text-zinc-500 dark:hover:text-white"
          >
            <ArrowLeft size={14} /> Back
          </Link>

          {/* Title & Subtitle */}
          <h1 className="text-[25px] font-semibold tracking-[-0.03em] text-zinc-900 dark:text-white">
            Create your Cal.com account
          </h1>
          <p className="text-[13.5px] font-normal text-zinc-400 dark:text-zinc-500 mt-1 mb-6">
            Free for individuals. Team plans for collaborative features.
          </p>

          {/* Render Backend Errors Dynamically */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/10 bg-red-500/5 px-3.5 py-2.5 text-xs text-red-500 transition-all dark:border-red-500/20 dark:bg-red-500/10">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name input (required by backend) */}
            <div>
              <label className="mb-1 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                Full name
              </label>
              <input
                value={form.name} 
                onChange={set("name")} 
                required
                placeholder="John Doe"
                className="h-[38px] w-full rounded-[8px] border border-zinc-200 bg-white px-3 text-[13.5px] text-zinc-900 outline-none transition-all placeholder:text-zinc-300 hover:border-zinc-300 focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:placeholder:text-zinc-700 dark:hover:border-zinc-700 dark:focus:border-zinc-500"
              />
            </div>

            {/* Dummy Data Region to match Cal.com Signup Screenshot */}
            <div>
              <label className="mb-1 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                Data region
              </label>
              <div className="relative">
                <select
                  disabled
                  className="h-[38px] w-full rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3 text-[13.5px] text-zinc-500 outline-none appearance-none cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400"
                >
                  <option>United States</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Username Input with cal.com/ Prefix */}
            <div>
              <label className="mb-1 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                Username
              </label>
              <div className="flex h-[38px] items-center rounded-[8px] border border-zinc-200 bg-white overflow-hidden transition-all focus-within:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus-within:border-zinc-500">
                <span className="h-full flex items-center px-3 bg-zinc-50 border-r border-zinc-150 text-[13.5px] text-zinc-400 font-medium select-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500">
                  cal.com/
                </span>
                <input
                  value={form.username} 
                  onChange={set("username")} 
                  required
                  placeholder="username"
                  className="flex-1 h-full px-3 bg-transparent text-[13.5px] text-zinc-900 outline-none placeholder:text-zinc-300 dark:text-white dark:placeholder:text-zinc-700"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="mb-1 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <input
                type="email" 
                value={form.email} 
                onChange={set("email")} 
                required
                placeholder="john@doe.com"
                className="h-[38px] w-full rounded-[8px] border border-zinc-200 bg-white px-3 text-[13.5px] text-zinc-900 outline-none transition-all placeholder:text-zinc-300 hover:border-zinc-300 focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:placeholder:text-zinc-700 dark:hover:border-zinc-700 dark:focus:border-zinc-500"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="mb-1 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password} 
                  onChange={set("password")} 
                  required 
                  minLength={8}
                  placeholder="••••••••••••"
                  className="h-[38px] w-full rounded-[8px] border border-zinc-200 bg-white px-3 pr-10 text-[13.5px] text-zinc-900 outline-none transition-all placeholder:text-zinc-300 hover:border-zinc-300 focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:placeholder:text-zinc-700 dark:hover:border-zinc-700 dark:focus:border-zinc-500"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Checklist items styled beautifully */}
              <ul className="mt-2.5 space-y-1 text-[12.5px] font-medium transition-colors">
                {[
                  { checked: hasUpperLower, label: "Mix of uppercase & lowercase letters" },
                  { checked: hasMinLength, label: "Minimum 8 characters long" },
                  { checked: hasNumber, label: "Contain at least 1 number" },
                ].map(({ checked, label }) => (
                  <li 
                    key={label} 
                    className={clsx(
                      "flex items-center gap-2 transition-colors",
                      checked 
                        ? "text-zinc-900 dark:text-zinc-100" 
                        : "text-zinc-400 dark:text-zinc-500"
                    )}
                  >
                    <span 
                      className={clsx(
                        "w-1.5 h-1.5 rounded-full transition-all",
                        checked 
                          ? "bg-zinc-900 dark:bg-white scale-110" 
                          : "bg-zinc-250 dark:bg-zinc-800"
                      )} 
                    /> 
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Privacy Consent Agreement */}
            <div className="pt-2 text-[12.5px] leading-relaxed text-zinc-450 dark:text-zinc-500">
              By proceeding, you agree to Cal.com&apos;s{" "}
              <span className="font-semibold text-zinc-700 hover:underline dark:text-zinc-300 cursor-pointer">Terms</span>{" "}
              and{" "}
              <span className="font-semibold text-zinc-700 hover:underline dark:text-zinc-300 cursor-pointer">Privacy Policy</span>.
            </div>

            {/* Get Started Submit Button */}
            <Button 
              type="submit" 
              loading={loading} 
              className="w-full h-[38px] rounded-[8px] bg-zinc-900 text-[13.5px] font-medium text-white hover:bg-black transition-all dark:bg-white dark:text-zinc-950 dark:hover:opacity-90 cursor-pointer" 
              size="lg"
            >
              Get started
            </Button>
          </form>

          {/* Shaded bottom CTA to Login page */}
          <p className="mt-8 text-[13.5px] font-medium text-zinc-450 dark:text-zinc-500">
            Already have an account?{" "}
            <Link 
              href="/login" 
              className="font-semibold text-zinc-900 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>

      {/* Right - Premium Product Showcase & Interactive Booking Preview */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-zinc-50/40 p-12 border-l border-zinc-100 dark:bg-zinc-900/10 dark:border-zinc-900 transition-colors">
        
        {/* Top Badges Area */}
        <div className="flex items-center justify-center gap-8 xl:gap-12">
          {[
            { label: "Product of the day", rank: "1st" },
            { label: "Product of the week", rank: "1st" },
            { label: "Product of the month", rank: "1st" }
          ].map((badge, idx) => (
            <div key={idx} className="flex flex-col items-center">
              {/* laurels wreath custom geometric styling */}
              <div className="relative flex items-center justify-center w-12 h-12">
                <svg className="absolute w-full h-full text-amber-500/80 dark:text-amber-500/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 6c1 3.5 3 6.5 6 8.5M20 6c-1 3.5-3 6.5-6 8.5M12 4v16" strokeDasharray="1 1"/>
                  <circle cx="12" cy="11" r="3" fill="currentColor" className="text-amber-500/10"/>
                </svg>
                <span className="text-[12px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">{badge.rank}</span>
              </div>
              <span className="mt-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-center max-w-[90px]">
                {badge.label}
              </span>
            </div>
          ))}
        </div>

        {/* Center Booking mock screen matching the screenshot exactly */}
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="w-full max-w-[580px] bg-white rounded-[16px] border border-zinc-150 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_15px_35px_rgba(0,0,0,0.015)] overflow-hidden dark:bg-zinc-900/50 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 dark:divide-zinc-800">
              
              {/* Preview Host Info & Minimal Calendar View */}
              <div className="w-full sm:w-[230px] p-5 shrink-0">
                <div className="flex items-center gap-3 mb-5">
                  {/* Mock profile image */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                    AF
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Alex Fisher</p>
                    <p className="text-[13.5px] font-semibold text-zinc-900 dark:text-white">Design Workshop</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-[12px] font-medium text-zinc-500 dark:text-zinc-400 mb-5">
                  <div className="flex items-start gap-2">
                    <span className="text-zinc-400 mt-0.5">🕐</span>
                    <span>A longer chat to run through design.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">⏱️</span> 30 mins
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">📹</span> Zoom
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">🌍</span> Europe/Dublin
                  </div>
                </div>

                {/* Micro Calendar Mockup */}
                <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <div className="flex justify-between items-center text-[12px] font-bold text-zinc-800 dark:text-zinc-200 mb-3">
                    <span>June 2023</span>
                    <div className="flex gap-1.5 text-zinc-400">
                      <span className="cursor-pointer hover:text-zinc-900">&lt;</span>
                      <span className="cursor-pointer hover:text-zinc-900">&gt;</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-zinc-400 mb-1">
                    {["S","M","T","W","T","F","S"].map((d, i) => <span key={i}>{d}</span>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-medium">
                    {Array.from({ length: 30 }, (_, i) => {
                      const day = i + 1;
                      const active = day >= 20 && day <= 24;
                      return (
                        <span 
                          key={i} 
                          className={clsx(
                            "py-0.5 rounded-full select-none",
                            active 
                              ? "bg-zinc-900 text-white font-bold dark:bg-white dark:text-zinc-900" 
                              : "text-zinc-400 dark:text-zinc-600"
                          )}
                        >
                          {day}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Stacked Interactive Slot Columns Mockup */}
              <div className="flex-1 p-5 bg-zinc-50/20 dark:bg-zinc-900/10">
                <div className="flex items-center justify-between text-[13px] font-bold text-zinc-800 dark:text-zinc-200 mb-4">
                  <span>Jun 20, 2023</span>
                  <div className="flex gap-2 text-zinc-400 text-[11px] font-semibold select-none">
                    <span className="cursor-pointer hover:text-zinc-900">&lt;</span>
                    <span className="cursor-pointer hover:text-zinc-900">&gt;</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { day: "MON 20", slots: ["9:30 am", "10:00 am", "10:30 am", "11:00 am", "11:30 am", "12:00 pm", "12:30 pm", "5:30 pm", "6:30 pm"] },
                    { day: "TUE 21", slots: ["9:30 am", "10:00 am", "10:30 am", "11:00 am", "11:30 am", "12:00 pm", "12:30 pm", "5:30 pm", "6:30 pm"] },
                    { day: "WED 22", slots: ["9:30 am", "10:00 am", "11:30 am", "6:30 pm"] }
                  ].map((col, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 text-center tracking-wider mb-1 uppercase">
                        {col.day}
                      </span>
                      {col.slots.map((t, sIdx) => (
                        <div 
                          key={sIdx} 
                          className="h-[30px] flex items-center justify-center rounded-[6px] border border-zinc-150 bg-white text-[11.5px] font-semibold text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 cursor-pointer transition-all dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-zinc-300 dark:hover:text-white select-none shadow-sm"
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Benefits Footer columns at the bottom */}
        <div className="grid grid-cols-3 gap-4 border-t border-zinc-150 pt-8 dark:border-zinc-900">
          {[
            { 
              icon: Calendar, 
              title: "Connect all your calendars", 
              desc: "Cal.com reads availability from all your existing calendars." 
            },
            { 
              icon: Clock, 
              title: "Set your availability", 
              desc: "Set schedules for the times you want to be booked." 
            },
            { 
              icon: Share2, 
              title: "Share a link or embed", 
              desc: "Share your Cal.com link or embed on your site." 
            }
          ].map((benefit, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white">
                <benefit.icon size={14} className="text-zinc-400 dark:text-zinc-500" />
                <h4 className="text-[11.5px] font-bold tracking-tight">{benefit.title}</h4>
              </div>
              <p className="mt-1 text-[11px] font-medium leading-normal text-zinc-400 dark:text-zinc-500">
                {benefit.desc}
              </p>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
