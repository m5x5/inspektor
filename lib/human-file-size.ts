export function humanFileSize(fileSizeInBytes: number | null | undefined): string {
  if (fileSizeInBytes == null || fileSizeInBytes < 0) return "—";
  if (fileSizeInBytes < 1024) return `${fileSizeInBytes} bytes`;
  const units = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let i = -1;
  do {
    fileSizeInBytes = fileSizeInBytes / 1024;
    i++;
  } while (fileSizeInBytes >= 1024 && i < units.length - 1);
  return `${Math.max(fileSizeInBytes, 0.1).toFixed(1)} ${units[i]}`;
}
