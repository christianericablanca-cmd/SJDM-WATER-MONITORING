"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export function ImagePreview({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full aspect-[4/3] overflow-hidden bg-muted hover:opacity-90 transition-all cursor-pointer relative">
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}>
          <div className="relative w-full max-w-3xl h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-background border shadow-md flex items-center justify-center hover:bg-muted transition-colors z-10">
              <X className="h-4 w-4" />
            </button>
            <Image src={src} alt={alt} fill className="object-contain rounded-xl shadow-2xl" sizes="90vw" />
          </div>
        </div>
      )}
    </>
  );
}
