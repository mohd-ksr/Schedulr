"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Eye, EyeOff, Sun, Moon, Monitor } from "lucide-react";
import { clsx } from "clsx";

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
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

  // ── Color tokens based on resolvedTheme ──
  const c = {
    pageBg:        isDark ? "#0a0a0a"                      : "#f4f4f5",
    pageColor:     isDark ? "white"                        : "#0a0a0a",
    pillBorder:    isDark ? "rgba(255,255,255,0.1)"        : "rgba(0,0,0,0.1)",
    pillBg:        isDark ? "rgba(16,16,16,0.92)"          : "rgba(255,255,255,0.92)",
    tbtnColor:     isDark ? "rgba(255,255,255,0.28)"       : "rgba(0,0,0,0.28)",
    tbtnOn:        isDark ? "rgba(255,255,255,0.11)"       : "rgba(0,0,0,0.08)",
    tbtnOnColor:   isDark ? "white"                        : "#0a0a0a",
    cardBg:        isDark ? "#111111"                      : "#ffffff",
    cardBorder:    isDark ? "rgba(255,255,255,0.08)"       : "rgba(0,0,0,0.08)",
    cardShadow:    isDark ? "0 2px 4px rgba(0,0,0,0.6), 0 24px 72px rgba(0,0,0,0.7)"
                          : "0 2px 4px rgba(0,0,0,0.06), 0 24px 72px rgba(0,0,0,0.08)",
    headH1:        isDark ? "white"                        : "#0a0a0a",
    headP:         isDark ? "rgba(255,255,255,0.48)"       : "rgba(0,0,0,0.48)",
    googleBg:      isDark ? "white"                        : "white",
    googleColor:   "#0a0a0a",
    msBg:          isDark ? "#1a1a1a"                      : "#f0f0f0",
    msBgHover:     isDark ? "#212121"                      : "#e4e4e7",
    msColor:       isDark ? "white"                        : "#0a0a0a",
    msBorder:      isDark ? "rgba(255,255,255,0.1)"        : "rgba(0,0,0,0.1)",
    divLine:       isDark ? "rgba(255,255,255,0.07)"       : "rgba(0,0,0,0.07)",
    divSpanBg:     isDark ? "#111111"                      : "#ffffff",
    divSpanColor:  isDark ? "rgba(255,255,255,0.2)"        : "rgba(0,0,0,0.2)",
    label:         isDark ? "rgba(255,255,255,0.68)"       : "rgba(0,0,0,0.68)",
    forgot:        isDark ? "rgba(255,255,255,0.24)"       : "rgba(0,0,0,0.3)",
    inputBg:       isDark ? "#1a1a1a"                      : "#fafafa",
    inputBorder:   isDark ? "rgba(255,255,255,0.1)"        : "rgba(0,0,0,0.12)",
    inputColor:    isDark ? "white"                        : "#0a0a0a",
    inputPH:       isDark ? "rgba(255,255,255,0.16)"       : "rgba(0,0,0,0.22)",
    eyeColor:      isDark ? "rgba(255,255,255,0.28)"       : "rgba(0,0,0,0.28)",
    submitBg:      isDark ? "white"                        : "#0a0a0a",
    submitColor:   isDark ? "#0a0a0a"                      : "white",
    footBorder:    isDark ? "rgba(255,255,255,0.07)"       : "rgba(0,0,0,0.07)",
    footBg:        isDark ? "rgba(255,255,255,0.018)"      : "rgba(0,0,0,0.018)",
    footLink:      isDark ? "rgba(255,255,255,0.68)"       : "rgba(0,0,0,0.68)",
    footDot:       isDark ? "rgba(255,255,255,0.14)"       : "rgba(0,0,0,0.14)",
    saml:          isDark ? "rgba(255,255,255,0.32)"       : "rgba(0,0,0,0.32)",
    tzBarBorder:   isDark ? "rgba(255,255,255,0.05)"       : "rgba(0,0,0,0.06)",
    tzBarBg:       isDark ? "rgba(8,8,8,0.92)"            : "rgba(255,255,255,0.92)",
    tzLbl:         isDark ? "rgba(255,255,255,0.27)"       : "rgba(0,0,0,0.35)",
    mapOpacity:    isDark ? 0.18                           : 0.45,
    mapDotColor:   isDark ? "white"                        : "#52525b",
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: c.pageBg,
      display: "flex", flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: c.pageColor,
      overflow: "hidden",
      transition: "background 0.2s, color 0.2s",
    }}>

      {/* World-map dot background */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none", zIndex: 0, overflow: "hidden",
      }}>
        <svg
          viewBox="0 0 1000 500"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", maxWidth: 1300, height: 620, opacity: c.mapOpacity, transition: "opacity 0.3s" }}
        >
          <defs>
            <pattern id="dp" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.6" fill={c.mapDotColor} />
            </pattern>
            <mask id="mm">
              <rect width="100%" height="100%" fill="url(#mg)" />
            </mask>
            <radialGradient id="mg" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="white" stopOpacity="1" />
              <stop offset="65%"  stopColor="white" stopOpacity="0.85" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g mask="url(#mm)">
            <path d="M240,40 L280,30 L290,60 L250,70 Z" fill="url(#dp)" />
            <path d="M100,80 L180,80 L200,50 L240,50 L250,90 L290,110 L300,160 L240,180 L250,220 L220,260 L210,260 L210,220 L180,180 L150,180 L110,130 L90,130 Z" fill="url(#dp)" />
            <path d="M220,260 L250,280 L290,320 L270,400 L240,460 L230,460 L210,380 L200,320 Z" fill="url(#dp)" />
            <path d="M350,120 L380,80 L440,60 L500,50 L600,50 L700,60 L800,80 L880,100 L900,150 L840,180 L820,230 L800,260 L740,280 L680,240 L640,240 L600,280 L520,280 L480,220 L400,220 L380,180 L350,185 Z" fill="url(#dp)" />
            <path d="M450,220 L510,210 L560,240 L570,280 L550,340 L510,400 L490,400 L470,330 L430,260 Z" fill="url(#dp)" />
            <path d="M780,340 L830,350 L850,380 L810,410 L770,380 Z" fill="url(#dp)" />
            <ellipse cx="562" cy="358" rx="8"  ry="14" fill="url(#dp)" />
            <ellipse cx="345" cy="97"  rx="6"  ry="8"  fill="url(#dp)" />
            <ellipse cx="882" cy="163" rx="6"  ry="13" fill="url(#dp)" />
          </g>
        </svg>
      </div>

      {/* Theme pill */}
      <div style={{
        position: "absolute", top: 16, right: 16, zIndex: 50,
        display: "flex", alignItems: "center", gap: 2,
        borderRadius: 999, border: `1px solid ${c.pillBorder}`,
        background: c.pillBg, padding: 2,
        backdropFilter: "blur(12px)",
        transition: "background 0.2s, border-color 0.2s",
      }}>
        {([
          { mode: "system", icon: Monitor, label: "System" },
          { mode: "light",  icon: Sun,     label: "Light"  },
          { mode: "dark",   icon: Moon,    label: "Dark"   },
        ] as const).map(({ mode, icon: Icon, label }) => {
          const active = theme === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setTheme(mode)}
              title={label}
              style={{
                width: 28, height: 28, borderRadius: 999, border: "none",
                background: active ? c.tbtnOn : "transparent",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: active ? c.tbtnOnColor : c.tbtnColor,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <Icon size={13} />
            </button>
          );
        })}
      </div>

      {/* Centered card */}
      <div style={{
        position: "relative", zIndex: 10, flex: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px 16px 80px",
      }}>
        <div style={{
          width: "100%", maxWidth: 430,
          borderRadius: 20, border: `1px solid ${c.cardBorder}`,
          background: c.cardBg, boxShadow: c.cardShadow,
          overflow: "hidden",
          transition: "background 0.2s, border-color 0.2s",
        }}>

          {/* Body */}
          <div style={{ padding: "36px 40px 28px" }}>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 26 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em", color: c.headH1 }}>
                schedulr-in
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 13.5, color: c.headP }}>
                Welcome back! Sign in to continue
              </p>
            </div>

            {/* OAuth */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button type="button" style={{
                display: "flex", height: 38, width: "100%",
                alignItems: "center", justifyContent: "center", gap: 10,
                borderRadius: 8, fontSize: 13.5, fontWeight: 500,
                cursor: "pointer", fontFamily: "inherit",
                background: c.googleBg, color: c.googleColor, border: "none",
                transition: "opacity 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.42-4.67H24v8.87h12.71c-.55 2.92-2.2 5.39-4.68 7.05l7.25 5.62C43.5 36.33 46.5 30.73 46.5 24z"/>
                  <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.25-5.62c-2.03 1.37-4.63 2.18-8.64 2.18-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Sign in with Google
              </button>

              <button type="button" style={{
                display: "flex", height: 38, width: "100%",
                alignItems: "center", justifyContent: "center", gap: 10,
                borderRadius: 8, fontSize: 13.5, fontWeight: 500,
                cursor: "pointer", fontFamily: "inherit",
                background: c.msBg, color: c.msColor, border: `1px solid ${c.msBorder}`,
                transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = c.msBgHover)}
                onMouseLeave={e => (e.currentTarget.style.background = c.msBg)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                Sign in with Microsoft
              </button>
            </div>

            {/* Divider */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", margin: "20px 0" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: c.divLine }} />
              <span style={{ position: "relative", background: c.divSpanBg, padding: "0 12px", fontSize: 12, color: c.divSpanColor }}>
                or
              </span>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginBottom: 14, borderRadius: 8,
                border: "1px solid rgba(239,68,68,0.2)",
                background: "rgba(239,68,68,0.08)",
                padding: "8px 12px", fontSize: 12, color: "#f87171",
              }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form style={{ display: "flex", flexDirection: "column", gap: 14 }} onSubmit={handleSubmit}>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label htmlFor="email" style={{ fontSize: 13, fontWeight: 500, color: c.label }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{
                    height: 38, width: "100%", borderRadius: 8,
                    border: `1px solid ${c.inputBorder}`,
                    background: c.inputBg, padding: "0 12px",
                    fontSize: 13.5, color: c.inputColor,
                    outline: "none", fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.4)")}
                  onBlur={e => (e.currentTarget.style.borderColor = c.inputBorder)}
                />
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <label htmlFor="password" style={{ fontSize: 13, fontWeight: 500, color: c.label }}>
                    Password
                  </label>
                  <button type="button" style={{
                    fontSize: 12.5, fontWeight: 500, color: c.forgot,
                    background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                  }}>
                    Forgot?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{
                      height: 38, width: "100%", borderRadius: 8,
                      border: `1px solid ${c.inputBorder}`,
                      background: c.inputBg, padding: "0 38px 0 12px",
                      fontSize: 13.5, color: c.inputColor,
                      outline: "none", fontFamily: "inherit",
                      boxSizing: "border-box",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = c.inputBorder)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: c.eyeColor, display: "flex", alignItems: "center", padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4, height: 38, width: "100%",
                  borderRadius: 8, border: "none",
                  background: c.submitBg, color: c.submitColor,
                  fontSize: 13.5, fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.55 : 1,
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "opacity 0.15s, background 0.2s",
                }}
              >
                {loading
                  ? <div style={{ width: 15, height: 15, border: `2px solid ${isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.3)"}`, borderTopColor: isDark ? "#111" : "white", borderRadius: "50%", animation: "lr-spin 0.65s linear infinite" }} />
                  : "Continue"
                }
              </button>
            </form>
          </div>

          {/* Footer */}
          <div style={{
            borderTop: `1px solid ${c.footBorder}`,
            background: c.footBg,
            padding: "16px 40px",
            transition: "background 0.2s",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 13, fontWeight: 500 }}>
              <Link href="/register" style={{ color: c.footLink, textDecoration: "none" }}>
                Create account
              </Link>
              <span style={{ color: c.footDot }}>·</span>
              <button type="button" style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 500, fontFamily: "inherit", color: c.saml,
              }}>
                Sign in with SAML/OIDC
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Timezone bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
        borderTop: `1px solid ${c.tzBarBorder}`,
        background: c.tzBarBg,
        backdropFilter: "blur(14px)",
        padding: "12px 20px 13px",
        transition: "background 0.2s",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", overflowX: "auto", scrollbarWidth: "none" }}>
          {timezones.map((zone) => {
            const t = mounted && currentTime ? formatTimeForOffset(currentTime, zone.offset) : "--:-- --";
            return (
              <div key={zone.label} style={{ textAlign: "center", minWidth: 72, flexShrink: 0, padding: "0 6px" }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#f59e0b", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {t}
                </div>
                <div style={{ marginTop: 2, fontSize: 9, fontWeight: 600, color: c.tzLbl, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {zone.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes lr-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}