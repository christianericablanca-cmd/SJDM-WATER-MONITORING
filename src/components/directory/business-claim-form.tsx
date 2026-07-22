"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BARANGAYS, BUSINESS_CATEGORIES } from "@/lib/constants";
import { useToast } from "@/components/ui/toast-provider";
import { Loader2, Building2, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, MapPin, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Business Info", "Contact & Services", "Review"];

interface FieldErrors {
  name?: string;
  category?: string;
  address?: string;
  barangay?: string;
  contact?: string;
  facebook?: string;
}

export function BusinessClaimForm() {
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
  const [operatingHours, setOperatingHours] = useState("");
  const [coverageArea, setCoverageArea] = useState("");
  const [estimatedFee, setEstimatedFee] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!name.trim()) e.name = "Business name is required";
    if (!category) e.category = "Please select a category";
    if (!address.trim()) e.address = "Address is required";
    if (!barangay) e.barangay = "Please select a barangay";
    if (contact && !/^[\d\-+() ]{7,15}$/.test(contact)) e.contact = "Enter a valid phone number";
    if (facebook && !facebook.startsWith("http")) e.facebook = "Enter a full URL (starting with https://)";
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
        toastError("Missing information", "Please fill in all required fields before continuing.");
        return;
      }
      setErrors({});
      setStep(1);
    } else if (step === 1) {
      setErrors({});
      setStep(2);
    }
  };

  const handleLocationPick = () => {
    if (!navigator.geolocation) {
      toastError("Location unavailable", "Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
        toastSuccess("Location set", "Your location will be used for the map pin.");
      },
      () => {
        setLocating(false);
        toastError("Could not get location", "Enable location services and try again.");
      },
      { timeout: 10000 },
    );
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
      toastError("Please fix errors", "Check the highlighted fields before submitting.");
      return;
    }

    setLoading(true);
    toastInfo("Submitting your listing…", "An admin will review it shortly.");

    try {
      let photoUrl: string | null = null;
      if (photo) {
        toastInfo("Uploading photo…", "Compressing and uploading your store image.");
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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          toastError("Daily limit reached", "Maximum 2 submissions per day. Please try again tomorrow.");
        } else {
          throw new Error(data.error || "Submission failed");
        }
        setLoading(false);
        return;
      }

      toastSuccess("Listing submitted!", "Your business is now pending review by an admin. We'll notify you once it's approved.");
      setSubmitted(true);
    } catch (err: any) {
      toastError("Submission failed", err.message || "Please check your connection and try again.");
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
          <CardTitle className="text-xl">Listing Submitted!</CardTitle>
          <CardDescription className="text-sm">
            Your business has been submitted for review. An admin will verify and approve it before it appears on the
            directory. This usually takes 1-2 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-xl border text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">What happens next?</p>
            <ol className="text-left space-y-1 list-decimal list-inside text-sm">
              <li>An admin reviews your submission</li>
              <li>If approved, it appears in the Assistance Directory</li>
              <li>You can contact us to update your listing anytime</li>
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
              {i < step ? "✓" : i + 1} <span className="hidden sm:inline ml-1">{s}</span>
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
                {step === 0 ? "Tell us about your business" : "Contact & services"}
              </CardTitle>
              <CardDescription>
                {step === 0
                  ? "Basic information about your business. Fields marked * are required."
                  : "How can the community reach you? What services do you offer?"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Business Name <span className="text-destructive">*</span></Label>
                <Input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AquaPure Refilling Station"
                  className={cn("h-10", errors.name && "border-destructive")} />
                {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Category <span className="text-destructive">*</span></Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className={cn("h-10", errors.category && "border-destructive")}>
                    <SelectValue placeholder="Select your business type" />
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
                <Label>Address <span className="text-destructive">*</span></Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Block 1, Lot 2, Muzon Road"
                  className={cn("h-10", errors.address && "border-destructive")} />
                {errors.address && <p className="text-[11px] text-destructive">{errors.address}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Barangay <span className="text-destructive">*</span></Label>
                <Select value={barangay} onValueChange={setBarangay}>
                  <SelectTrigger className={cn("h-10", errors.barangay && "border-destructive")}>
                    <SelectValue placeholder="Select barangay" />
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
                <Label>Map Location <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Button type="button" variant="outline" onClick={handleLocationPick} disabled={locating}
                  className={cn("w-full h-10 justify-start gap-2", lat && lng ? "border-emerald-500/50 text-emerald-600" : "")}>
                  <MapPin className={cn("h-4 w-4", locating && "animate-pulse")} />
                  {locating ? "Getting location…" :
                    lat && lng ? `📍 Pin set (${lat.toFixed(4)}, ${lng.toFixed(4)})` : "📍 Set location for map pin"}
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  Share your approximate location so people can find you on the map. Your exact address stays private.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Phone Number <span className="text-muted-foreground text-xs">(recommended)</span></Label>
                <Input value={contact} onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. 0917-123-4567"
                  className={cn("h-10", errors.contact && "border-destructive")} />
                {errors.contact && <p className="text-[11px] text-destructive">{errors.contact}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Facebook Page URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input value={facebook} onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  className={cn("h-10", errors.facebook && "border-destructive")} />
                {errors.facebook && <p className="text-[11px] text-destructive">{errors.facebook}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Delivery Available?</Label>
                <Select value={deliveryAvailable} onValueChange={setDeliveryAvailable}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes — we deliver</SelectItem>
                    <SelectItem value="no">No — walk-in only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Store Photo <span className="text-muted-foreground text-xs">(optional)</span></Label>
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
                          setPhotoPreview(URL.createObjectURL(file));
                        } else {
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
                <Label>Operating Hours</Label>
                <Input value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)}
                  placeholder="e.g. 6:00 AM — 8:00 PM daily" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Coverage Area</Label>
                <Input value={coverageArea} onChange={(e) => setCoverageArea(e.target.value)}
                  placeholder="e.g. Muzon, Graceville, Minuyan" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Estimated Fee <span className="text-muted-foreground text-xs">(for tanker/delivery services)</span></Label>
                <Input value={estimatedFee} onChange={(e) => setEstimatedFee(e.target.value)}
                  placeholder="e.g. ₱500 — ₱1,000" className="h-10" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 border">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Review Listing</h4>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Name</span><span className="font-medium">{name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Category</span><span className="font-medium">{BUSINESS_CATEGORIES.find((c) => c.value === category)?.label}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Address</span><span className="font-medium">{address}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Barangay</span><span className="font-medium">{barangay}</span></div>
                {contact && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Contact</span><span className="font-medium">{contact}</span></div>}
                {operatingHours && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Hours</span><span className="font-medium">{operatingHours}</span></div>}
                {deliveryAvailable && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Delivery</span><span className="font-medium">{deliveryAvailable === "yes" ? "Yes" : "No"}</span></div>}
              </div>
              {photoPreview && (
                <div className="rounded-lg overflow-hidden bg-muted border">
                  <img src={photoPreview} alt="Store preview" className="w-full h-36 object-cover" />
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center">An admin will review and approve your listing.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        {step < 2 ? (
          <Button onClick={handleNext} disabled={!canNext()} className="gap-1.5">
            Continue <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="min-w-[140px] gap-1.5">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Listing"}
          </Button>
        )}
      </div>
    </div>
  );
}
