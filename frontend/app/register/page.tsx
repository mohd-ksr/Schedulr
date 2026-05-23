"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
} from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();

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

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (tz) {
        setForm((prev) => ({
          ...prev,
          timezone: tz,
        }));
      }
    } catch {}
  }, []);

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await register(form);
    } catch (err: any) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const hasMinLength =
    form.password.length >= 8;

  const hasUpperLower =
    /[a-z]/.test(form.password) &&
    /[A-Z]/.test(form.password);

  const hasNumber =
    /[0-9]/.test(form.password);

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #090909;
          font-family: Inter, sans-serif;
        }

        body::-webkit-scrollbar {
          display: none;
        }

        .rr-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
          background: #090909;
        }

        .rr {
          width: 100%;
          max-width: 1380px;
          min-height: 900px;
          background: #111111;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 28px;
          overflow: hidden;
          display: flex;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.02),
            0 25px 70px rgba(0,0,0,0.55);
        }

        /* LEFT */

        .rr-left {
          width: 520px;
          padding: 72px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #0d0d0d;
        }

        .rr-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 42px;
          color: rgba(255,255,255,0.42);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: 0.2s;
        }

        .rr-back:hover {
          color: white;
        }

        .rr-h1 {
          margin: 0 0 14px;
          font-size: 56px;
          line-height: 0.95;
          font-weight: 700;
          letter-spacing: -0.06em;
          color: white;
        }

        .rr-sub {
          margin: 0 0 42px;
          font-size: 18px;
          line-height: 1.7;
          color: rgba(255,255,255,0.42);
        }

        .rr-field {
          margin-bottom: 18px;
        }

        .rr-label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255,255,255,0.82);
        }

        .rr-input,
        .rr-select {
          width: 100%;
          height: 54px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: #181818;
          padding: 0 16px;
          color: white;
          font-size: 15px;
          outline: none;
          transition: 0.2s;
        }

        .rr-input:focus,
        .rr-select:focus {
          border-color: rgba(255,255,255,0.32);
        }

        .rr-input::placeholder {
          color: rgba(255,255,255,0.2);
        }

        .rr-select-wrap {
          position: relative;
        }

        .rr-select {
          appearance: none;
          color: rgba(255,255,255,0.7);
        }

        .rr-arrow {
          position: absolute;
          right: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.32);
        }

        .rr-username {
          display: flex;
          align-items: center;
          height: 54px;
          overflow: hidden;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: #181818;
        }

        .rr-prefix {
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 16px;
          border-right: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.38);
          font-size: 15px;
        }

        .rr-username input {
          flex: 1;
          height: 100%;
          border: none;
          background: transparent;
          padding: 0 16px;
          color: white;
          font-size: 15px;
          outline: none;
        }

        .rr-password {
          position: relative;
        }

        .rr-eye {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
        }

        .rr-checks {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rr-check {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .rr-check-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .done {
          color: rgba(255,255,255,0.82);
        }

        .done .rr-check-dot {
          background: white;
        }

        .pending {
          color: rgba(255,255,255,0.3);
        }

        .pending .rr-check-dot {
          background: rgba(255,255,255,0.15);
        }

        .rr-terms {
          margin-top: 22px;
          font-size: 13px;
          line-height: 1.7;
          color: rgba(255,255,255,0.34);
        }

        .rr-terms span {
          color: rgba(255,255,255,0.7);
          font-weight: 600;
          cursor: pointer;
        }

        .rr-submit {
          width: 100%;
          height: 56px;
          margin-top: 24px;
          border: none;
          border-radius: 14px;
          background: white;
          color: black;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }

        .rr-submit:hover {
          opacity: 0.9;
        }

        .rr-signin {
          margin-top: 28px;
          font-size: 14px;
          color: rgba(255,255,255,0.34);
        }

        .rr-signin a {
          color: white;
          font-weight: 600;
          text-decoration: none;
        }

        /* RIGHT */

        .rr-right {
          flex: 1;
          background: linear-gradient(
            180deg,
            #1a1a1a 0%,
            #171717 100%
          );
          border-left: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* TOP BADGES */

        .rr-top {
          height: 170px;
          padding: 34px 42px 26px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 54px;
        }

        .rr-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .rr-badge-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          margin-bottom: 4px;
        }

        .rr-rank {
          font-size: 34px;
          line-height: 1;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
          letter-spacing: -0.05em;
        }

        .rr-stars {
          display: flex;
          gap: 2px;
          color: #f59e0b;
          font-size: 13px;
          margin-bottom: 10px;
        }

        /* BOOKING */

        .rr-booking-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 38px;
        }

        .rr-booking {
          width: 100%;
          max-width: 820px;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          background: #1c1c1c;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.02),
            0 25px 60px rgba(0,0,0,0.45);
        }

        .rr-booking-top {
          display: flex;
          min-height: 520px;
        }

        /* LEFT BOOKING */

        .rr-bl {
          width: 270px;
          border-right: 1px solid rgba(255,255,255,0.06);
          padding: 24px;
          background: rgba(255,255,255,0.015);
        }

        .rr-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            #6366f1,
            #8b5cf6
          );
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: 700;
        }

        .rr-event {
          margin-top: 16px;
        }

        .rr-event h3 {
          margin: 0 0 10px;
          font-size: 28px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.04em;
          color: white;
        }

        .rr-event p {
          margin: 0;
          font-size: 13px;
          line-height: 1.7;
          color: rgba(255,255,255,0.42);
        }

        /* RIGHT BOOKING */

        .rr-br {
          flex: 1;
          padding: 22px 24px;
        }

        .rr-date {
          font-size: 15px;
          font-weight: 700;
          color: white;
          margin-bottom: 18px;
        }

        .rr-slots {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 14px;
        }

        .rr-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rr-day {
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.42);
          margin-bottom: 4px;
        }

        .rr-slot {
          height: 34px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.72);
        }

        .rr-slot:hover {
          border-color: rgba(255,255,255,0.24);
          background: rgba(255,255,255,0.05);
          color: white;
        }

        /* FEATURES */

        .rr-bottom {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.01);
        }

        .rr-feature {
          padding: 26px 22px;
        }

        .rr-feature:not(:last-child) {
          border-right: 1px solid rgba(255,255,255,0.06);
        }

        .rr-feature-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 13px;
          font-weight: 700;
          color: white;
        }

        .rr-feature-title svg {
          color: rgba(255,255,255,0.38);
        }

        .rr-feature-desc {
          font-size: 12px;
          line-height: 1.7;
          color: rgba(255,255,255,0.42);
        }

      `}</style>

      <div className="rr-wrapper">
        <div className="rr">

          {/* LEFT */}
          <div className="rr-left">

            <Link
              href="/login"
              className="rr-back"
            >
              <ArrowLeft size={15} />
              Back
            </Link>

            <h1 className="rr-h1">
              Create your Cal.com account
            </h1>

            <p className="rr-sub">
              Free for individuals. Team plans for collaborative features.
            </p>

            {error && (
              <div style={{ color: "#f87171" }}>
                {error}
              </div>
            )}

            {/* REGION */}
            <div className="rr-field">
              <label className="rr-label">
                Data region
              </label>

              <div className="rr-select-wrap">

                <select className="rr-select">
                  <option>
                    United States
                  </option>
                </select>

                <div className="rr-arrow">
                  ⌄
                </div>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>

              {/* NAME */}
              <div className="rr-field">

                <label className="rr-label">
                  Full Name
                </label>

                <input
                  className="rr-input"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="John Doe"
                  required
                />
              </div>

              {/* USERNAME */}
              <div className="rr-field">

                <label className="rr-label">
                  Username
                </label>

                <div className="rr-username">

                  <div className="rr-prefix">
                    cal.com/
                  </div>

                  <input
                    value={form.username}
                    onChange={set("username")}
                    placeholder="username"
                    required
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="rr-field">

                <label className="rr-label">
                  Email
                </label>

                <input
                  className="rr-input"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="john@example.com"
                  required
                />
              </div>

              {/* PASSWORD */}
              <div className="rr-field">

                <label className="rr-label">
                  Password
                </label>

                <div className="rr-password">

                  <input
                    className="rr-input"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={form.password}
                    onChange={set("password")}
                    placeholder="••••••••"
                    required
                  />

                  <button
                    type="button"
                    className="rr-eye"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                <div className="rr-checks">

                  <div
                    className={`rr-check ${
                      hasUpperLower
                        ? "done"
                        : "pending"
                    }`}
                  >
                    <div className="rr-check-dot" />
                    Mix of uppercase & lowercase letters
                  </div>

                  <div
                    className={`rr-check ${
                      hasMinLength
                        ? "done"
                        : "pending"
                    }`}
                  >
                    <div className="rr-check-dot" />
                    Minimum 8 characters long
                  </div>

                  <div
                    className={`rr-check ${
                      hasNumber
                        ? "done"
                        : "pending"
                    }`}
                  >
                    <div className="rr-check-dot" />
                    Contain at least 1 number
                  </div>
                </div>
              </div>

              <div className="rr-terms">
                By proceeding, you agree to
                Cal.com's <span>Terms</span> and{" "}
                <span>Privacy Policy</span>.
              </div>

              <button
                type="submit"
                className="rr-submit"
                disabled={loading}
              >
                {loading
                  ? "Creating..."
                  : "Get started"}
              </button>
            </form>

            <div className="rr-signin">
              Already have an account?{" "}
              <Link href="/login">
                Sign in
              </Link>
            </div>
          </div>

          {/* RIGHT */}
          <div className="rr-right">

            {/* TOP */}
            <div className="rr-top">

              {[
                {
                  title:
                    "Product of the day",
                  icon: "P",
                },
                {
                  title:
                    "Product of the week",
                  icon: "G",
                },
                {
                  title:
                    "Product of the month",
                  icon: "G",
                },
              ].map((item, i) => (
                <div
                  className="rr-badge"
                  key={i}
                >

                  <div className="rr-badge-title">
                    {item.title}
                  </div>

                  <div className="rr-rank">
                    1st
                  </div>

                  <div className="rr-stars">
                    ★★★★★
                  </div>

                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background:
                        i === 1
                          ? "#4285f4"
                          : "#ef4444",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {item.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* BOOKING */}
            <div className="rr-booking-wrap">

              <div className="rr-booking">

                <div className="rr-booking-top">

                  {/* LEFT */}
                  <div className="rr-bl">

                    <div className="rr-avatar">
                      AF
                    </div>

                    <div className="rr-event">

                      <h3>
                        Design Workshop
                      </h3>

                      <p>
                        A longer chat to run
                        through design.
                      </p>
                    </div>

                    <div
                      style={{
                        marginTop: 24,
                        display: "flex",
                        flexDirection:
                          "column",
                        gap: 10,
                        color:
                          "rgba(255,255,255,0.45)",
                        fontSize: 12,
                      }}
                    >
                      <div>
                        ⏱️ 30 mins
                      </div>

                      <div>
                        📹 Zoom
                      </div>

                      <div>
                        🌍 Europe/Dublin
                      </div>
                    </div>

                    {/* CALENDAR */}
                    <div
                      style={{
                        marginTop: 28,
                        borderTop:
                          "1px solid rgba(255,255,255,0.06)",
                        paddingTop: 18,
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          marginBottom: 16,
                          color: "white",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        <span>
                          June 2023
                        </span>

                        <span
                          style={{
                            color:
                              "rgba(255,255,255,0.3)",
                          }}
                        >
                          ‹ ›
                        </span>
                      </div>

                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "repeat(7,1fr)",
                          gap: 6,
                          textAlign:
                            "center",
                          fontSize: 10,
                          color:
                            "rgba(255,255,255,0.3)",
                        }}
                      >
                        {[
  "S",
  "M",
  "T",
  "W",
  "T",
  "F",
  "S",
].map((d, i) => (
  <div key={i}>
    {d}
  </div>
))}
                      </div>

                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "repeat(7,1fr)",
                          gap: 6,
                          marginTop: 12,
                        }}
                      >
                        {Array.from(
                          { length: 30 },
                          (_, i) => {
                            const active =
                              i + 1 >= 20 &&
                              i + 1 <= 23;

                            return (
                              <div
                                key={i}
                                style={{
                                  height: 28,
                                  borderRadius: 6,
                                  background:
                                    active
                                      ? "rgba(255,255,255,0.15)"
                                      : "transparent",
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  color:
                                    active
                                      ? "white"
                                      : "rgba(255,255,255,0.32)",
                                  fontSize: 11,
                                }}
                              >
                                {i + 1}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="rr-br">

                    <div className="rr-date">
                      Jun 20, 2023
                    </div>

                    <div className="rr-slots">

                      {[
                        {
                          day:
                            "MON 20",
                          slots: [
                            "9:30 am",
                            "10:00 am",
                            "10:30 am",
                            "11:00 am",
                            "11:30 am",
                            "12:00 pm",
                            "12:30 pm",
                            "5:30 pm",
                            "6:30 pm",
                          ],
                        },
                        {
                          day:
                            "TUE 21",
                          slots: [
                            "9:30 am",
                            "10:00 am",
                            "10:30 am",
                            "11:00 am",
                            "11:30 am",
                            "12:00 pm",
                            "12:30 pm",
                          ],
                        },
                        {
                          day:
                            "WED 22",
                          slots: [
                            "9:30 am",
                            "10:00 am",
                            "11:30 am",
                            "6:30 pm",
                          ],
                        },
                      ].map((col, i) => (
                        <div
                          className="rr-col"
                          key={i}
                        >

                          <div className="rr-day">
                            {col.day}
                          </div>

                          {col.slots.map(
                            (
                              slot,
                              j
                            ) => (
                              <div
                                className="rr-slot"
                                key={j}
                              >
                                {slot}
                              </div>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* FEATURES */}
                <div className="rr-bottom">

                  {[
                    {
                      icon:
                        Calendar,
                      title:
                        "Connect all your calendars",
                      desc:
                        "Cal.com reads availability from all your existing calendars.",
                    },
                    {
                      icon:
                        Clock,
                      title:
                        "Set your availability",
                      desc:
                        "Set schedules for the times you want to be booked.",
                    },
                    {
                      icon:
                        Share2,
                      title:
                        "Share a link or embed",
                      desc:
                        "Share your Cal.com link or embed on your site.",
                    },
                  ].map(
                    (
                      item,
                      i
                    ) => (
                      <div
                        className="rr-feature"
                        key={i}
                      >

                        <div className="rr-feature-title">
                          <item.icon size={14} />
                          {item.title}
                        </div>

                        <div className="rr-feature-desc">
                          {item.desc}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}