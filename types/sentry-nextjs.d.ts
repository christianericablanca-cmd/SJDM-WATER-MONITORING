declare module "@sentry/nextjs" {
  import type { NextConfig } from "next";

  interface SentryOptions {
    dsn?: string;
    tracesSampleRate?: number;
    replaysSessionSampleRate?: number;
    replaysOnErrorSampleRate?: number;
    environment?: string;
    release?: string;
    [key: string]: unknown;
  }

  export function withSentryConfig(config: NextConfig, options?: Record<string, unknown>): NextConfig;
  export function init(options: SentryOptions): void;
  export function captureException(error: unknown, options?: Record<string, unknown>): string;
  export function captureMessage(message: string, options?: Record<string, unknown>): string;
  export function setTag(key: string, value: string): void;
  export function setExtra(key: string, value: unknown): void;
  export function setUser(user: { id?: string; email?: string; username?: string } | null): void;
  export function addBreadcrumb(breadcrumb: { message?: string; category?: string; level?: string; data?: Record<string, unknown> }): void;
  export function flush(timeout?: number): Promise<boolean>;
}
