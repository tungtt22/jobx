import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');

interface PlatformAuth {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

interface AuthData {
  linkedin?: PlatformAuth;
  upwork?: PlatformAuth;
  freelancer?: PlatformAuth;
}

export class AuthStorage {
  private authData: AuthData = {};
  private initialized = false;

  private async initialize() {
    if (!this.initialized) {
      try {
        const data = await fs.readFile(AUTH_FILE, 'utf-8');
        this.authData = JSON.parse(data);
      } catch {
        this.authData = {};
      }
      this.initialized = true;
    }
  }

  private async save() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(AUTH_FILE, JSON.stringify(this.authData, null, 2));
  }

  async getToken(platform: keyof AuthData): Promise<string | null> {
    await this.initialize();
    const auth = this.authData[platform];
    
    if (!auth) return null;

    // Check if token is expired
    if (auth.expiresAt && new Date(auth.expiresAt) < new Date()) {
      return null;
    }

    return auth.accessToken;
  }

  async setToken(
    platform: keyof AuthData,
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ) {
    await this.initialize();

    this.authData[platform] = {
      accessToken,
      refreshToken,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined
    };

    await this.save();
  }

  async removeToken(platform: keyof AuthData) {
    await this.initialize();
    delete this.authData[platform];
    await this.save();
  }

  async hasValidToken(platform: keyof AuthData): Promise<boolean> {
    const token = await this.getToken(platform);
    return token !== null;
  }
}
