"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { usersAPI, eventTypesAPI } from "@/lib/api";
import { Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

interface User {
  name: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  timezone: string;
}

interface EventType {
  id: number;
  title: string;
  slug: string;
  description?: string;
  duration: number;
  color: string;
}

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username || username.startsWith("_")) return;
    Promise.all([
      usersAPI.getPublic(username),
      eventTypesAPI.listPublic(username),
    ])
      .then(([userRes, etRes]) => {
        setUser(userRes.data);
        setEventTypes(etRes.data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--text)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">404</p>
          <p className="text-[var(--text-secondary)]">This page could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex justify-center py-12 px-4">
      <div className="w-full max-w-[680px]">
        {/* Profile card */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 mb-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {user.name?.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text)]">{user.name}</h1>
              {user.bio && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{user.bio}</p>}
            </div>
          </div>
        </div>

        {/* Event types */}
        {eventTypes.length === 0 ? (
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8 text-center">
            <p className="text-[var(--text-secondary)] text-sm">No event types available</p>
          </div>
        ) : (
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
            {eventTypes.map((et, idx) => (
              <Link
                key={et.id}
                href={`/${username}/${et.slug}`}
                className={`flex items-center justify-between px-6 py-5 hover:bg-[var(--surface)] transition-colors group ${idx !== 0 ? "border-t border-[var(--border)]" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-1 h-10 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: et.color }} />
                  <div>
                    <p className="font-semibold text-[var(--text)] text-sm group-hover:text-[var(--text)]">{et.title}</p>
                    {et.description && (
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">{et.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1.5">
                      <Clock size={11} className="text-[var(--text-muted)]" />
                      <span className="text-xs text-[var(--text-secondary)]">{et.duration}m</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
