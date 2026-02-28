"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPromptContextType {
  canInstall: boolean;
  install: () => Promise<void>;
  dismiss: () => void;
  dismissed: boolean;
}

const InstallPromptContext = createContext<InstallPromptContextType>({
  canInstall: false,
  install: async () => {},
  dismiss: () => {},
  dismissed: false,
});

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (sessionStorage.getItem("pwa-install-dismissed")) {
      setDismissed(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    sessionStorage.setItem("pwa-install-dismissed", "1");
    setDismissed(true);
  }, []);

  return (
    <InstallPromptContext.Provider
      value={{ canInstall: !!deferredPrompt && !dismissed, install, dismiss, dismissed }}
    >
      {children}
    </InstallPromptContext.Provider>
  );
}

export function useInstallPrompt() {
  return useContext(InstallPromptContext);
}
