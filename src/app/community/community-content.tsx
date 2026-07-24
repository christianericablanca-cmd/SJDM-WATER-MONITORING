"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { Send, Flag } from "lucide-react";

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

export function CommunityContent({ initialMessages }: { initialMessages: ChatMessage[] }) {
  const { lang } = useLanguage();
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [nickname, setNickname] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const room = "sjdm";

  const sorted = useMemo(() => {
    return messages.slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages]);

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
    toast.info(t("Reporting…", lang));
    try {
      const res = await fetch("/api/chat/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: id, reason: "Inappropriate" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to report");
      toast.success(t("Reported", lang), t("Thanks, we’ll review it.", lang));
    } catch (e) {
      toast.error(t("Failed", lang), e instanceof Error ? e.message : t("Something went wrong", lang));
    }
  };

  return (
    <div className="page-container py-4 sm:py-8 space-y-4">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t("Community", lang)}</h1>
        <p className="text-xs sm:text-base text-muted-foreground">
          {t("Anonymous community chat for SJDM water updates.", lang)}
        </p>
      </div>

      <Card className="p-3 sm:p-4 shadow-card">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t("Optional nickname", lang)}
            className="h-9 text-sm sm:max-w-xs"
          />
          <div className="text-[11px] text-muted-foreground">
            {t("No account required. Be respectful.", lang)}
          </div>
        </div>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <div ref={listRef} className="max-h-[55vh] min-h-[300px] overflow-y-auto p-3 sm:p-4 space-y-2 bg-muted/10">
          {sorted.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-12">{t("No messages yet.", lang)}</div>
          ) : (
            sorted.map((m) => (
              <div key={m.id} className="rounded-lg border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] text-muted-foreground">
                      {(m.author_label || t("Anonymous", lang))} · {new Date(m.created_at).toLocaleString()}
                    </div>
                    <div className="text-sm whitespace-pre-wrap break-words">{m.message}</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => reportMessage(m.id)}
                    title={t("Report", lang)}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t p-3 sm:p-4 flex gap-2 items-center">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={t("Type a message…", lang)}
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
