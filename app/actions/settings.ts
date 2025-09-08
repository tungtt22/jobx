'use server';

import fs from 'fs/promises';
import path from 'path';
import { Settings } from '@/app/types/settings';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

export async function loadSettings(): Promise<Settings> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {
      tokens: {},
      defaultFilters: {
        categories: ['DevSecOps', 'DevOps', 'SRE'],
        regions: ['APAC', 'EU']
      },
      notifications: {
        desktop: true,
        email: false
      },
      jobPreferences: {
        currency: 'USD',
        contractTypes: ['remote', 'contract'],
        remoteOnly: true
      }
    };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}
