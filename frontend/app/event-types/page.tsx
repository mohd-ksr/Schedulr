"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { eventTypesAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { 
  Plus, Clock, ExternalLink, Link2, MoreHorizontal, 
  Search, Pencil, Trash2, GripVertical, EyeOff 
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

interface EventType {
  id: number;
  title: string;
  slug: string;
  description?: string;
  duration: number;
  color: string;
  is_active: boolean;
  is_hidden: boolean;
  location_type: string;
}

const COLORS = ["#0ea5e9","#10b981","#8b5cf6","#f59e0b","#ef4444","#ec4899","#06b6d4","#84cc16"];
const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function EventTypesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [newForm, setNewForm] = useState({ title: "", slug: "", description: "", duration: 30, color: "#0ea5e9" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      const res = await eventTypesAPI.list();
      setEventTypes(res.data);
    } catch { 
      toast("Failed to load event types", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleToggle = async (et: EventType) => {
    try {
      await eventTypesAPI.update(et.id, { is_active: !et.is_active });
      setEventTypes(prev => prev.map(e => e.id === et.id ? { ...e, is_active: !e.is_active } : e));
    } catch { 
      toast("Failed to update", "error"); 
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this event type? All bookings will be deleted too.")) return;
    try {
      await eventTypesAPI.delete(id);
      setEventTypes(prev => prev.filter(e => e.id !== id));
      toast("Event type deleted");
    } catch { 
      toast("Failed to delete", "error"); 
    }
    setOpenMenu(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await eventTypesAPI.create(newForm);
      setEventTypes(prev => [...prev, res.data]);
      setShowNewModal(false);
      setNewForm({ title: "", slug: "", description: "", duration: 30, color: "#0ea5e9" });
      toast("Event type created!");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to create", "error");
    } finally { 
      setCreating(false); 
    }
  };

  const autoSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const filtered = eventTypes.filter(et =>
    et.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="py-10 px-8 md:px-12 max-w-6xl mx-auto w-full transition-all">
        
        {/* Custom Premium Cal.com Dashboard Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
          <div>
            <h1 className="text-[23px] font-semibold tracking-[-0.03em] text-zinc-900 dark:text-white">
              Event types
            </h1>
            <p className="mt-1 text-[13.5px] font-normal text-zinc-400 dark:text-zinc-500">
              Configure different events for people to book on your calendar.
            </p>
          </div>
          
          {/* Header Controls (Search & New button) */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search"
                className="h-[36px] w-[220px] rounded-[8px] border border-zinc-200 bg-white pl-9 pr-4 text-[13.5px] text-zinc-900 outline-none transition-all placeholder:text-zinc-300 hover:border-zinc-300 focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:placeholder:text-zinc-700 dark:hover:border-zinc-700 dark:focus:border-zinc-500"
              />
            </div>
            
            <Button 
              onClick={() => setShowNewModal(true)} 
              className="h-[36px] rounded-[8px] bg-zinc-900 text-[13.5px] font-medium text-white hover:bg-black transition-all dark:bg-white dark:text-zinc-950 dark:hover:opacity-90 cursor-pointer"
              size="md"
            >
              <Plus size={15} className="mr-1 inline-block -mt-0.5" /> New
            </Button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex items-center justify-center h-52">
            <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin dark:border-white" />
          </div>
        ) : filtered.length === 0 ? (
          
          /* Empty State Dashboard Card */
          <div className="rounded-[16px] border border-zinc-200 bg-white flex flex-col items-center justify-center py-20 px-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.01)] dark:border-zinc-800/80 dark:bg-zinc-900/20">
            <div className="w-11 h-11 rounded-full bg-zinc-50 border border-zinc-150 flex items-center justify-center mb-4 dark:bg-zinc-900 dark:border-zinc-800">
              <Link2 size={18} className="text-zinc-400 dark:text-zinc-500" />
            </div>
            <p className="font-semibold text-[14.5px] text-zinc-800 dark:text-zinc-200">No event types yet</p>
            <p className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-1 mb-5 max-w-sm leading-relaxed">
              Create your first event type to start accepting bookings from clients.
            </p>
            <Button 
              onClick={() => setShowNewModal(true)} 
              className="h-[34px] rounded-[8px] bg-zinc-900 text-[13px] font-medium text-white hover:bg-black transition-all dark:bg-white dark:text-zinc-950 cursor-pointer"
              size="sm"
            >
              <Plus size={14} className="mr-1 inline" /> New event type
            </Button>
          </div>
        ) : (
          
          /* Event Types Collection Container */
          <div className="rounded-[16px] border border-zinc-200 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.015)] dark:border-zinc-800/80 dark:bg-zinc-900/10">
            {filtered.map((et, idx) => (
              <div
                key={et.id}
                className={clsx(
                  "flex items-center gap-4 px-6 py-5 hover:bg-zinc-50/50 transition-colors group relative",
                  idx !== 0 && "border-t border-zinc-100 dark:border-zinc-850"
                )}
              >
                
                {/* Subtle Hover Drag Handle (Lucide GripVertical) */}
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-zinc-200 dark:text-zinc-800 select-none pointer-events-none">
                  <GripVertical size={15} />
                </div>

                {/* Vertical Color Accent Strip */}
                <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: et.color }} />

                {/* Primary Card Information */}
                <div className="flex-1 min-w-0 pl-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    
                    {/* Event Title Link */}
                    <Link 
                      href={`/event-types/${et.id}/edit`} 
                      className="font-semibold text-[14.5px] text-zinc-900 hover:underline dark:text-white tracking-tight"
                    >
                      {et.title}
                    </Link>
                    
                    {/* Public URL Slug Path */}
                    <span className="text-[12.5px] font-normal text-zinc-400 dark:text-zinc-500">
                      /{user?.username}/{et.slug}
                    </span>
                  </div>

                  {/* Badges Row (Duration & Hidden Status) */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    
                    {/* Duration Badge */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-zinc-150 bg-zinc-50/40 text-[11px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
                      <Clock size={11} className="text-zinc-400" />
                      {et.duration}m
                    </span>

                    {/* Hidden Badge */}
                    {et.is_hidden && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-amber-200/50 bg-amber-50/40 text-[11px] font-bold text-amber-600 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400">
                        <EyeOff size={11} className="text-amber-500/80" />
                        Hidden
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Panel (Always visible, highly accessible!) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  
                  {/* Status Toggle Switch */}
                  <div className="mr-2">
                    <Toggle checked={et.is_active} onChange={() => handleToggle(et)} />
                  </div>

                  {/* Action 1: Preview Page */}
                  <a
                    href={`/${user?.username}/${et.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-[30px] h-[30px] rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-400 hover:text-zinc-900 transition-all dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 dark:text-zinc-500 dark:hover:text-white cursor-pointer"
                    title="Preview public page"
                  >
                    <ExternalLink size={14} />
                  </a>

                  {/* Action 2: Copy Public link */}
                  <button
                    onClick={() => { 
                      navigator.clipboard.writeText(`${window.location.origin}/${user?.username}/${et.slug}`); 
                      toast("Link copied to clipboard!"); 
                    }}
                    className="flex items-center justify-center w-[30px] h-[30px] rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-400 hover:text-zinc-900 transition-all dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 dark:text-zinc-500 dark:hover:text-white cursor-pointer"
                    title="Copy booking link"
                  >
                    <Link2 size={14} />
                  </button>

                  {/* Action 3: Option Dropdown Toggle */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === et.id ? null : et.id)}
                      className="flex items-center justify-center w-[30px] h-[30px] rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-400 hover:text-zinc-900 transition-all dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 dark:text-zinc-500 dark:hover:text-white cursor-pointer"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    
                    {/* Action Dropdown Menu */}
                    {openMenu === et.id && (
                      <div className="absolute right-0 top-full mt-1.5 w-40 bg-white border border-zinc-150 rounded-lg shadow-lg z-20 py-1 dark:bg-zinc-900 dark:border-zinc-800 animate-fade-in">
                        <Link
                          href={`/event-types/${et.id}/edit`}
                          className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/80 transition-colors"
                          onClick={() => setOpenMenu(null)}
                        >
                          <Pencil size={13} className="text-zinc-400" /> Edit event type
                        </Link>
                        <button
                          onClick={() => handleDelete(et.id)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-red-500 hover:bg-zinc-50 dark:text-red-400 dark:hover:bg-zinc-800/85 transition-colors"
                        >
                          <Trash2 size={13} className="text-red-400" /> Delete event
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* New Event Type Modal */}
        <Modal open={showNewModal} onClose={() => setShowNewModal(false)}>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Add a new event type</h2>
            <p className="text-sm text-zinc-550 dark:text-zinc-500 mt-1 leading-relaxed">
              Set up a new event type to offer customizable meeting formats to your bookers.
            </p>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-4">
            
            {/* Title field */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Title</label>
              <input
                value={newForm.title} required
                onChange={e => setNewForm(p => ({ ...p, title: e.target.value, slug: autoSlug(e.target.value) }))}
                placeholder="Quick chat"
                className="h-[38px] w-full rounded-[8px] border border-zinc-200 bg-white px-3.5 text-[13.5px] text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
              />
            </div>
            
            {/* Slug URL field */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">URL Slug</label>
              <div className="flex h-[38px] items-center rounded-[8px] border border-zinc-200 bg-white overflow-hidden focus-within:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus-within:border-zinc-500">
                <span className="h-full flex items-center px-3 bg-zinc-50 border-r border-zinc-150 text-[13.5px] text-zinc-400 font-medium select-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500">
                  /{user?.username}/
                </span>
                <input
                  value={newForm.slug} required
                  onChange={e => setNewForm(p => ({ ...p, slug: e.target.value }))}
                  className="flex-1 h-full px-3.5 bg-transparent text-[13.5px] text-zinc-900 outline-none dark:text-white"
                />
              </div>
            </div>
            
            {/* Description field */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Description</label>
              <textarea
                value={newForm.description}
                onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))}
                placeholder="A quick 1-on-1 video call."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-zinc-200 bg-white text-[13.5px] text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white resize-none"
              />
            </div>
            
            {/* Duration Selector list */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Duration</label>
              <div className="flex gap-2 flex-wrap items-center">
                {DURATIONS.map(d => (
                  <button
                    key={d} type="button"
                    onClick={() => setNewForm(p => ({ ...p, duration: d }))}
                    className={clsx(
                      "h-[32px] px-3 rounded-[6px] text-xs font-semibold border transition-all cursor-pointer",
                      newForm.duration === d
                        ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950 dark:border-white"
                        : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                    )}
                  >
                    {d}m
                  </button>
                ))}
                
                <div className="flex items-center gap-1.5 ml-2">
                  <input
                    type="number" min={1} max={480}
                    value={newForm.duration}
                    onChange={e => setNewForm(p => ({ ...p, duration: parseInt(e.target.value) || 30 }))}
                    className="h-[32px] w-16 px-2 rounded-[6px] border border-zinc-200 bg-white text-center text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
                  />
                  <span className="text-[12.5px] font-semibold text-zinc-400 dark:text-zinc-500">minutes</span>
                </div>
              </div>
            </div>
            
            {/* Color Accent Picker */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Color Accent</label>
              <div className="flex gap-2.5">
                {COLORS.map(c => (
                  <button
                    key={c} type="button"
                    onClick={() => setNewForm(p => ({ ...p, color: c }))}
                    className={clsx(
                      "w-6 h-6 rounded-full transition-all hover:scale-105 cursor-pointer relative",
                      newForm.color === c && "ring-2 ring-offset-2 ring-zinc-900 dark:ring-white dark:ring-offset-zinc-950 scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            
            {/* Modal Bottom Actions bar */}
            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-850 mt-6">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setShowNewModal(false)}
                className="h-[36px] rounded-[8px] border border-zinc-200 bg-white text-[13px] font-semibold text-zinc-650 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
              >
                Close
              </Button>
              <Button 
                type="submit" 
                loading={creating}
                className="h-[36px] rounded-[8px] bg-zinc-900 text-[13px] font-semibold text-white hover:bg-black transition-all dark:bg-white dark:text-zinc-950 cursor-pointer"
              >
                Create
              </Button>
            </div>
          </form>
        </Modal>

        {/* Dropdown closing backdrop */}
        {openMenu !== null && (
          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
        )}
      </div>
    </DashboardLayout>
  );
}
