"use client";

import { useRef, useEffect, useState } from "react";
import { PlusIcon, FolderPlusIcon, FilePlusIcon, UploadIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type CreateFABAction = "folder" | "file" | "upload";

type ActionConfig = {
  id: CreateFABAction;
  label: string;
  icon: React.ReactNode;
};

const ACTIONS: ActionConfig[] = [
  { id: "folder", label: "New folder", icon: <FolderPlusIcon className="size-5" /> },
  { id: "file", label: "New file", icon: <FilePlusIcon className="size-5" /> },
  { id: "upload", label: "Upload", icon: <UploadIcon className="size-5" /> },
];

type CreateFABProps = {
  onAction: (action: CreateFABAction) => void;
  className?: string;
};

export function CreateFAB({ onAction, className }: CreateFABProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleAction = (action: CreateFABAction) => {
    onAction(action);
    setOpen(false);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={containerRef}
        className={cn(
          "fixed z-40 flex flex-col items-center gap-3",
          "bottom-24 right-4 md:bottom-8 md:right-8",
          className
        )}
        aria-expanded={open}
      >
        {/* Action buttons – stacked above main FAB, appear when open */}
        <div
          className={cn(
            "flex flex-col-reverse items-center gap-3",
            open ? "pointer-events-auto" : "pointer-events-none"
          )}
        >
          {ACTIONS.map((action, index) => (
            <div
              key={action.id}
              className="flex items-center gap-2 rounded-full bg-background shadow-lg ring-1 ring-border transition-all duration-200 ease-out"
              style={{
                transform: open ? "scale(1) translateY(0)" : "scale(0.4) translateY(12px)",
                opacity: open ? 1 : 0,
                transition: "transform 0.2s ease-out, opacity 0.2s ease-out",
                transitionDelay: open ? `${index * 50}ms` : "0ms",
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleAction(action.id)}
                    className="flex size-12 items-center justify-center rounded-full text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={action.label}
                  >
                    {action.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={12} className="rounded-lg">
                  {action.label}
                </TooltipContent>
              </Tooltip>
              <span className="hidden pr-4 text-sm font-medium text-foreground sm:inline">{action.label}</span>
            </div>
          ))}
        </div>

        {/* Main FAB */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            open && "rotate-45"
          )}
          aria-label={open ? "Close menu" : "Create or upload"}
        >
          <PlusIcon className="size-7" />
        </button>
      </div>
    </TooltipProvider>
  );
}
