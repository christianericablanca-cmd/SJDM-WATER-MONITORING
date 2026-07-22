"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function ImagePreview({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
        <button type="button" onClick={() => setOpen(true)}
          className="w-full aspect-[4/3] overflow-hidden bg-muted hover:opacity-90 transition-all cursor-pointer">
        <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}>
          <div className="relative max-w-2xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-background border shadow-md flex items-center justify-center hover:bg-muted transition-colors z-10">
              <X className="h-4 w-4" />
            </button>
            <img src={src} alt={alt} className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </>
  );
}
