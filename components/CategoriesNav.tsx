"use client";

import { useState, useCallback, memo } from "react";
import Link from "next/link";
import { ChevronRightIcon, ChevronDownIcon } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ItemIcon } from "@/components/ItemIcon";
import type { StorageItem } from "@/lib/remotestorage";

type SidebarFolderItemProps = {
  item: StorageItem;
  depth?: number;
  expandedPaths: Set<string>;
  childrenCache: Record<string, StorageItem[]>;
  onToggle: (path: string) => void;
  onLoadChildren: (path: string) => Promise<void>;
};

const SidebarFolderItem = memo(function SidebarFolderItem({
  item,
  depth = 0,
  expandedPaths,
  childrenCache,
  onToggle,
  onLoadChildren,
}: SidebarFolderItemProps) {
  const isExpanded = expandedPaths.has(item.path);
  const children = childrenCache[item.path];
  const displayName = item.name.replace(/\/$/, "");
  const href = item.path === "/" ? "/" : `/?path=${encodeURIComponent(item.path)}`;

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!children && isExpanded) {
        onToggle(item.path);
        return;
      }
      if (!children) {
        onLoadChildren(item.path).then(() => onToggle(item.path));
      } else {
        onToggle(item.path);
      }
    },
    [item.path, children, isExpanded, onToggle, onLoadChildren]
  );

  const childFolders = children?.filter((c) => c.isFolder) ?? [];
  const childFiles = children?.filter((c) => !c.isFolder) ?? [];

  return (
    <SidebarMenuItem style={{ paddingLeft: `${depth * 12}px` }}>
      <div className="flex items-center gap-0.5 min-h-8">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-sidebar-foreground/70"
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
        >
          {isExpanded ? (
            <ChevronDownIcon className="size-4" />
          ) : (
            <ChevronRightIcon className="size-4" />
          )}
        </Button>
        <SidebarMenuButton asChild className="flex-1 justify-start rounded-md px-2">
          <Link href={href}>{displayName}</Link>
        </SidebarMenuButton>
      </div>
      {isExpanded && children && (childFolders.length > 0 || childFiles.length > 0) && (
        <ul className="list-none p-0 m-0 space-y-0 pl-6">
          {childFolders.map((child) => (
            <SidebarFolderItem
              key={child.path}
              item={child}
              depth={depth + 1}
              expandedPaths={expandedPaths}
              childrenCache={childrenCache}
              onToggle={onToggle}
              onLoadChildren={onLoadChildren}
            />
          ))}
          {childFiles.map((file) => {
            const fileHref = `/inspect?path=${encodeURIComponent(file.path)}`;
            return (
              <SidebarMenuItem key={file.path} style={{ paddingLeft: `${(depth + 1) * 12}px` }}>
                <SidebarMenuButton asChild size="sm" className="flex-1 justify-start rounded-md px-2">
                  <Link href={fileHref} className="flex items-center gap-2">
                    <ItemIcon type={file.type} />
                    <span className="truncate">{file.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </ul>
      )}
    </SidebarMenuItem>
  );
});

type CategoriesNavProps = {
  categories: StorageItem[];
  fetchListing: (path: string) => Promise<StorageItem[]>;
};

export const CategoriesNav = memo(function CategoriesNav({ categories, fetchListing }: CategoriesNavProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [childrenCache, setChildrenCache] = useState<Record<string, StorageItem[]>>({});

  const handleToggle = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const loadChildren = useCallback(
    async (path: string) => {
      if (childrenCache[path]) return;
      const normalized = path.replace(/^\//, "");
      const items = await fetchListing(normalized);
      setChildrenCache((prev) => ({ ...prev, [path]: items }));
    },
    [fetchListing, childrenCache]
  );

  const folders = categories.filter((c) => c.isFolder);
  if (folders.length === 0) return null;

  return (
    <SidebarMenu className="flex-1 overflow-auto min-h-0">
      {folders.map((cat) => (
          <SidebarFolderItem
            key={cat.path}
            item={cat}
            expandedPaths={expandedPaths}
            childrenCache={childrenCache}
            onToggle={handleToggle}
            onLoadChildren={loadChildren}
          />
      ))}
    </SidebarMenu>
  );
});
