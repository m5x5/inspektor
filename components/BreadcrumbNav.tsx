"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MAX_SEGMENT_LENGTH = 16;
// Collapse middle segments when there are more than this many total segments.
// With 5+ segments: show first + … (middle) + last 2.
const COLLAPSE_THRESHOLD = 4;

type Segment = { name: string; path: string };

function truncate(name: string): string {
  if (name.length <= MAX_SEGMENT_LENGTH) return name;
  return `${name.slice(0, MAX_SEGMENT_LENGTH - 1)}…`;
}

function SegmentLink({ segment }: { segment: Segment }) {
  const display = truncate(segment.name);
  const link = (
    <BreadcrumbLink asChild>
      <Link href={`/?path=${encodeURIComponent(segment.path)}`}>{display}</Link>
    </BreadcrumbLink>
  );
  if (display === segment.name) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="bottom">{segment.name}</TooltipContent>
    </Tooltip>
  );
}

type BreadcrumbNavProps = { currentDirPath: string };

export function BreadcrumbNav({ currentDirPath }: BreadcrumbNavProps) {
  const parts = currentDirPath.split("/").filter(Boolean);
  const segments: Segment[] = [];
  let acc = "";
  for (const name of parts) {
    acc += `${name}/`;
    segments.push({ name, path: acc });
  }

  const shouldCollapse = segments.length > COLLAPSE_THRESHOLD;
  const visibleStart = shouldCollapse ? segments.slice(0, 1) : segments;
  const collapsed = shouldCollapse ? segments.slice(1, -2) : [];
  const visibleEnd = shouldCollapse ? segments.slice(-2) : [];

  return (
    <TooltipProvider>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="flex items-center gap-1.5">
                <Home className="size-4" />
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {visibleStart.map((seg) => (
            <Fragment key={seg.path}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <SegmentLink segment={seg} />
              </BreadcrumbItem>
            </Fragment>
          ))}

          {collapsed.length > 0 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger aria-label="Show collapsed path segments">
                    <BreadcrumbEllipsis />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {collapsed.map((seg) => (
                      <DropdownMenuItem key={seg.path} asChild>
                        <Link href={`/?path=${encodeURIComponent(seg.path)}`}>
                          {seg.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            </>
          )}

          {visibleEnd.map((seg) => (
            <Fragment key={seg.path}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <SegmentLink segment={seg} />
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </TooltipProvider>
  );
}
