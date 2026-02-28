"use client";

import { Folder, FileText, FileJson } from "lucide-react";

type ItemIconProps = { type: string };

export function ItemIcon({ type }: ItemIconProps) {
  const isFolder = type === "folder";
  const isJson = /json/i.test(type);

  if (isFolder) {
    return <Folder className="size-4 shrink-0" aria-hidden />;
  }
  if (isJson) {
    return <FileJson className="size-4 shrink-0" aria-hidden />;
  }
  return <FileText className="size-4 shrink-0" aria-hidden />;
}
