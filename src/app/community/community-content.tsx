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
import { cn } from "@/lib/utils";
import { MessageSquare, Send, Flag, Ban, ChevronDown, Hash, Users } from "lucide-react";
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

const COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
  "bg-teal-500", "bg-orange-500",
];

function hashColor(hash: string): string {
  let idx = 0;
  for (let i = 0; i < hash.length; i++) idx = (idx + hash.charCodeAt(i) * 31) & 0x7fffffff;
  return COLORS[idx % COLORS.length];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDate.getTime() === today.getTime()) return "Today";
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function needsDateSeparator(curr: string, prev?: string): boolean {
  if (!prev) return true;
  const c = new Date(curr).toDateString();
  const p = new Date(prev).toDateString();
  return c !== p;
}

const settings = { nick: "", barangay: "" };

export function CommunityContent({ initialMessages }: { initialMessages: ChatMessage[] }) {
  const { lang } = useLanguage();
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [nickname, setNickname] = useState(settings.nick);
  const [sending, setSending] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState(settings.barangay);
  const [barangayFilter, setBarangayFilter] = useState("all");
  const [blocked, setBlocked] = useState<Set<string>>(getBlocked);
  const [myIds, setMyIds] = useState<Set<string>>(new Set());
  const [blockTarget, setBlockTarget] = useState<string | null>(null);
  const [blockNote, setBlockNote] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(0);

  const room = "sjdm";

  const sorted = useMemo(() => {
    let msgs = messages.slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (barangayFilter !== "all") {
      msgs = msgs.filter((m) => m.barangay === barangayFilter);
    }
    msgs = msgs.filter((m) => !blocked.has(m.author_hash));
    return msgs;
  }, [messages, barangayFilter, blocked]);

  const activeUsers = useMemo(() => {
    const hashes = new Set(sorted.map((m) => m.author_hash));
    return hashes.size;
  }, [sorted]);

  // Auto-scroll
  useEffect(() => {
    if (!autoScroll || !bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: prevCount.current > 0 && sorted.length > prevCount.current ? "smooth" : "instant" });
    prevCount.current = sorted.length;
  }, [sorted.length, autoScroll]);

  // Track scroll position
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      setAutoScroll(atBottom);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("chat-sjdm")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as any;
          if (msg.deleted) return;
          if (msg.room !== room) return;
          setMessages((prev) => (prev.some((p) => p.id === msg.id) ? prev : [...prev, msg as ChatMessage]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    settings.nick = nickname;
    settings.barangay = selectedBarangay;
    setSending(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room,
          message: text,
          barangay: selectedBarangay || null,
          author_label: nickname.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      if (data.message?.id) {
        setMyIds((prev) => new Set(prev).add(data.message.id));
      }
      setDraft("");
      setAutoScroll(true);
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

  const blockUser = (hash: string) => {
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

  const cancelBlock = () => {
    setBlockTarget(null);
    setBlockNote("");
  };

  const scrollToBottom = () => {
    setAutoScroll(true);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const barangaysWithMsgs = useMemo(() => {
    const s = new Set(messages.map((m) => m.barangay).filter(Boolean));
    return BARANGAYS.filter((b) => s.has(b));
  }, [messages]);

  const hasSettings = nickname || selectedBarangay;

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="shrink-0 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-xl bg-water/10 flex items-center justify-center">
            <MessageSquare className="h-4.5 w-4.5 text-water" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold leading-tight">{t("Community Chat", lang)}</h1>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{activeUsers}</span>
              <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{sorted.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={showFilter ? "default" : "ghost"}
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => { setShowFilter(!showFilter); setShowSettings(false); }}
            >
              <Hash className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Filter", lang)}</span>
            </Button>
            <Button
              variant={showSettings ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 text-xs gap-1.5", hasSettings && !showSettings && "text-water")}
              onClick={() => { setShowSettings(!showSettings); setShowFilter(false); }}
            >
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Profile", lang)}</span>
            </Button>
          </div>
        </div>
        {/* Settings panel */}
        {showSettings && (
          <div className="px-4 pb-3 space-y-2 border-t pt-2.5">
            <div className="flex gap-2">
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t("Nickname", lang)}
                className="h-9 text-sm flex-1"
              />
              <Select value={selectedBarangay} onValueChange={setSelectedBarangay}>
                <SelectTrigger className="h-9 text-sm w-[140px]">
                  <SelectValue placeholder={t("Barangay", lang)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {BARANGAYS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("No account required. Be respectful.", lang)}</p>
          </div>
        )}
        {/* Filter panel */}
        {showFilter && (
          <div className="px-4 pb-3 border-t pt-2.5">
            <Select value={barangayFilter} onValueChange={setBarangayFilter}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t("Filter by barangay", lang)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Barangays", lang)}</SelectItem>
                {barangaysWithMsgs.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-1">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{t("No messages yet.", lang)}</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
              {t("Be the first to say something about the water situation in SJDM.", lang)}
            </p>
          </div>
        ) : (
          <>
            {sorted.map((m, i) => {
              const isMine = myIds.has(m.id);
              const prev = i > 0 ? sorted[i - 1] : null;
              const showDateSep = needsDateSeparator(m.created_at, prev?.created_at);
              const showAvatar = !isMine && (i === 0 || sorted[i - 1].author_hash !== m.author_hash || needsDateSeparator(m.created_at, prev?.created_at));
              const isContinuation = !isMine && !showAvatar && prev?.author_hash === m.author_hash;
              return (
                <div key={m.id}>
                  {showDateSep && (
                    <div className="flex items-center justify-center py-2">
                      <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/50 px-3 py-1 rounded-full">
                        {formatDateLabel(m.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={cn("flex items-end gap-2 py-0.5", isMine ? "flex-row-reverse" : "")}>
                    {/* Avatar */}
                    {!isMine && (
                      <div className={cn("shrink-0", showAvatar ? "w-7 h-7" : "w-7 opacity-0 pointer-events-none")}>
                        {showAvatar && (
                          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white", hashColor(m.author_hash))}>
                            {(m.author_label || "A").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Bubble */}
                    <div className={cn("flex flex-col", isMine ? "items-end" : "items-start", "max-w-[85%] sm:max-w-[70%]")}>
                      {/* Author label */}
                      {showAvatar && (
                        <div className="flex items-center gap-1.5 mb-0.5 px-1">
                          <span className="text-[10px] font-medium text-muted-foreground">{m.author_label || t("Anonymous", lang)}</span>
                          {m.barangay && <span className="text-[8px] text-water/70 bg-water/5 px-1.5 py-0.5 rounded-full">{m.barangay}</span>}
                        </div>
                      )}
                      {/* Bubble + actions */}
                      <div className={cn("flex items-end gap-1.5", isMine ? "flex-row-reverse" : "")}>
                        <div className={cn(
                          "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                          isMine
                            ? "bg-water text-white rounded-br-md"
                            : isContinuation
                              ? "bg-muted/60 rounded-bl-sm"
                              : "bg-muted/60 rounded-bl-md",
                        )}>
                          <p className="whitespace-pre-wrap break-words">{m.message}</p>
                          <div className={cn("flex items-center gap-1 mt-0.5", isMine ? "justify-end" : "justify-start")}>
                            <span className={cn("text-[9px] opacity-60", isMine ? "text-white/70" : "text-muted-foreground/60")}>
                              {formatTime(m.created_at)}
                            </span>
                          </div>
                        </div>
                        {/* Actions */}
                        {!isMine && (
                          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pb-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full"
                              onClick={() => blockUser(m.author_hash)}
                              title={t("Block", lang)}
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full"
                              onClick={() => reportMessage(m.id)}
                              title={t("Report", lang)}
                            >
                              <Flag className="h-3 w-3" />
                            </Button>
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

      {/* Jump to bottom button */}
      {!autoScroll && sorted.length > 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 rounded-full shadow-lg text-xs gap-1.5"
            onClick={scrollToBottom}
          >
            <ChevronDown className="h-3.5 w-3.5" />
            {t("New messages", lang)}
          </Button>
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0 border-t bg-background/95 backdrop-blur-sm sticky bottom-0 z-10">
        <form
          onSubmit={(e) => { e.preventDefault(); void send(); }}
          className="flex items-end gap-2 p-3 sm:p-4"
        >
          <div className="flex-1 relative">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={t("Type a message...", lang)}
              className="h-10 text-sm pr-10 rounded-xl bg-muted/50 border-muted-foreground/20 focus-visible:bg-background"
            />
          </div>
          <Button
            type="submit"
            disabled={sending || !draft.trim()}
            className="h-10 w-10 rounded-xl shrink-0"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Block dialog */}
      <Dialog open={blockTarget !== null} onOpenChange={(open) => { if (!open) cancelBlock(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{t("Block this user?", lang)}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("Their messages will be hidden from your view. They won't know you blocked them.", lang)}
          </p>
          <Input
            value={blockNote}
            onChange={(e) => setBlockNote(e.target.value)}
            placeholder={t("Reason (optional, only visible to you)", lang)}
            className="h-9 text-sm"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={cancelBlock}>{t("Cancel", lang)}</Button>
            <Button size="sm" variant="destructive" onClick={confirmBlock} className="gap-1.5">
              <Ban className="h-3.5 w-3.5" /> {t("Block", lang)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
