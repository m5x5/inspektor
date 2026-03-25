"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CopyIcon, CheckIcon, QrCodeIcon, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  fileName: string;
};

export function ShareDialog({ open, onOpenChange, url, fileName }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="truncate">Share &ldquo;{fileName}&rdquo;</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-lg border bg-white p-3">
            <QRCodeSVG value={url} size={180} />
          </div>
          <div className="flex w-full items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
            <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 min-w-0 truncate text-sm font-mono">{url}</span>
            <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={copyLink}>
              {copied ? <CheckIcon className="size-4 text-green-600" /> : <CopyIcon className="size-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
