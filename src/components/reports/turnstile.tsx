"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
        theme?: "light" | "dark" | "auto";
      }) => string;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
}

export function Turnstile({ siteKey, onVerify, onExpire, onError, theme = "light" }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const renderedRef = useRef(false);

  // Keep stable refs to callbacks so widget isn't re-rendered when they change
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

  useEffect(() => {
    if (renderedRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const pollIntervals: ReturnType<typeof setInterval>[] = [];
    const pollTimeouts: ReturnType<typeof setTimeout>[] = [];

    const scriptExists = document.querySelector<HTMLScriptElement>('script[src*="turnstile/v0/api.js"]');
    if (!scriptExists) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const renderWidget = () => {
      if (!container || renderedRef.current) return;
      renderedRef.current = true;
      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: siteKey,
        callback: (token: string) => onVerifyRef.current(token),
        "expired-callback": () => onExpireRef.current?.(),
        "error-callback": () => onErrorRef.current?.(),
        theme,
      });
    };

    const poll = () => {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 200);
      pollIntervals.push(interval);
      const timeout = setTimeout(() => clearInterval(interval), 15000);
      pollTimeouts.push(timeout);
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      poll();
    }

    return () => {
      renderedRef.current = false;
      pollIntervals.forEach(clearInterval);
      pollTimeouts.forEach(clearTimeout);
      if (widgetIdRef.current) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme]);

  return <div ref={containerRef} />;
}
