"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle, Shield, Info, Mail, ExternalLink,
  BookOpen, ClipboardList, Eye, ThumbsUp, Search, CheckCircle2, Clock, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ww-disclaim-accepted";

export function DisclaimPopover() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="p-5 sm:p-6 space-y-5">

          {/* ── Disclaimer Header ── */}
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-base font-bold">Before You Continue</h2>
            <p className="text-xs text-muted-foreground">Important notices about this platform</p>
          </div>

          {/* ── Disclaimer Content ── */}
          <div className="space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <NoticeBox icon={Shield} variant="amber">
              <strong>Independent platform.</strong> WaterWatch SJDM is not affiliated with PrimeWater, Metro Pacific Bulacan Water, the City Government of San Jose del Monte, or any government agency.
            </NoticeBox>
            <NoticeBox icon={Mail} variant="blue">
              <strong>Reports are forwarded.</strong> Verified reports are manually sent by the system admin to water provider email addresses and contact numbers. This is not an official reporting channel.
            </NoticeBox>
            <NoticeBox icon={Info} variant="muted">
              <strong>Community-sourced.</strong> All reports are submitted by community members. Reports undergo admin review before appearing on the public map to filter out unverified or false claims.
            </NoticeBox>
          </div>

          {/* ── Divider ── */}
          <div className="text-center space-y-1 pt-2">
            <div className="w-10 h-10 rounded-xl bg-water-muted flex items-center justify-center mx-auto">
              <BookOpen className="h-5 w-5 text-water" />
            </div>
            <h2 className="text-base font-bold">How It Works</h2>
            <p className="text-xs text-muted-foreground">Everything you need to know in one place</p>
          </div>

          {/* ── How-To Steps ── */}
          <div className="space-y-4">
            <Step icon={ClipboardList} title="Submit a Report" color="text-water bg-water-muted">
              Select your barangay, issue type, and water provider. <strong>Share your GPS location</strong> (required). Add a description, photo, and when it started. <strong>No account needed</strong> — completely anonymous.
            </Step>

            <Step icon={Eye} title="Admin Review" color="text-amber-600 bg-amber-50 dark:bg-amber-950/20">
              An admin reviews your report. If <strong>approved</strong>, it appears on the public Water Map. If <strong>denied</strong>, you'll see the reason. This keeps the map free of spam and false claims.
            </Step>

            <Step icon={ThumbsUp} title="Community Confirmation" color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">
              Other residents click <strong>"I have this too"</strong> to confirm the issue. More confirmations = higher confidence the problem is real and widespread. No account required to confirm.
            </Step>

            <Step icon={Search} title="Track Your Report" color="text-blue-600 bg-blue-50 dark:bg-blue-950/20">
              Save your <strong>Report ID</strong> (e.g. SJDM-WATER-00042) to check its status anytime. Visit the Submit Report page and enter it in the tracker. You'll see the full progress: <strong>Submitted → Under Review → Approved → Resolved → Inactive</strong>.
            </Step>

            <Step icon={CheckCircle2} title="Mark as Resolved" color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">
              When water is back, visit your report and click <strong>"Mark as Resolved"</strong>. This tells the community the issue is fixed. Limited to 3 resolves per hour.
            </Step>

            <Step icon={Clock} title="Inactive After 7 Days" color="text-purple-600 bg-purple-50 dark:bg-purple-950/20">
              Reports with <strong>no new confirmations or updates for 7 days</strong> automatically become <strong>inactive</strong>. They stay visible but are marked inactive on the map.
            </Step>

            <Step icon={RefreshCw} title="Reactivation" color="text-orange-600 bg-orange-50 dark:bg-orange-950/20">
              If an inactive or resolved issue comes back: <strong>submit a new report at the same location</strong> and it auto-reactivates. Or enter your old Report ID on the track page. Limited to once per 24 hours.
            </Step>

            <Step icon={Shield} title="Privacy & Limits" color="text-gray-600 bg-gray-50 dark:bg-gray-800">
              Your exact address is <strong>never shared</strong> — only an approximate map pin. Rate limits: 3 reports/hour, 10 confirmations/hour. This is an independent community platform.
            </Step>
          </div>

          {/* ── Dismiss ── */}
          <div className="space-y-2.5 pt-1">
            <Button onClick={dismiss} className="w-full h-11 text-sm">
              I Understand — Don't Show Again
            </Button>
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="w-full h-11 text-xs text-muted-foreground hover:text-foreground rounded-lg border transition-colors"
            >
              Keep Reminding Me
            </button>
            <p className="text-center">
              <Link
                href="/disclaimer"
                onClick={dismiss}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                Read full disclaimer <ExternalLink className="h-3 w-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── small helpers ── */

function NoticeBox({ icon: Icon, variant, children }: {
  icon: typeof Shield;
  variant: "amber" | "blue" | "muted";
  children: React.ReactNode;
}) {
  const colors = {
    amber: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
    blue: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
    muted: "bg-muted/60 border",
  };
  const iconColors = {
    amber: "text-amber-600 dark:text-amber-400",
    blue: "text-blue-600 dark:text-blue-400",
    muted: "text-muted-foreground",
  };
  return (
    <div className={cn("flex items-start gap-2.5 p-2.5 border rounded-lg", colors[variant])}>
      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", iconColors[variant])} />
      <p className={variant !== "muted" ? colors[variant] : ""}>{children}</p>
    </div>
  );
}

function Step({ icon: Icon, title, color, children }: {
  icon: typeof BookOpen;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 text-xs text-muted-foreground leading-relaxed">
        <h4 className="text-sm font-semibold text-foreground mb-0.5">{title}</h4>
        {children}
      </div>
    </div>
  );
}
