"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { usersAPI, eventTypesAPI, availabilityAPI, bookingsAPI } from "@/lib/api";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isPast, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Globe, MapPin, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";

type Step = "calendar" | "time" | "form" | "confirmed";

interface Slot { start: string; end: string; start_local: string; end_local: string; }

const LOCATION_LABELS: Record<string, string> = {
  google_meet: "Google Meet", zoom: "Zoom", teams: "Microsoft Teams",
  phone: "Phone call", in_person: "In person", custom: "Custom",
};

export default function BookingPage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [eventType, setEventType] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [busyDates, setBusyDates] = useState<string[]>([]);
  const [busyLoading, setBusyLoading] = useState(false);

  // Slots state
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Form state
  const [step, setStep] = useState<Step>("calendar");
  const [form, setForm] = useState({ name: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Guest timezone
  const guestTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    Promise.all([
      usersAPI.getPublic(username),
      eventTypesAPI.getPublic(username, slug),
    ])
      .then(([u, et]) => { setUser(u.data); setEventType(et.data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username, slug]);

  // Fetch busy dates for current month
  const fetchBusyDates = useCallback(async (month: Date) => {
    if (!eventType) return;
    setBusyLoading(true);
    try {
      const res = await availabilityAPI.getBusyDates(username, slug, month.getFullYear(), month.getMonth() + 1);
      setBusyDates(res.data.busy_dates || []);
    } catch { setBusyDates([]); }
    finally { setBusyLoading(false); }
  }, [eventType, username, slug]);

  useEffect(() => { if (eventType) fetchBusyDates(currentMonth); }, [eventType, currentMonth, fetchBusyDates]);

  // Fetch slots when date selected
  const fetchSlots = async (date: Date) => {
    setSlotsLoading(true);
    setSlots([]);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await availabilityAPI.getSlots(username, slug, dateStr);
      setSlots(res.data);
    } catch { setSlots([]); }
    finally { setSlotsLoading(false); }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    fetchSlots(date);
    setStep("time");
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !eventType) return;
    setSubmitting(true);
    try {
      const res = await bookingsAPI.create({
        event_type_id: eventType.id,
        guest_name: form.name,
        guest_email: form.email,
        guest_notes: form.notes,
        guest_timezone: guestTz,
        start_time: selectedSlot.start,
      });
      setConfirmedBooking(res.data);
      setStep("confirmed");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Booking failed. The slot may no longer be available.");
    } finally { setSubmitting(false); }
  };

  // Calendar grid
  const calDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    // Pad start
    const startDow = start.getDay();
    const padded: (Date | null)[] = Array(startDow).fill(null);
    return [...padded, ...days];
  };

  const isDateBusy = (date: Date) => busyDates.includes(format(date, "yyyy-MM-dd"));
  const isDatePast = (date: Date) => isPast(startOfDay(date)) && !isToday(date);

  if (loading) return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center"><div className="w-6 h-6 border-2 border-[var(--text)] border-t-transparent rounded-full animate-spin" /></div>;
  if (notFound || !eventType || !user) return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center"><p className="text-[var(--text-secondary)]">Event type not found.</p></div>;

  // ── Confirmed ─────────────────────────────────────────────────────────
  if (step === "confirmed" && confirmedBooking) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text)] mb-1">You're scheduled!</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">A calendar invitation has been sent to your email.</p>

          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 text-left space-y-3 mb-6">
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: eventType.color }} />
              <div>
                <p className="font-semibold text-[var(--text)] text-sm">{eventType.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">with {user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Clock size={14} className="shrink-0" />
              <span>
                {format(new Date(confirmedBooking.start_time), "EEEE, MMMM d, yyyy")} at{" "}
                {format(new Date(confirmedBooking.start_time), "h:mm a")} –{" "}
                {format(new Date(confirmedBooking.end_time), "h:mm a")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Globe size={14} className="shrink-0" />
              <span>{guestTz}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <MapPin size={14} className="shrink-0" />
              <span>{LOCATION_LABELS[eventType.location_type] || eventType.location_type}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => router.push(`/cancel/${confirmedBooking.cancel_token}`)}
              className="w-full"
            >
              Cancel booking
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/${username}`)}
              className="w-full"
            >
              Book another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-4xl bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left panel — event info */}
          <div className="w-full md:w-72 p-6 border-b md:border-b-0 md:border-r border-[var(--border)] shrink-0">
            {/* Back button */}
            <button
              onClick={() => { if (step === "form") setStep("time"); else if (step === "time") { setStep("calendar"); setSelectedDate(null); } else router.push(`/${username}`); }}
              className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text)] mb-5 transition-colors"
            >
              <ArrowLeft size={13} /> Back
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user.name?.charAt(0)}
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{user.name}</p>
            </div>

            <h2 className="text-lg font-bold text-[var(--text)] mb-4">{eventType.title}</h2>

            {eventType.description && (
              <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">{eventType.description}</p>
            )}

            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                <Clock size={14} className="shrink-0 text-[var(--text-muted)]" />
                {eventType.duration} minutes
              </div>
              <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                <MapPin size={14} className="shrink-0 text-[var(--text-muted)]" />
                {LOCATION_LABELS[eventType.location_type] || eventType.location_type}
              </div>
              <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                <Globe size={14} className="shrink-0 text-[var(--text-muted)]" />
                {guestTz}
              </div>
              {selectedSlot && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Selected time</p>
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {format(new Date(selectedSlot.start), "EEE, MMM d")}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {format(new Date(selectedSlot.start), "h:mm a")} – {format(new Date(selectedSlot.end), "h:mm a")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 p-6">
            {/* STEP: calendar */}
            {step === "calendar" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-[var(--text)]">
                    {format(currentMonth, "MMMM yyyy")}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                    <div key={d} className="text-center text-xs text-[var(--text-muted)] py-1 font-medium">{d}</div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calDays().map((date, i) => {
                    if (!date) return <div key={`pad-${i}`} />;
                    const busy = isDateBusy(date);
                    const past = isDatePast(date);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const today = isToday(date);
                    const disabled = busy || past || !isSameMonth(date, currentMonth);

                    return (
                      <button
                        key={date.toISOString()}
                        disabled={disabled}
                        onClick={() => handleDateSelect(date)}
                        className={clsx(
                          "aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all relative",
                          isSelected && "bg-[var(--text)] text-[var(--bg)]",
                          !isSelected && today && !disabled && "border border-[var(--text)] text-[var(--text)]",
                          !isSelected && !disabled && "text-[var(--text)] hover:bg-[var(--surface)]",
                          disabled && "text-[var(--text-muted)] cursor-not-allowed opacity-40",
                          busyLoading && "opacity-60"
                        )}
                      >
                        {format(date, "d")}
                        {/* Available dot */}
                        {!disabled && !isSelected && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--text)] opacity-30" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP: time slots */}
            {step === "time" && selectedDate && (
              <div>
                <h3 className="font-semibold text-[var(--text)] mb-1">
                  {format(selectedDate, "EEEE, MMMM d")}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-5">{guestTz}</p>

                {slotsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="w-5 h-5 border-2 border-[var(--text)] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <p className="text-[var(--text-secondary)] text-sm">No available slots on this day</p>
                    <button onClick={() => { setStep("calendar"); setSelectedDate(null); }} className="text-xs text-[var(--text-muted)] underline mt-2">
                      Choose another date
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
                    {slots.map(slot => (
                      <button
                        key={slot.start}
                        onClick={() => handleSlotSelect(slot)}
                        className="px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] hover:border-[var(--text)] transition-all font-medium"
                      >
                        {format(new Date(slot.start), "h:mm a")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP: booking form */}
            {step === "form" && selectedSlot && (
              <div>
                <h3 className="font-semibold text-[var(--text)] mb-1">Enter details</h3>
                <p className="text-xs text-[var(--text-muted)] mb-5">
                  {format(new Date(selectedSlot.start), "EEEE, MMMM d · h:mm a")} – {format(new Date(selectedSlot.end), "h:mm a")}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Your name <span className="text-red-500">*</span></label>
                    <input
                      value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                      placeholder="John Doe"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Email address <span className="text-red-500">*</span></label>
                    <input
                      type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
                      placeholder="john@example.com"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
                      Additional notes <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Please share anything that will help prepare for our meeting."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)] transition-colors resize-none"
                    />
                  </div>
                  <Button type="submit" loading={submitting} className="w-full" size="lg">
                    Confirm booking
                  </Button>
                  <p className="text-xs text-center text-[var(--text-muted)]">
                    By proceeding, you agree that your information will be shared with the host.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
