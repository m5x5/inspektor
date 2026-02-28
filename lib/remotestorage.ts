import RemoteStorage from 'remotestoragejs';

export interface StorageItem {
  name: string;
  type: string;
  isBinary: boolean;
  isFolder: boolean;
  size: number | null;
  path: string;
  etag: string | null;
}

export class RemoteStorageService {
  private rs: RemoteStorage;
  private client: any;

  constructor() {
    this.rs = new RemoteStorage({
      cache: true // Enable caching for persistence
      // Disable change events to prevent constant updates
      // changeEvents: {
      //   local: false,
      //   window: false,
      //   remote: false,
      //   conflict: false
      // }
    });

    this.rs.access.claim('*', 'rw');
    this.client = this.rs.scope('/');
  }

  getRemoteStorage() {
    return this.rs;
  }

  getClient() {
    return this.client;
  }

  async fetchListing(path: string): Promise<StorageItem[]> {
    const items: StorageItem[] = [];

    let listing: Record<string, { 'Content-Type'?: string; 'Content-Length'?: number; 'ETag'?: string }> | undefined;
    try {
      listing = await this.client.getListing(path);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const is404 = typeof msg === 'string' && (msg.includes('404') || msg.includes('Not Found'));
      console.warn('[RemoteStorage] fetchListing failed:', is404 ? 'path not found (404)' : msg);
      return [];
    }

    if (!listing || typeof listing !== 'object' || Object.keys(listing).length === 0) {
      return [];
    }

    Object.keys(listing).forEach(name => {
      // Skip the .folder marker file we use to create empty folders
      if (name === ".folder") return;
      const item = listing[name];
      // Folders are indicated by trailing slash in the listing key, not by missing Content-Type
      const isFolder = name.endsWith('/');
      let type: string;
      let isBinary = false;

      if (isFolder) {
        type = 'folder';
      } else {
        const rawType = item['Content-Type'] || 'application/octet-stream';
        isBinary = !!rawType.match(/charset=binary/);
        type = this.simpleContentType(rawType);
      }

      items.push({
        name,
        type,
        isBinary,
        isFolder,
        size: item['Content-Length'] || null,
        path: path + name,
        etag: item['ETag'] || null
      });
    });

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getFile(path: string) {
    return await this.client.getFile(path);
  }

  async storeFile(path: string, mimeType: string, content: string | ArrayBuffer) {
    return await this.client.storeFile(mimeType, path, content);
  }

  async remove(path: string) {
    return await this.client.remove(path);
  }

  getItemURL(path: string): string | null {
    try {
      if (typeof (this.client as any).getItemURL === "function") {
        return (this.client as any).getItemURL(path);
      }
    } catch {
      // ignore
    }
    return null;
  }

  async createRootFolder(folderName: string): Promise<string> {
    const safe = folderName.replace(/\//g, "");
    if (!safe) throw new Error("Folder name cannot be empty");
    await this.storeFile(`${safe}/.folder`, "text/plain", "");
    return safe;
  }

  disconnect() {
    this.rs.disconnect();
  }

  private simpleContentType(contentType: string): string {
    if (!contentType) return 'unknown';

    const match = contentType.match(/^([^;]+)/);
    return match ? match[1] : contentType;
  }
}

export default RemoteStorageService;
