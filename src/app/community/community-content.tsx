"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import { Send, Ban, Flag, Settings, SlidersHorizontal } from "lucide-react";
import { BARANGAYS } from "@/lib/constants";

type ChatMessage = {
  id: string;
  room: string;
  message: string;
  barangay: string | null;
  author_hash: string;
  author_label: string | null;
  deleted: boolean;
  created_at: string;
};

const BLOCKED_KEY = "chat_blocked_hashes";
const BLOCK_NOTES_KEY = "chat_block_notes";

function getBlocked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(BLOCKED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function getBlockNote(hash: string): string {
  try {
    const raw = localStorage.getItem(BLOCK_NOTES_KEY);
    const notes = raw ? JSON.parse(raw) : {};
    return notes[hash] || "";
  } catch {
    return "";
  }
}

function addBlocked(hash: string, note?: string) {
  const blocked = getBlocked();
  blocked.add(hash);
  localStorage.setItem(BLOCKED_KEY, JSON.stringify([...blocked]));
  if (note) {
    try {
      const raw = localStorage.getItem(BLOCK_NOTES_KEY);
      const notes = raw ? JSON.parse(raw) : {};
      notes[hash] = note;
      localStorage.setItem(BLOCK_NOTES_KEY, JSON.stringify(notes));
    } catch { /* ignore */ }
  }
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
  "bg-teal-500", "bg-orange-500",
];

function avatarColor(hash: string): string {
  let idx = 0;
  for (let i = 0; i < hash.length; i++) idx = (idx + hash.charCodeAt(i) * 31) & 0x7fffffff;
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

function msgTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  if (sameYear && d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, {
    month: sameYear ? "short" : "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateChip(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const md = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (md.getTime() === today.getTime()) return "Today";
  if (md.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function showDateSep(curr: string, prev?: string): boolean {
  if (!prev) return true;
  return new Date(curr).toDateString() !== new Date(prev).toDateString();
}

export function CommunityContent({ initialMessages }: { initialMessages: ChatMessage[] }) {
  const { lang } = useLanguage();
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [nickname, setNickname] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("all");
  const [blocked, setBlocked] = useState<Set<string>>(getBlocked);
  const [myIds, setMyIds] = useState<Set<string>>(new Set());
  const [blockTarget, setBlockTarget] = useState<string | null>(null);
  const [blockNote, setBlockNote] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const room = "sjdm";

  const sorted = useMemo(() => {
    let msgs = messages.slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (barangayFilter !== "all") {
      msgs = msgs.filter((m) => m.barangay === barangayFilter);
    }
    msgs = msgs.filter((m) => !blocked.has(m.author_hash));
    return msgs;
  }, [messages, barangayFilter, blocked]);

  // Auto-scroll to newest messages (container only, never the page)
  useEffect(() => {
    if (sorted.length === 0) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [sorted.length]);

  // Realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("chat-sjdm")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.deleted || msg.room !== room) return;
        setMessages((prev) => (prev.some((p) => p.id === msg.id) ? prev : [...prev, msg as ChatMessage]));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, message: text, barangay: selectedBarangay || null, author_label: nickname.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      if (data.message) {
        setMessages((prev) => (prev.some((p) => p.id === data.message.id) ? prev : [...prev, data.message]));
        setMyIds((prev) => new Set(prev).add(data.message.id));
      }
      setDraft("");
    } catch (e) {
      toast.error(t("Failed", lang), e instanceof Error ? e.message : t("Something went wrong", lang));
    } finally {
      setSending(false);
    }
  };

  const reportMessage = async (id: string) => {
    toast.info(t("Reporting...", lang));
    try {
      const res = await fetch("/api/chat/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: id, reason: "Inappropriate" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to report");
      toast.success(t("Reported", lang), t("Thanks, we'll review it.", lang));
    } catch (e) {
      toast.error(t("Failed", lang), e instanceof Error ? e.message : t("Something went wrong", lang));
    }
  };

  const openBlock = (hash: string) => {
    setBlockTarget(hash);
    setBlockNote(getBlockNote(hash));
  };

  const confirmBlock = () => {
    if (!blockTarget) return;
    addBlocked(blockTarget, blockNote || undefined);
    setBlocked(getBlocked());
    setBlockTarget(null);
    setBlockNote("");
    toast.info(t("Blocked", lang), t("Messages from this user are now hidden.", lang));
  };

  const barangaysWithMsgs = useMemo(() => {
    const s = new Set(messages.map((m) => m.barangay).filter(Boolean));
    return BARANGAYS.filter((b) => s.has(b));
  }, [messages]);

  return (
    <div className="page-container py-4 sm:py-8 space-y-4">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t("Community Chat", lang)}</h1>
        <p className="text-xs sm:text-base text-muted-foreground">
          {t("Anonymous community chat for SJDM water updates.", lang)}
        </p>
      </div>

      <Card className="shadow-card overflow-hidden">
        {/* Chat header with settings/filter */}
        <div className="border-b">
          <div className="flex items-center h-11 px-3 gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground/60">{sorted.length} messages</div>
            </div>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => { setShowSettings(!showSettings); setShowFilter(false); }}>
                <Settings className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => { setShowFilter(!showFilter); setShowSettings(false); }}>
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {showSettings && (
            <div className="flex items-center gap-2 px-3 pb-2.5">
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={t("Nickname", lang)} className="h-8 text-xs flex-1" />
              <Select value={selectedBarangay} onValueChange={setSelectedBarangay}>
                <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue placeholder={t("Barangay", lang)} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {BARANGAYS.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
          {showFilter && (
            <div className="px-3 pb-2.5">
              <Select value={barangayFilter} onValueChange={setBarangayFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t("Filter by barangay", lang)} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All", lang)}</SelectItem>
                  {barangaysWithMsgs.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Messages */}
        <div ref={listRef} className="max-h-[55dvh] min-h-[300px] overflow-y-auto p-3 space-y-0.5 bg-muted/10" style={{ overflowAnchor: "none" }}>
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Send className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">{t("No messages yet.", lang)}</p>
              <p className="text-xs text-muted-foreground/50 mt-1">{t("Be the first to say something.", lang)}</p>
            </div>
          ) : (
            <>
              {sorted.map((m, i) => {
                const isMine = myIds.has(m.id);
                const prev = i > 0 ? sorted[i - 1] : null;
                const sep = showDateSep(m.created_at, prev?.created_at);
                const firstOfUser = sep || !prev || prev.author_hash !== m.author_hash;
                return (
                  <div key={m.id}>
                    {sep && (
                      <div className="flex justify-center py-2">
                        <span className="text-[10px] font-medium text-muted-foreground/50 bg-background/80 px-3 py-1 rounded-full border">
                          {dateChip(m.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={cn("flex items-end gap-2 py-0.5", isMine ? "flex-row-reverse" : "")}>
                      {!isMine && (
                        <div className="w-8 shrink-0 self-end pb-1">
                          {firstOfUser && (
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white", avatarColor(m.author_hash))}>
                              {(m.author_label || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}
                      <div className={cn("flex flex-col", isMine ? "items-end" : "items-start", "max-w-[80%] sm:max-w-[70%]")}>
                        {firstOfUser && !isMine && (
                          <div className="flex items-center gap-1.5 mb-0.5 ml-1">
                            <span className="text-[11px] font-medium text-muted-foreground/70">{m.author_label || t("Anonymous", lang)}</span>
                            {m.barangay && <span className="text-[8px] text-water/60 bg-water/5 px-1.5 py-0.5 rounded">{m.barangay}</span>}
                          </div>
                        )}
                        <div className="flex items-end gap-1">
                          <div className={cn("px-3 py-1.5 text-sm leading-relaxed", isMine ? "bg-water text-white rounded-[18px] rounded-br-[6px]" : "bg-background border rounded-[18px] rounded-bl-[6px]")}>
                            <p className="whitespace-pre-wrap break-words">{m.message}</p>
                            <div className={cn("flex items-center gap-1 mt-0.5", isMine ? "justify-end" : "justify-start")}>
                              <span className={cn("text-[9px]", isMine ? "text-white/60" : "text-muted-foreground/50")}>{msgTime(m.created_at)}</span>
                            </div>
                          </div>
                          {!isMine && (
                            <div className="flex pb-1 gap-0.5">
                              <button type="button" className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground/40 hover:text-muted-foreground transition-colors" onClick={() => openBlock(m.author_hash)} title={t("Block", lang)}>
                                <Ban className="h-3 w-3" />
                              </button>
                              <button type="button" className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground/40 hover:text-muted-foreground transition-colors" onClick={() => reportMessage(m.id)} title={t("Report", lang)}>
                                <Flag className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t px-3 py-2.5">
          <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="flex items-end gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("Message", lang)} className="h-10 text-sm rounded-xl bg-muted/30 border-muted-foreground/20 focus-visible:bg-background flex-1" />
            <Button type="submit" disabled={sending || !draft.trim()} className="h-10 w-10 rounded-xl shrink-0" size="icon"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </Card>

      {/* Block dialog */}
      <Dialog open={blockTarget !== null} onOpenChange={(open) => { if (!open) { setBlockTarget(null); setBlockNote(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">{t("Block this user?", lang)}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t("Their messages will be hidden from your view.", lang)}</p>
          <Input value={blockNote} onChange={(e) => setBlockNote(e.target.value)} placeholder={t("Reason (optional)", lang)} className="h-9 text-sm" />
          <div className="flex justify-end gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => { setBlockTarget(null); setBlockNote(""); }}>{t("Cancel", lang)}</Button>
            <Button size="sm" variant="destructive" onClick={confirmBlock} className="gap-1.5"><Ban className="h-3.5 w-3.5" /> {t("Block", lang)}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
