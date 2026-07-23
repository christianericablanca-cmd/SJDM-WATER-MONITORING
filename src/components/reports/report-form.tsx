"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BARANGAYS, ISSUE_TYPES, WATER_PROVIDERS } from "@/lib/constants";
import { Turnstile } from "@/components/reports/turnstile";
import { useToast } from "@/components/ui/toast-provider";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";
import dynamic from "next/dynamic";
const LocationPicker = dynamic(() => import("@/components/reports/location-picker").then((m) => m.LocationPicker), { ssr: false });
import { Loader2, Upload, CheckCircle2, AlertCircle, Droplets, ArrowLeft, ArrowRight, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function compressImage(file: File, maxSize = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Compression failed"));
      }, "image/jpeg", quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

interface FieldErrors {
  barangay?: string;
  issue_type?: string;
  custom_issue?: string;
  water_provider?: string;
  start_date?: string;
  start_time?: string;
  photo?: string;
  location?: string;
}

export function ReportForm() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const STEPS = [t("Location & Issue", lang), t("Details", lang), t("Review & Submit", lang)];
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const [barangay, setBarangay] = useState("");
  const [issueType, setIssueType] = useState("");
  const [customIssue, setCustomIssue] = useState("");
  const [street, setStreet] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [waterProvider, setWaterProvider] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [startedToday, setStartedToday] = useState(false);
  const [description, setDescription] = useState("");
  useEffect(() => {
    const id = "dark-picker-fix";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `
        html.dark input[type="date"]::-webkit-calendar-picker-indicator,
        html.dark input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1) !important;
          opacity: 1 !important;
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);

  const [photo, setPhoto] = useState<File | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handlePin = useCallback((lat: number, lng: number) => {
    setLat(lat);
    setLng(lng);
    setErrors((e) => ({ ...e, location: undefined }));
  }, []);

  const markTouched = (...fields: string[]) => {
    setTouched((prev) => {
      const next = new Set(prev);
      fields.forEach((f) => next.add(f));
      return next;
    });
  };

  const validate = useCallback((): FieldErrors => {
    const e: FieldErrors = {};
    if (!barangay) e.barangay = t("Please select your barangay", lang);
    if (!issueType) e.issue_type = t("Please select the type of water issue", lang);
    if (issueType === "other" && !customIssue.trim()) e.custom_issue = t("Please describe the issue", lang);
    if (!waterProvider) e.water_provider = t("Please select your water provider", lang);
    if (!startDate) e.start_date = t("When did the issue start?", lang);
    if (!startTime) e.start_time = t("What time did it start?", lang);
    if (!lat || !lng) e.location = t("Pin location is required", lang);
    if (photo && photo.size > 2 * 1024 * 1024) e.photo = t("Photo must be under 2MB", lang);
    if (photo && !["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
      e.photo = t("Only JPG, PNG, or WEBP files are allowed", lang);
    }
    return e;
  }, [barangay, issueType, customIssue, waterProvider, startDate, startTime, photo, lat, lng]);

  const canNext = (): boolean => {
    if (step === 0) return !!barangay && !!issueType && (issueType !== "other" || !!customIssue.trim()) && !!lat && !!lng;
    if (step === 1) return !!startDate && !!startTime;
    return true;
  };

  const handleNext = () => {
    markTouched("barangay", "issue_type", "water_provider", "custom_issue");
    const v = validate();
    if (step === 0 && (v.barangay || v.issue_type || v.water_provider || v.custom_issue)) {
      setErrors(v);
      toastError(t("Missing information", lang), t("Please fill in all required fields before continuing.", lang));
      return;
    }
    if (step === 1) {
      markTouched("start_date", "start_time");
      if (v.start_date || v.start_time) {
        setErrors(v);
        toastError(t("Missing information", lang), t("Please provide when the issue started.", lang));
        return;
      }
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      toastError(t("Please fix errors", lang), t("Check the highlighted fields before submitting.", lang));
      return;
    }

    setLoading(true);
    toastInfo(t("Submitting report…", lang), t("Please wait while we process your report.", lang));

    try {
      let photoUrl: string | null = null;

      if (photo) {
        toastInfo(t("Compressing photo…", lang), t("Please wait while we optimize your image.", lang));
        const compressed = await compressImage(photo, 1024, 0.7);
        const formData = new FormData();
        formData.append("file", compressed, "photo.jpg");
        const uploadRes = await fetch("/api/upload-photo", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Photo upload failed");
        photoUrl = uploadData.url;
      }

      const startedAt = `${startDate}T${startTime}:00`;

      const pinLat = lat ?? 14.8136;
      const pinLng = lng ?? 121.0453;

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barangay,
          latitude: pinLat,
          longitude: pinLng,
          issue_type: issueType,
          custom_issue: issueType === "other" ? customIssue.trim() : null,
          water_provider: waterProvider,
          description: issueType === "other" ? `[${customIssue.trim()}]${description ? " " + description : ""}` : (description || null),
          photo_url: photoUrl,
          started_at: startedAt,
          street_sitio: street || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          toastError(t("Rate limit reached", lang), t("Maximum 3 reports per hour. Please try again later.", lang));
        } else {
          throw new Error(data.error || "Something went wrong");
        }
        setLoading(false);
        return;
      }

      toastSuccess(t("Report submitted!", lang), t("Your report ID is", lang) + " " + data.report_id_display + ". " + t("It's now subject for validation.", lang));
      setSubmitted(data.report_id_display);
      router.refresh();
    } catch (err: unknown) {
      toastError(t("Submission failed", lang), err instanceof Error ? err.message : t("Please check your connection and try again.", lang));
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center slide-up">
        <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t("Report Submitted!", lang)}</h2>
        <p className="text-muted-foreground mb-2">
          {t("Your report has been received and is now subject for validation.", lang)}
        </p>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5 text-left">
          <Shield className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{t("Your report will appear on the community map once it has been reviewed and approved by an admin. This helps ensure only verified reports are shown to the public.", lang)}</span>
        </div>
        <div className="bg-water-muted/50 rounded-xl p-5 border border-water/20 mb-6">
          <p className="text-xs text-muted-foreground mb-1">{t("Your Report ID", lang)}</p>
          <p className="text-xl font-bold text-water">{submitted}</p>
          <p className="text-[11px] text-muted-foreground mt-2">
            {t("Save this ID to track your report status later.", lang)}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push("/report/" + submitted.split("-").pop())}>
            {t("Track Status", lang)}
          </Button>
          <Button variant="outline" onClick={() => router.push("/map")}>
            {t("View Reports", lang)}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              i === step ? "bg-water text-white shadow-sm" :
              i < step ? "bg-water-muted text-water-dark" : "bg-muted text-muted-foreground",
            )}>
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold",
                i === step ? "bg-white/20" : i < step ? "bg-water/20" : "bg-border",
              )}>
                {i < step ? "✓" : i + 1}
              </span>
              <span className="sm:hidden text-xs font-medium">Step {i + 1}</span>
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("w-8 h-px mx-1", i < step ? "bg-water" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      <Card className="shadow-card border-border/60">
        <CardHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-water-muted flex items-center justify-center">
              <Droplets className="h-4 w-4 text-water" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {step === 0 && t("Where and what?", lang)}
                {step === 1 && t("When did it start?", lang)}
                {step === 2 && t("Review your report", lang)}
              </CardTitle>
              <CardDescription>
                {step === 0 && t("Tell us where the issue is and what type of water problem you're experiencing.", lang)}
                {step === 1 && t("When did the issue start? Any additional details help the community.", lang)}
                {step === 2 && t("Please check everything is correct before submitting.", lang)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1.5">
                <Label htmlFor="barangay">{t("Barangay", lang)} <span className="text-destructive">*</span></Label>
                <Select value={barangay} onValueChange={(v) => { setBarangay(v); setErrors((e) => ({ ...e, barangay: undefined })); }}>
                  <SelectTrigger id="barangay" className={cn("h-10", errors.barangay && touched.has("barangay") && "border-destructive")}>
                    <SelectValue placeholder={t("Select barangay", lang)} />
                  </SelectTrigger>
                  <SelectContent>
                    {BARANGAYS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.barangay && touched.has("barangay") && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                    <AlertCircle className="h-3 w-3" /> {errors.barangay}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>{t("Pin Location", lang)} <span className="text-destructive">*</span></Label>
                <LocationPicker barangay={barangay} onPin={handlePin} lat={lat} lng={lng} />
                {errors.location && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                    <AlertCircle className="h-3 w-3" /> {errors.location}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="street">{t("Street / Sitio", lang)} <span className="text-muted-foreground text-xs">{t("(optional)", lang)}</span></Label>
                <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)}
                  placeholder={t("e.g. Block 1, Lot 5 — helps others locate the issue", lang)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="water_provider">{t("Water Provider", lang)} <span className="text-destructive">*</span></Label>
                <Select value={waterProvider} onValueChange={(v) => { setWaterProvider(v); setErrors((e) => ({ ...e, water_provider: undefined })); }}>
                  <SelectTrigger id="water_provider" className={cn("h-10 text-sm", errors.water_provider && touched.has("water_provider") && "border-destructive")}>
                    <SelectValue placeholder={t("Select your water provider", lang)} />
                  </SelectTrigger>
                  <SelectContent>
                    {WATER_PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.water_provider && touched.has("water_provider") && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                    <AlertCircle className="h-3 w-3" /> {errors.water_provider}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {WATER_PROVIDERS.find((p) => p.value === waterProvider)?.description}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{t("Reports go inactive after 7 days of no confirmations. To reactivate, submit a new report at the same location — we will automatically match and reactivate the original report. You can also reactivate from the Track Report page using your Report ID.", lang)}</span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="issue_type">{t("Water Issue Type", lang)} <span className="text-destructive">*</span></Label>
                <Select value={issueType} onValueChange={(v) => { setIssueType(v); if (v !== "other") setCustomIssue(""); setErrors((e) => ({ ...e, issue_type: undefined, custom_issue: undefined })); }}>
                  <SelectTrigger id="issue_type" className={cn("h-10", errors.issue_type && touched.has("issue_type") && "border-destructive")}>
                    <SelectValue placeholder={t("What kind of water issue?", lang)} />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.emoji} {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.issue_type && touched.has("issue_type") && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                    <AlertCircle className="h-3 w-3" /> {errors.issue_type}
                  </p>
                )}
                {issueType === "other" && (
                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="custom_issue">{t("Describe the issue", lang)} <span className="text-destructive">*</span></Label>
                    <Input id="custom_issue" value={customIssue}
                      onChange={(e) => { setCustomIssue(e.target.value); setErrors((e) => ({ ...e, custom_issue: undefined })); }}
                      placeholder={t("e.g. No water every morning from 6–9 AM", lang)}
                      className={cn("h-10 text-sm", errors.custom_issue && touched.has("custom_issue") && "border-destructive")} />
                    {errors.custom_issue && touched.has("custom_issue") && (
                      <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                        <AlertCircle className="h-3 w-3" /> {errors.custom_issue}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-3">
                <Label>{t("When did it start?", lang)} <span className="text-destructive">*</span></Label>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setStartedToday(true);
                    setStartDate(now.toISOString().slice(0, 10));
                    setStartTime(now.toTimeString().slice(0, 5));
                    setErrors((e) => ({ ...e, start_date: undefined, start_time: undefined }));
                  }}
                  className={cn(
                    "w-full h-11 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2",
                    startedToday
                      ? "bg-water text-white border-water shadow-sm"
                      : "bg-muted text-foreground border-border hover:bg-muted/80",
                  )}
                >
                  <Clock className="h-4 w-4" />
                  {t("Started Today — auto-fill date & time", lang)}
                </button>
                <p className="text-xs text-foreground/70 font-medium">{t("Or set manually below — select the actual date the issue began, even if it was weeks or months ago. Don't remember the exact time? An estimate is fine.", lang)}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="start_date" className="text-xs text-muted-foreground">{t("Date", lang)}</Label>
                    <Input id="start_date" type="date" value={startDate}
                      onChange={(e) => { setStartedToday(false); setStartDate(e.target.value); setErrors((e) => ({ ...e, start_date: undefined })); }}
                      max={new Date().toISOString().slice(0, 10)}
                      className={cn("h-10 text-sm", errors.start_date && touched.has("start_date") && "border-destructive")} />
                    {errors.start_date && touched.has("start_date") && (
                      <p className="text-[11px] text-destructive">{errors.start_date}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="start_time" className="text-xs text-muted-foreground">{t("Time", lang)}</Label>
                    <Input id="start_time" type="time" value={startTime}
                      onChange={(e) => { setStartedToday(false); setStartTime(e.target.value); setErrors((e) => ({ ...e, start_time: undefined })); }}
                      className={cn("h-10 text-sm", errors.start_time && touched.has("start_time") && "border-destructive")} />
                    {errors.start_time && touched.has("start_time") && (
                      <p className="text-[11px] text-destructive">{errors.start_time}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">{t("Description", lang)} <span className="text-muted-foreground text-xs">{t("(optional but helpful)", lang)}</span></Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("Is it intermittent? How many households affected? Any other useful details…", lang)}
                  rows={4} className="resize-none" />
                <p className="text-[11px] text-muted-foreground text-right">{description.length} {t("characters", lang)}</p>
              </div>
              <div className="space-y-1.5">
                <Label>{t("Photo Evidence", lang)} <span className="text-muted-foreground text-xs">{t("(optional, max 2MB)", lang)}</span></Label>
                <div className={cn(
                  "flex items-center gap-3 p-3 border border-dashed rounded-lg transition-colors",
                  errors.photo ? "border-destructive" : "hover:border-water/50",
                )}>
                  <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Input id="photo" type="file" accept=".jpg,.jpeg,.png,.webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setPhoto(file || null);
                        setErrors((e) => ({ ...e, photo: undefined }));
                        if (file && file.size > 2 * 1024 * 1024) {
                          setErrors((e) => ({ ...e, photo: t("Photo is too large. Maximum size is 2MB.", lang) }));
                        }
                      }}
                      className="text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border file:border-water/30 file:text-xs file:bg-water-muted file:text-water-dark hover:file:bg-water-muted/80" />
                    {photo && <p className="text-[11px] text-muted-foreground mt-1">📷 {photo.name} ({(photo.size / 1024).toFixed(0)} KB)</p>}
                  </div>
                </div>
                {errors.photo && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                    <AlertCircle className="h-3 w-3" /> {errors.photo}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 border">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Report Summary", lang)}</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("Barangay", lang)}</span>
                  <span className="font-medium">{barangay}</span>
                </div>
                {street && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("Street/Sitio", lang)}</span>
                    <span className="font-medium">{street}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("Issue Type", lang)}</span>
                  <span className="font-medium">{ISSUE_TYPES.find(t => t.value === issueType)?.emoji} {ISSUE_TYPES.find(t => t.value === issueType)?.label}</span>
                </div>
                {issueType === "other" && customIssue.trim() && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("Identified as", lang)}</span>
                    <span className="font-medium text-xs">{customIssue.trim()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("Started", lang)}</span>
                  <span className="font-medium">{startDate} at {startTime}{startedToday ? ` ${t("(today)", lang)}` : ""}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("Provider", lang)}</span>
                  <span className="font-medium">{WATER_PROVIDERS.find((p) => p.value === waterProvider)?.label || waterProvider}</span>
                </div>
                {lat && lng ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("Pin Location", lang)}</span>
                    <span className="font-medium text-xs text-water">{t("Pin set", lang)} ✓</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{t("Pin location is not set. Go back to step 1 and select a barangay to place the pin.", lang)}</span>
                  </div>
                )}
                {description && (
                  <div className="text-sm pt-1 border-t">
                    <span className="text-muted-foreground block mb-0.5 text-xs">{t("Description", lang)}</span>
                    <span className="text-sm leading-relaxed">{description}</span>
                  </div>
                )}
              </div>

              {TURNSTILE_SITE_KEY && (
                <div>
                  <Label className="mb-2 block text-xs">{t("Verify you're human", lang)}</Label>
                  <Turnstile siteKey={TURNSTILE_SITE_KEY} onVerify={(token) => setCaptchaToken(token)} />
                </div>
              )}

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{t("By submitting, you confirm this report is truthful. Do not submit false or malicious information.", lang)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-3 mt-4">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> {t("Back", lang)}
        </Button>
        <div className="text-xs text-muted-foreground self-center">
          {t("Step {current} of {total}", lang).replace("{current}", String(step + 1)).replace("{total}", String(3))}
        </div>
        {step < 2 ? (
          <Button onClick={handleNext} disabled={!canNext()} className="gap-1.5">
            {t("Continue", lang)} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="min-w-[140px] gap-1.5">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {t("Submitting…", lang)}</>
            ) : t("Submit Report", lang)}
          </Button>
        )}
      </div>

    </div>
  );
}
