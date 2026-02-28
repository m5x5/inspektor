"use client";

import { DownloadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/contexts/InstallPromptContext";

export function InstallPrompt() {
  const { canInstall, install, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80">
      <div className="rounded-xl border bg-card text-card-foreground shadow-lg p-4 flex items-start gap-3">
        <div className="shrink-0 size-12 rounded-xl overflow-hidden bg-foreground flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="Inspektor" className="size-full" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">Install Inspektor</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            Add to your home screen for quick access, even offline.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="flex-1 h-8 text-xs" onClick={install}>
              <DownloadIcon className="size-3 mr-1" />
              Install
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs px-2" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="size-6 shrink-0 -mt-1 -mr-1"
          onClick={dismiss}
          aria-label="Dismiss"
        >
          <XIcon className="size-3" />
        </Button>
      </div>
    </div>
  );
}
