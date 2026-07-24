"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BARANGAYS, BARANGAY_COORDS, BUSINESS_CATEGORIES } from "@/lib/constants";
import { useToast } from "@/components/ui/toast-provider";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";
import { Turnstile } from "@/components/reports/turnstile";
import { Loader2, Building2, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const STEPS = ["Service Info", "Contact & Services", "Review"];

interface FieldErrors {
  name?: string;
  category?: string;
  address?: string;
  barangay?: string;
  contact?: string;
  facebook?: string;
}

export function BusinessClaimForm() {
  const { lang } = useLanguage();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [barangay, setBarangay] = useState("");
  const [contact, setContact] = useState("");
  const [facebook, setFacebook] = useState("");
  const [deliveryAvailable, setDeliveryAvailable] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const operatingHours = openTime && closeTime ? `${openTime} — ${closeTime}` : "";
  const [coverageArea, setCoverageArea] = useState("");
  const [estimatedFee, setEstimatedFee] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoUrlRef = useRef<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    };
  }, []);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!name.trim()) e.name = t("Business name is required", lang);
    if (!category) e.category = t("Please select a category", lang);
    if (!address.trim()) e.address = t("Address is required", lang);
    if (!barangay) e.barangay = t("Please select a barangay", lang);
    if (contact && !/^[\d\-+() ]{7,15}$/.test(contact)) e.contact = t("Enter a valid phone number", lang);
    if (facebook && !facebook.startsWith("http")) e.facebook = t("Enter a full URL (starting with https://)", lang);
    return e;
  };

  const canNext = (): boolean => {
    if (step === 0) return !!name && !!category && !!address && !!barangay;
    return true;
  };

  const handleNext = () => {
    const v = validate();
    if (step === 0) {
      const relevant = { name: v.name, category: v.category, address: v.address, barangay: v.barangay };
      if (Object.values(relevant).some(Boolean)) {
        setErrors(v);
        toastError(t("Missing information", lang), t("Please fill in all required fields before continuing.", lang));
        return;
      }
      setErrors({});
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (step === 1) {
      setErrors({});
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const compressImage = (file: File, maxSize = 1024, quality = 0.7): Promise<Blob> => {
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
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob((b) => {
          if (b) resolve(b); else reject(new Error("Compression failed"));
        }, "image/jpeg", quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
      img.src = url;
    });
  };

  const handleSubmit = async () => {
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      toastError(t("Please fix errors", lang), t("Check the highlighted fields before submitting.", lang));
      return;
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      toastError(t("Captcha required", lang), t("Please verify you're human before submitting.", lang));
      return;
    }

    setLoading(true);
    toastInfo(t("Submitting your listing…", lang), t("An admin will review it shortly.", lang));

    try {
      let photoUrl: string | null = null;
      if (photo) {
        toastInfo(t("Uploading photo…", lang), t("Compressing and uploading your store image.", lang));
        const compressed = await compressImage(photo);
        const formData = new FormData();
        formData.append("file", compressed, "store.jpg");
        const uploadRes = await fetch("/api/upload-photo", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Photo upload failed");
        photoUrl = uploadData.url;
      }

      const res = await fetch("/api/business-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          address: address.trim(),
          barangay,
          contact: contact || null,
          facebook: facebook || null,
          delivery_available: deliveryAvailable === "yes",
          operating_hours: operatingHours || null,
          coverage_area: coverageArea || null,
          estimated_fee: estimatedFee || null,
          latitude: lat,
          longitude: lng,
          photo_url: photoUrl,
          captcha_token: captchaToken,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          toastError(t("Daily limit reached", lang), t("Maximum 2 submissions per day. Please try again tomorrow.", lang));
        } else {
          throw new Error(data.error || "Submission failed");
        }
        setLoading(false);
        return;
      }

      toastSuccess(t("Listing submitted!", lang), t("Your business is now pending review by an admin. We'll notify you once it's approved.", lang));
      setSubmitted(true);
    } catch (err: unknown) {
      toastError(t("Submission failed", lang), err instanceof Error ? err.message : t("Please check your connection and try again.", lang));
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-lg mx-auto text-center border-green-200 dark:border-green-800 shadow-card">
        <CardHeader>
          <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <CardTitle className="text-xl">{t("Listing Submitted!", lang)}</CardTitle>
          <CardDescription className="text-sm">
            {t("Your business has been submitted for review. An admin will verify and approve it before it appears on the directory. This usually takes 1-2 days.", lang)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-xl border text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">{t("What happens next?", lang)}</p>
            <ol className="text-left space-y-1 list-decimal list-inside text-sm">
              <li>{t("An admin reviews your submission", lang)}</li>
              <li>{t("If approved, it appears in the Services Directory", lang)}</li>
              <li>{t("You can contact us to update your listing anytime", lang)}</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              i === step ? "bg-water text-white shadow-sm" :
              i < step ? "bg-water-muted text-water-dark" : "bg-muted text-muted-foreground",
            )}>
              {i < step ? "✓" : i + 1} <span className="sm:hidden text-xs font-medium">Step {i + 1}</span><span className="hidden sm:inline ml-1">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("w-6 h-px mx-1", i < step ? "bg-water" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      <Card className="shadow-card border-border/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-water-muted flex items-center justify-center">
              <Building2 className="h-4 w-4 text-water" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {step === 0 ? t("Tell us about your service", lang) : t("Contact & services", lang)}
              </CardTitle>
              <CardDescription>
                {step === 0
                  ? t("Basic information about your service. Fields marked * are required.", lang)
                  : t("How can the community reach you? What services do you offer?", lang)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("Business Name", lang)} <span className="text-destructive">*</span></Label>
                <Input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder={t("e.g. AquaPure Refilling Station", lang)}
                  className={cn("h-10", errors.name && "border-destructive")} />
                {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("Category", lang)} <span className="text-destructive">*</span></Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className={cn("h-10", errors.category && "border-destructive")}>
                    <SelectValue placeholder={t("Select your business type", lang)} />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-[11px] text-destructive">{errors.category}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("Address", lang)} <span className="text-destructive">*</span></Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("e.g. Block 1, Lot 2, Muzon Road", lang)}
                  className={cn("h-10", errors.address && "border-destructive")} />
                {errors.address && <p className="text-[11px] text-destructive">{errors.address}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("Barangay", lang)} <span className="text-destructive">*</span></Label>
                <Select value={barangay} onValueChange={setBarangay}>
                  <SelectTrigger className={cn("h-10", errors.barangay && "border-destructive")}>
                    <SelectValue placeholder={t("Select barangay...", lang)} />
                  </SelectTrigger>
                  <SelectContent>
                    {BARANGAYS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.barangay && <p className="text-[11px] text-destructive">{errors.barangay}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("Map Location", lang)} <span className="text-muted-foreground text-xs">{t("(optional)", lang)}</span></Label>
                <div className="rounded-xl border overflow-hidden h-[280px] sm:h-[340px]">
                  <LocationPicker
                    barangay={barangay}
                    lat={lat}
                    lng={lng}
                    onPin={(newLat, newLng) => {
                      setLat(newLat);
                      setLng(newLng);
                    }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t("Drag the marker to your business location. The pin is constrained within the selected barangay.", lang)}
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("Phone Number", lang)} <span className="text-muted-foreground text-xs">{t("(recommended)", lang)}</span></Label>
                <Input value={contact} onChange={(e) => setContact(e.target.value)}
                  placeholder={t("e.g. 0917-123-4567", lang)}
                  className={cn("h-10", errors.contact && "border-destructive")} />
                {errors.contact && <p className="text-[11px] text-destructive">{errors.contact}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("Facebook Page URL", lang)} <span className="text-muted-foreground text-xs">{t("(optional)", lang)}</span></Label>
                <Input value={facebook} onChange={(e) => setFacebook(e.target.value)}
                  placeholder={t("https://facebook.com/yourpage", lang)}
                  className={cn("h-10", errors.facebook && "border-destructive")} />
                {errors.facebook && <p className="text-[11px] text-destructive">{errors.facebook}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("Delivery Available?", lang)}</Label>
                <Select value={deliveryAvailable} onValueChange={setDeliveryAvailable}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={t("Select", lang)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t("Yes — we deliver", lang)}</SelectItem>
                    <SelectItem value="no">{t("No — walk-in only", lang)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("Store Photo (optional)", lang)}</Label>
                <div className={cn(
                  "flex items-center gap-3 p-3 border border-dashed rounded-lg transition-colors",
                  "hover:border-water/50",
                )}>
                  <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Input id="photo" type="file" accept=".jpg,.jpeg,.png,.webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setPhoto(file || null);
                        if (file) {
                          if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
                          const url = URL.createObjectURL(file);
                          photoUrlRef.current = url;
                          setPhotoPreview(url);
                        } else {
                          if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
                          photoUrlRef.current = null;
                          setPhotoPreview(null);
                        }
                      }}
                      className="text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border file:border-water/30 file:text-xs file:bg-water-muted file:text-water-dark hover:file:bg-water-muted/80" />
                    {photo && <p className="text-[11px] text-muted-foreground mt-1">📷 {(photo.size / 1024).toFixed(0)} KB</p>}
                  </div>
                </div>
                {photoPreview && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>{t("Operating Hours", lang)}</Label>
                <div className="flex items-center gap-2">
                  <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)}
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                  <span className="text-muted-foreground text-xs">—</span>
                  <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)}
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("Coverage Area", lang)}</Label>
                <Input value={coverageArea} onChange={(e) => setCoverageArea(e.target.value)}
                  placeholder={t("e.g. Muzon, Graceville, Minuyan", lang)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("Estimated Fee", lang)} <span className="text-muted-foreground text-xs">{t("(for tanker/delivery services)", lang)}</span></Label>
                <Input value={estimatedFee} onChange={(e) => setEstimatedFee(e.target.value)}
                  placeholder={t("e.g. ₱500 — ₱1,000", lang)} className="h-10" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 border">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Review Listing", lang)}</h4>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("Business Name", lang)}</span><span className="font-medium">{name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("Category", lang)}</span><span className="font-medium">{BUSINESS_CATEGORIES.find((c) => c.value === category)?.label}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("Address", lang)}</span><span className="font-medium">{address}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("Barangay", lang)}</span><span className="font-medium">{barangay}</span></div>
                {contact && <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("Contact", lang)}</span><span className="font-medium">{contact}</span></div>}
                {operatingHours && <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("Operating Hours", lang)}</span><span className="font-medium">{operatingHours}</span></div>}
                {deliveryAvailable && <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("Delivery Available?", lang)}</span><span className="font-medium">{deliveryAvailable === "yes" ? t("Yes", lang) : t("No", lang)}</span></div>}
              </div>
              {photoPreview && (
                <div className="rounded-lg overflow-hidden bg-muted border">
                  <img src={photoPreview} alt="Store preview" className="w-full h-36 object-cover" />
                </div>
              )}
              {TURNSTILE_SITE_KEY && (
                <div>
                  <Label className="mb-2 block text-xs">{t("Verify you're human", lang)}</Label>
                  <Turnstile siteKey={TURNSTILE_SITE_KEY} onVerify={(token) => setCaptchaToken(token)} />
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center">{t("An admin will review and approve your listing.", lang)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> {t("Back", lang)}
        </Button>
        {step < 2 ? (
          <Button onClick={handleNext} disabled={!canNext()} className="gap-1.5">
            {t("Continue", lang)} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="min-w-[140px] gap-1.5">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("Submitting…", lang)}</> : t("Submit Listing", lang)}
          </Button>
        )}
      </div>
    </div>
  );
}

const LocationPicker = dynamic(() => import("@/components/reports/location-picker").then((m) => m.LocationPicker), { ssr: false });


