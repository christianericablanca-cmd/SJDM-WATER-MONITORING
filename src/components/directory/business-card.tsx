"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ImagePreview } from "@/components/directory/image-preview";
import { ImageIcon, MapIcon, ArrowLeft } from "lucide-react";
import type { Business } from "@/lib/types";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";

const MiniMap = dynamic(() => import("./mini-map"), { ssr: false });

export function BusinessCard({ biz }: { biz: Business }) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  return (
    <>
      <div className="border rounded-md overflow-hidden hover:border-water/30 transition-all">
        {biz.photo_url ? (
          <ImagePreview src={biz.photo_url} alt={biz.name} />
        ) : (
          <div className="aspect-[4/3] bg-muted flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
          </div>
        )}
        <div className="p-1 space-y-0">
          <p className="text-[9px] font-semibold truncate leading-tight">{biz.name}</p>
          <button onClick={() => setOpen(true)}
            className="text-[7px] text-water/80 hover:text-water cursor-pointer">
            {t("View details →", lang)}
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowMap(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="pr-6">{biz.name}</DialogTitle>
          </DialogHeader>

          <div style={{ perspective: "1000px" }}>
            <div className="relative transition-transform duration-500"
              style={{ transformStyle: "preserve-3d", transform: showMap ? "rotateY(180deg)" : "rotateY(0deg)" }}>
              <div style={{ backfaceVisibility: "hidden" }}>
                <div className="text-sm">
                  {biz.photo_url && (
                    <img src={biz.photo_url} alt={biz.name}
                      className="w-full aspect-video object-cover rounded-md mb-2" />
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={biz.verified ? "success" : "outline"}>
                      {biz.verified ? t("Verified", lang) : t("Community", lang)}
                    </Badge>
                    <span className="text-muted-foreground text-xs">{biz.barangay}</span>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                    {biz.address && <><span className="text-muted-foreground">{t("Address", lang)}</span><span>{biz.address}</span></>}
                    {biz.contact && <><span className="text-muted-foreground">{t("Contact", lang)}</span><a href={`tel:${biz.contact}`} className="text-water font-medium">{biz.contact}</a></>}
                    {biz.facebook && <><span className="text-muted-foreground">{t("Facebook Page", lang)}</span><a href={biz.facebook.startsWith("http") ? biz.facebook : `https://${biz.facebook}`} target="_blank" rel="noopener noreferrer" className="text-water font-medium break-all truncate">{biz.facebook.replace(/^https?:\/\//, "")}</a></>}
                    {biz.operating_hours && <><span className="text-muted-foreground">{t("Hours", lang)}</span><span>{biz.operating_hours}</span></>}
                    {biz.estimated_fee && <><span className="text-muted-foreground">{t("Fee", lang)}</span><span className="font-semibold">₱{biz.estimated_fee}</span></>}
                    {biz.delivery_available && <><span className="text-muted-foreground">{t("Delivery", lang)}</span><span className="text-emerald-600 dark:text-emerald-400">{t("Available", lang)}</span></>}
                    {biz.coverage_area && <><span className="text-muted-foreground">{t("Coverage", lang)}</span><span>{biz.coverage_area}</span></>}
                    {biz.delivery_schedule && <><span className="text-muted-foreground">{t("Schedule", lang)}</span><span>{biz.delivery_schedule}</span></>}
                    {biz.payment_options && <><span className="text-muted-foreground">{t("Payment", lang)}</span><span>{biz.payment_options}</span></>}
                  </div>
                  {biz.latitude && biz.longitude && (
                    <button onClick={() => setShowMap(true)}
                      className="flex items-center gap-1.5 text-water text-xs font-medium cursor-pointer mt-2">
                      <MapIcon className="h-3.5 w-3.5" /> {t("View on Map", lang)} →
                    </button>
                  )}
                </div>
              </div>
              <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                {biz.latitude && biz.longitude ? (
                  <div className="space-y-3">
                    <MiniMap lat={biz.latitude} lng={biz.longitude} name={biz.name} />
                    <button onClick={() => setShowMap(false)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                      <ArrowLeft className="h-3.5 w-3.5" /> {t("Back to details", lang)}
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">{t("No map location available", lang)}</div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
