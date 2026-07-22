"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";

export function NetworkStatus() {
  const [online, setOnline] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => { setOnline(true); setShow(true); setTimeout(() => setShow(false), 3000); };
    const goOffline = () => { setOnline(false); setShow(true); };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!show) return null;

  return (
    <div className={cn(
      "fixed top-16 left-0 right-0 z-50 py-2 px-4 text-center text-xs font-medium transition-all duration-300",
      online
        ? "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300 border-b border-green-200 dark:border-green-800"
        : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-b border-red-200 dark:border-red-800",
    )}>
      <div className="flex items-center justify-center gap-1.5">
        {online ? (
          <><Wifi className="h-3 w-3" /> Back online — connection restored</>
        ) : (
          <><WifiOff className="h-3 w-3" /> You are offline — some features may be unavailable</>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
