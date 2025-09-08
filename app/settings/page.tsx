'use client';

import { useState, useEffect } from 'react';
import { JobCategory, JobRegion } from '@/app/types/job';
import { FiSave, FiAlertCircle, FiCheckCircle, FiBell } from 'react-icons/fi';

interface Settings {
  tokens: {
    linkedin?: string;
    upwork?: string;
    indeed?: string;
    glassdoor?: string;
  };
  defaultFilters: {
    categories: JobCategory[];
    regions: JobRegion[];
  };
  notifications: {
    desktop: boolean;
    email: boolean;
    emailAddress?: string;
  };
  jobPreferences: {
    minSalary?: number;
    currency: string;
    contractTypes: string[];
    remoteOnly: boolean;
  };
}

const DEFAULT_SETTINGS: Settings = {
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

const ALL_CATEGORIES: JobCategory[] = ['DevSecOps', 'DevOps', 'SRE', 'Cloud', 'Other'];
const ALL_REGIONS: JobRegion[] = ['APAC', 'EU', 'NA', 'OTHER'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'AUD'];
const CONTRACT_TYPES = ['remote', 'contract', 'permanent', 'hybrid', 'onsite'];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load settings');
      }
    } catch (error) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaveStatus('saving');
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      if (data.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setSaveStatus('error');
      setError('Failed to save settings');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        {error && (
          <div className="flex items-center text-red-600">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* API Tokens */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Tokens</h2>
          <div className="space-y-4">
            {['linkedin', 'upwork', 'indeed', 'glassdoor'].map((platform) => (
              <div key={platform}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {platform} API Token
                </label>
                <input
                  type="password"
                  value={settings.tokens[platform as keyof typeof settings.tokens] || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      tokens: { ...settings.tokens, [platform]: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Enter your ${platform} API token`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Job Preferences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Job Preferences
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Salary
              </label>
              <div className="flex space-x-4">
                <input
                  type="number"
                  value={settings.jobPreferences.minSalary || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      jobPreferences: {
                        ...settings.jobPreferences,
                        minSalary: parseInt(e.target.value) || undefined
                      }
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter minimum salary"
                />
                <select
                  value={settings.jobPreferences.currency}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      jobPreferences: {
                        ...settings.jobPreferences,
                        currency: e.target.value
                      }
                    })
                  }
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Types
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CONTRACT_TYPES.map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.jobPreferences.contractTypes.includes(type)}
                      onChange={(e) => {
                        const types = e.target.checked
                          ? [...settings.jobPreferences.contractTypes, type]
                          : settings.jobPreferences.contractTypes.filter(
                              (t) => t !== type
                            );
                        setSettings({
                          ...settings,
                          jobPreferences: {
                            ...settings.jobPreferences,
                            contractTypes: types
                          }
                        });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 capitalize">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.jobPreferences.remoteOnly}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      jobPreferences: {
                        ...settings.jobPreferences,
                        remoteOnly: e.target.checked
                      }
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Show remote jobs only
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <FiBell className="w-5 h-5 mr-2 text-gray-900" />
            <h2 className="text-lg font-semibold text-gray-900">
              Notifications
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.desktop}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        desktop: e.target.checked
                      }
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Enable desktop notifications
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        email: e.target.checked
                      }
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Enable email notifications
                </span>
              </label>
            </div>

            {settings.notifications.email && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={settings.notifications.emailAddress || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        emailAddress: e.target.value
                      }
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter your email address"
                />
              </div>
            )}
          </div>
        </div>

        {/* Default Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Default Filters
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Categories
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_CATEGORIES.map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.defaultFilters.categories.includes(category)}
                      onChange={(e) => {
                        const categories = e.target.checked
                          ? [...settings.defaultFilters.categories, category]
                          : settings.defaultFilters.categories.filter(
                              (c) => c !== category
                            );
                        setSettings({
                          ...settings,
                          defaultFilters: {
                            ...settings.defaultFilters,
                            categories
                          }
                        });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Regions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_REGIONS.map((region) => (
                  <label key={region} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.defaultFilters.regions.includes(region)}
                      onChange={(e) => {
                        const regions = e.target.checked
                          ? [...settings.defaultFilters.regions, region]
                          : settings.defaultFilters.regions.filter(
                              (r) => r !== region
                            );
                        setSettings({
                          ...settings,
                          defaultFilters: {
                            ...settings.defaultFilters,
                            regions
                          }
                        });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{region}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end space-x-3">
          {saveStatus === 'saved' && (
            <div className="flex items-center text-green-600">
              <FiCheckCircle className="w-5 h-5 mr-2" />
              Settings saved!
            </div>
          )}
          <button
            type="submit"
            disabled={saveStatus === 'saving'}
            className={`flex items-center px-4 py-2 rounded-md ${
              saveStatus === 'saving'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <FiSave className="w-5 h-5 mr-2" />
            {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}