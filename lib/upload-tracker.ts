const STORAGE_KEY = "inspektor-uploads";
const MAX_RECORDS = 200;

export type UploadRecord = {
  path: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: number;
  folder: string; // top-level folder (app)
};

function getDeviceId(): string {
  const key = "inspektor-device-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function getDeviceName(): string {
  return localStorage.getItem("inspektor-device-name") || navigator.userAgent.split(/[();]/)[1]?.trim() || "This device";
}

export function setDeviceName(name: string) {
  localStorage.setItem("inspektor-device-name", name);
}

function storageKey(): string {
  return `${STORAGE_KEY}:${getDeviceId()}`;
}

export function recordUploads(files: { name: string; path: string; type: string; size: number }[]) {
  const existing = getUploads();
  const now = Date.now();
  const newRecords: UploadRecord[] = files.map((f) => {
    // Extract top-level folder from path like "photos/vacation/img.jpg" -> "photos"
    const parts = f.path.replace(/^\//, "").split("/");
    const folder = parts.length > 1 ? parts[0] : "/";
    return {
      path: f.path,
      name: f.name,
      type: f.type,
      size: f.size,
      uploadedAt: now,
      folder,
    };
  });
  const combined = [...newRecords, ...existing].slice(0, MAX_RECORDS);
  try {
    localStorage.setItem(storageKey(), JSON.stringify(combined));
  } catch {
    // storage full — trim more aggressively
    localStorage.setItem(storageKey(), JSON.stringify(combined.slice(0, 50)));
  }
}

export function getUploads(): UploadRecord[] {
  try {
    const raw = localStorage.getItem(storageKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getUploadsGroupedByFolder(): Record<string, UploadRecord[]> {
  const uploads = getUploads();
  const grouped: Record<string, UploadRecord[]> = {};
  for (const u of uploads) {
    if (!grouped[u.folder]) grouped[u.folder] = [];
    grouped[u.folder].push(u);
  }
  return grouped;
}

export function clearUploads() {
  localStorage.removeItem(storageKey());
}
