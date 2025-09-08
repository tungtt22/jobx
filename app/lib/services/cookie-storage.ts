import fs from 'fs/promises';
import path from 'path';

const COOKIE_FILE = path.join(process.cwd(), 'data', 'cookies.json');

interface CookieStore {
  [source: string]: {
    cookies: string[];
    expiresAt: number;
  };
}

export class CookieStorage {
  private store: CookieStore = {};

  async load() {
    try {
      const data = await fs.readFile(COOKIE_FILE, 'utf-8');
      this.store = JSON.parse(data);
      
      // Clean expired cookies
      const now = Date.now();
      Object.entries(this.store).forEach(([source, data]) => {
        if (data.expiresAt < now) {
          delete this.store[source];
        }
      });
    } catch {
      this.store = {};
    }
  }

  async save() {
    await fs.mkdir(path.dirname(COOKIE_FILE), { recursive: true });
    await fs.writeFile(COOKIE_FILE, JSON.stringify(this.store, null, 2));
  }

  getCookies(source: string): string[] {
    return this.store[source]?.cookies || [];
  }

  setCookies(source: string, cookies: string[]) {
    this.store[source] = {
      cookies,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };
  }
}
