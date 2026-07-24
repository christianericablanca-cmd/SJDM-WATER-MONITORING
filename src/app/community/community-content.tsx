"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Flag, Ban } from "lucide-react";
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

function getBlocked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(BLOCKED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function addBlocked(hash: string) {
  const blocked = getBlocked();
  blocked.add(hash);
  localStorage.setItem(BLOCKED_KEY, JSON.stringify([...blocked]));
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
  const listRef = useRef<HTMLDivElement>(null);

  const room = "sjdm";

  const sorted = useMemo(() => {
    let msgs = messages.slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (barangayFilter !== "all") {
      msgs = msgs.filter((m) => m.barangay === barangayFilter);
    }
    msgs = msgs.filter((m) => !blocked.has(m.author_hash));
    return msgs;
  }, [messages, barangayFilter, blocked]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [sorted.length]);

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
      setDraft("");
      toast.success(t("Sent", lang), t("Message posted.", lang));
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
    addBlocked(hash);
    setBlocked(getBlocked());
    toast.info(t("Blocked", lang), t("Messages from this user are now hidden.", lang));
  };

  const barangaysWithMsgs = useMemo(() => {
    const s = new Set(messages.map((m) => m.barangay).filter(Boolean));
    return BARANGAYS.filter((b) => s.has(b));
  }, [messages]);

  return (
    <div className="page-container py-4 sm:py-8 pb-20 md:pb-8 space-y-4 flex flex-col min-h-[calc(100dvh-4rem)] md:min-h-0">
      <div className="shrink-0">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t("Community", lang)}</h1>
        <p className="text-xs sm:text-base text-muted-foreground">
          {t("Anonymous community chat for SJDM water updates.", lang)}
        </p>
      </div>

      <Card className="p-3 sm:p-4 shadow-card shrink-0">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t("Optional nickname", lang)}
            className="h-9 text-sm sm:max-w-xs"
          />
          <Select value={selectedBarangay} onValueChange={setSelectedBarangay}>
            <SelectTrigger className="h-9 text-sm sm:max-w-[180px]">
              <SelectValue placeholder={t("Barangay (optional)", lang)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("None", lang)}</SelectItem>
              {BARANGAYS.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-[11px] text-muted-foreground">
            {t("No account required. Be respectful.", lang)}
          </div>
        </div>
      </Card>

      <Card className="shadow-card overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-2 px-3 pt-2 pb-0 shrink-0">
          <Select value={barangayFilter} onValueChange={setBarangayFilter}>
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <SelectValue placeholder={t("Filter by barangay", lang)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Barangays", lang)}</SelectItem>
              {barangaysWithMsgs.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[10px] text-muted-foreground ml-auto">{sorted.length} messages</span>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 bg-muted/10 min-h-[200px]">
          {sorted.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-12">{t("No messages yet.", lang)}</div>
          ) : (
            sorted.map((m) => (
              <div key={m.id} className="rounded-lg border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-muted-foreground">
                        {(m.author_label || t("Anonymous", lang))} · {new Date(m.created_at).toLocaleString()}
                      </span>
                      {m.barangay && (
                        <span className="text-[9px] bg-water/10 text-water px-1.5 py-0.5 rounded-full font-medium">{m.barangay}</span>
                      )}
                    </div>
                    <div className="text-sm whitespace-pre-wrap break-words">{m.message}</div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => blockUser(m.author_hash)}
                      title={t("Block", lang)}
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => reportMessage(m.id)}
                      title={t("Report", lang)}
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t p-3 sm:p-4 flex gap-2 items-center shrink-0">
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
            className="h-10 text-sm"
          />
          <Button onClick={send} disabled={sending || !draft.trim()} className="gap-2 h-10">
            <Send className="h-4 w-4" />
            {t("Send", lang)}
          </Button>
        </div>
      </Card>
    </div>
  );
}
