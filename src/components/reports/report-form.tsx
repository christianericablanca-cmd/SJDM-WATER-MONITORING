"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BARANGAYS, ISSUE_TYPES, BARANGAY_COORDS, WATER_PROVIDERS } from "@/lib/constants";
import { Turnstile } from "@/components/reports/turnstile";
import { useToast } from "@/components/ui/toast-provider";
import { Loader2, MapPin, Upload, CheckCircle2, AlertCircle, Droplets, ArrowLeft, ArrowRight, Shield, LocateFixed, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
const STEPS = ["Location & Issue", "Details", "Review & Submit"];

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
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
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
  const [photo, setPhoto] = useState<File | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  const markTouched = (...fields: string[]) => {
    setTouched((prev) => {
      const next = new Set(prev);
      fields.forEach((f) => next.add(f));
      return next;
    });
  };

  const validate = useCallback((): FieldErrors => {
    const e: FieldErrors = {};
    if (!barangay) e.barangay = "Please select your barangay";
    if (!issueType) e.issue_type = "Please select the type of water issue";
    if (issueType === "other" && !customIssue.trim()) e.custom_issue = "Please describe the issue";
    if (!waterProvider) e.water_provider = "Please select your water provider";
    if (!startDate) e.start_date = "When did the issue start?";
    if (!startTime) e.start_time = "What time did it start?";
    if (!lat || !lng) e.location = "Please share your GPS location to place the pin accurately";
    if (photo && photo.size > 2 * 1024 * 1024) e.photo = "Photo must be under 2MB";
    if (photo && !["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
      e.photo = "Only JPG, PNG, or WEBP files are allowed";
    }
    return e;
  }, [barangay, issueType, customIssue, waterProvider, startDate, startTime, photo, lat, lng]);

  const handleLocationPick = () => {
    if (!navigator.geolocation) {
      toastError("Location unavailable", "Geolocation is not supported by your browser. Try using a different browser.");
      return;
    }
    setShowConsentDialog(true);
  };

  const handleConsentGranted = () => {
    setShowConsentDialog(false);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
        toastSuccess("Location set", "Your approximate location has been added to the report.");
      },
      () => {
        setLocating(false);
        toastError("Could not get location", "Please enable location services in your browser settings and try again.");
      },
      { timeout: 10000 },
    );
  };

  const canNext = (): boolean => {
    if (step === 0) return !!barangay && !!issueType && !!lat && !!lng && (issueType !== "other" || !!customIssue.trim());
    if (step === 1) return !!startDate && !!startTime;
    return true;
  };

  const handleNext = () => {
    markTouched("barangay", "issue_type", "water_provider", "custom_issue");
    const v = validate();
    if (step === 0 && (v.barangay || v.issue_type || v.water_provider || v.location || v.custom_issue)) {
      setErrors(v);
      toastError("Missing information", "Please fill in all required fields before continuing.");
      return;
    }
    if (step === 1) {
      markTouched("start_date", "start_time");
      if (v.start_date || v.start_time) {
        setErrors(v);
        toastError("Missing information", "Please provide when the issue started.");
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
      toastError("Please fix errors", "Check the highlighted fields before submitting.");
      return;
    }

    setLoading(true);
    toastInfo("Submitting report…", "Please wait while we process your report.");

    try {
      let photoUrl: string | null = null;

      if (photo) {
        toastInfo("Compressing photo…", "Please wait while we optimize your image.");
        const compressed = await compressImage(photo, 1024, 0.7);
        const formData = new FormData();
        formData.append("file", compressed, "photo.jpg");
        const uploadRes = await fetch("/api/upload-photo", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Photo upload failed");
        photoUrl = uploadData.url;
      }

      const startedAt = `${startDate}T${startTime}:00`;

      const barangayCenter = BARANGAY_COORDS[barangay as keyof typeof BARANGAY_COORDS];
      const fallbackLat = barangayCenter ? barangayCenter.lat + (Math.random() - 0.5) * 0.006 : 14.8136;
      const fallbackLng = barangayCenter ? barangayCenter.lng + (Math.random() - 0.5) * 0.006 : 121.0453;

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barangay,
          latitude: lat ?? fallbackLat,
          longitude: lng ?? fallbackLng,
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
          toastError("Rate limit reached", "Maximum 3 reports per hour. Please try again later.");
        } else {
          throw new Error(data.error || "Something went wrong");
        }
        setLoading(false);
        return;
      }

      toastSuccess("Report submitted!", `Your report ID is ${data.report_id_display}. It's now subject for validation.`);
      setSubmitted(data.report_id_display);
      router.refresh();
    } catch (err: any) {
      toastError("Submission failed", err.message || "Please check your connection and try again.");
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center slide-up">
        <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>
        <p className="text-muted-foreground mb-2">
          Your report has been received and is now subject for validation.
        </p>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5 text-left">
          <Shield className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Your report will appear on the community map once it has been reviewed and approved by an admin. This helps ensure only verified reports are shown to the public.</span>
        </div>
        <div className="bg-water-muted/50 rounded-xl p-5 border border-water/20 mb-6">
          <p className="text-xs text-muted-foreground mb-1">Your Report ID</p>
          <p className="text-xl font-bold text-water">{submitted}</p>
          <p className="text-[11px] text-muted-foreground mt-2">
            Save this ID to track your report status later.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push("/report/" + submitted.split("-").pop())}>
            Track Status
          </Button>
          <Button variant="outline" onClick={() => router.push("/map")}>
            View Reports
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
                {step === 0 && "Where and what?"}
                {step === 1 && "When did it start?"}
                {step === 2 && "Review your report"}
              </CardTitle>
              <CardDescription>
                {step === 0 && "Tell us where the issue is and what type of water problem you're experiencing."}
                {step === 1 && "When did the issue start? Any additional details help the community."}
                {step === 2 && "Please check everything is correct before submitting."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1.5">
                <Label htmlFor="barangay">Barangay <span className="text-destructive">*</span></Label>
                <Select value={barangay} onValueChange={(v) => { setBarangay(v); setErrors((e) => ({ ...e, barangay: undefined })); }}>
                  <SelectTrigger id="barangay" className={cn("h-10", errors.barangay && touched.has("barangay") && "border-destructive")}>
                    <SelectValue placeholder="Select your barangay" />
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
                <Label>Pin Location <span className="text-destructive">*</span></Label>
                <Button type="button" variant={lat && lng ? "default" : "outline"} onClick={handleLocationPick} disabled={locating}
                  className={cn(
                    "w-full h-12 justify-start gap-3 text-sm font-medium transition-all",
                    lat && lng ? "bg-water text-white hover:bg-water-dark border-water shadow-sm" : "border-2 border-dashed hover:border-water/60 hover:bg-water-muted/30",
                  )}>
                  <MapPin className={cn("h-5 w-5", locating && "animate-pulse")} />
                  {locating ? "Getting your location…" :
                    lat && lng ? `📍 Pin set ✓` : "📌 Tap to drop a pin at your location"}
                </Button>
                {lat && lng ? (
                  <p className="text-[11px] text-water-dark flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Pin coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0 mt-0.25" />
                    <span>GPS pin is <strong>required</strong>. You must share your location for accurate placement of the report marker.</span>
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="street">Street / Sitio <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. Block 1, Lot 5 — helps others locate the issue" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="water_provider">Water Provider <span className="text-destructive">*</span></Label>
                <Select value={waterProvider} onValueChange={(v) => { setWaterProvider(v); setErrors((e) => ({ ...e, water_provider: undefined })); }}>
                  <SelectTrigger id="water_provider" className={cn("h-10 text-sm", errors.water_provider && touched.has("water_provider") && "border-destructive")}>
                    <SelectValue placeholder="Select your water provider" />
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
                <span>Reports go <strong>inactive</strong> after <strong>7 days</strong> of no confirmations. To reactivate, either submit a new report at the same location (we'll match it automatically) or scroll down to enter your Report ID below.</span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="issue_type">Water Issue Type <span className="text-destructive">*</span></Label>
                <Select value={issueType} onValueChange={(v) => { setIssueType(v); if (v !== "other") setCustomIssue(""); setErrors((e) => ({ ...e, issue_type: undefined, custom_issue: undefined })); }}>
                  <SelectTrigger id="issue_type" className={cn("h-10", errors.issue_type && touched.has("issue_type") && "border-destructive")}>
                    <SelectValue placeholder="What kind of water issue?" />
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
                    <Label htmlFor="custom_issue">Describe the issue <span className="text-destructive">*</span></Label>
                    <Input id="custom_issue" value={customIssue}
                      onChange={(e) => { setCustomIssue(e.target.value); setErrors((e) => ({ ...e, custom_issue: undefined })); }}
                      placeholder="e.g. No water every morning from 6–9 AM"
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
                <Label>When did it start? <span className="text-destructive">*</span></Label>
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
                      : "bg-water-muted/50 text-water-dark border-water/30 hover:bg-water-muted",
                  )}
                >
                  <Clock className="h-4 w-4" />
                  Started Today — auto-fill date &amp; time
                </button>
                <p className="text-xs text-foreground/70 font-medium">Or set manually below — select the actual date the issue began, even if it was weeks or months ago. Don't remember the exact time? An estimate is fine.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="start_date" className="text-xs text-muted-foreground">Date</Label>
                    <Input id="start_date" type="date" value={startDate}
                      onChange={(e) => { setStartedToday(false); setStartDate(e.target.value); setErrors((e) => ({ ...e, start_date: undefined })); }}
                      max={new Date().toISOString().slice(0, 10)}
                      className={cn("h-10 text-sm", errors.start_date && touched.has("start_date") && "border-destructive")} />
                    {errors.start_date && touched.has("start_date") && (
                      <p className="text-[11px] text-destructive">{errors.start_date}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="start_time" className="text-xs text-muted-foreground">Time</Label>
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
                <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">(optional but helpful)</span></Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Is it intermittent? How many households affected? Any other useful details…"
                  rows={4} className="resize-none" />
                <p className="text-[11px] text-muted-foreground text-right">{description.length} characters</p>
              </div>
              <div className="space-y-1.5">
                <Label>Photo Evidence <span className="text-muted-foreground text-xs">(optional, max 2MB)</span></Label>
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
                          setErrors((e) => ({ ...e, photo: "Photo is too large. Maximum size is 2MB." }));
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
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Report Summary</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Barangay</span>
                  <span className="font-medium">{barangay}</span>
                </div>
                {street && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Street/Sitio</span>
                    <span className="font-medium">{street}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Issue Type</span>
                  <span className="font-medium">{ISSUE_TYPES.find(t => t.value === issueType)?.emoji} {ISSUE_TYPES.find(t => t.value === issueType)?.label}</span>
                </div>
                {issueType === "other" && customIssue.trim() && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Identified as</span>
                    <span className="font-medium text-xs">{customIssue.trim()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Started</span>
                  <span className="font-medium">{startDate} at {startTime}{startedToday ? " (today)" : ""}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium">{WATER_PROVIDERS.find((p) => p.value === waterProvider)?.label || waterProvider}</span>
                </div>
                {lat && lng ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pin Location</span>
                    <span className="font-medium text-xs text-water">GPS ✓</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span><strong>GPS location is required.</strong> Go back to step 1 and share your location to submit this report.</span>
                  </div>
                )}
                {description && (
                  <div className="text-sm pt-1 border-t">
                    <span className="text-muted-foreground block mb-0.5 text-xs">Description</span>
                    <span className="text-sm leading-relaxed">{description}</span>
                  </div>
                )}
              </div>

              {TURNSTILE_SITE_KEY && (
                <div>
                  <Label className="mb-2 block text-xs">Verify you're human</Label>
                  <Turnstile siteKey={TURNSTILE_SITE_KEY} onVerify={(token) => setCaptchaToken(token)} />
                </div>
              )}

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>By submitting, you confirm this report is truthful. Do not submit false or malicious information.</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-3 mt-4">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <div className="text-xs text-muted-foreground self-center">
          Step {step + 1} of 3
        </div>
        {step < 2 ? (
          <Button onClick={handleNext} disabled={!canNext()} className="gap-1.5">
            Continue <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="min-w-[140px] gap-1.5">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
            ) : "Submit Report"}
          </Button>
        )}
      </div>

      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-water-muted flex items-center justify-center mx-auto mb-2">
              <LocateFixed className="h-6 w-6 text-water" />
            </div>
            <DialogTitle className="text-center text-lg">Share your location?</DialogTitle>
            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              Your precise address is <strong>never</strong> shared publicly. Only a blurred coordinate is stored to place a pin on the community map.
            </p>
          </DialogHeader>
          <div className="space-y-2.5 px-1">
            <div className="flex items-start gap-2.5 p-2.5 bg-muted/50 rounded-lg">
              <Shield className="h-4 w-4 text-water shrink-0 mt-0.5" />
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Privacy first.</strong> Your exact address is never shown. Only the approximate area appears on the map.
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 bg-muted/50 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-water shrink-0 mt-0.5" />
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Better accuracy.</strong> Without GPS, the pin is randomly placed near the barangay center and may be inaccurate.
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-[11px] text-destructive leading-relaxed">
                GPS location is <strong>required</strong> to submit a report. Random pins are not allowed.
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <Button onClick={handleConsentGranted} className="w-full h-11 gap-2 text-sm">
              <LocateFixed className="h-4 w-4" /> Share My Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
