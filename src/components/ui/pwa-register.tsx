"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";

export function PwaRegister() {
  const [prompt, setPrompt] = useState<Event | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);
  const { lang } = useLanguage();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      const dismissed = localStorage.getItem("pwa_dismissed");
      if (!dismissed) {
        setTimeout(() => setShow(true), 2000);
      }
    };

    const handleInstalled = () => {
      setInstalled(true);
      setShow(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    (prompt as any).prompt();
    const result = await (prompt as any).userChoice;
    if (result.outcome === "accepted") {
      setInstalled(true);
      setShow(false);
    }
    setPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa_dismissed", "true");
  };

  if (installed || !show) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border rounded-xl shadow-dropdown p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-water flex items-center justify-center shrink-0">
          <Download className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{t("Install App", lang)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("Install WaterWatch for quick access", lang)}</p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={handleInstall} className="h-7 text-xs px-3">
              <Download className="h-3 w-3 mr-1" /> {t("Install", lang)}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-7 text-xs px-2">
              Not now
            </Button>
          </div>
        </div>
        <button onClick={handleDismiss} className="shrink-0 p-1 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
