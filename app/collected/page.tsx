'use client';

import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiFilter } from 'react-icons/fi';
import { Job } from '@/app/types/job';
import { CollectionLog, CollectedJobs } from '@/app/actions/jobs';
import JobCard from '@/app/components/jobs/JobCard';

interface Stats {
  totalJobs: number;
  bySource: Record<string, number>;
  byCategory: Record<string, number>;
  byRegion: Record<string, number>;
}

export default function CollectedJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [log, setLog] = useState<CollectionLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sources: [] as string[],
    categories: [] as string[],
    regions: [] as string[],
    search: ''
  });

  useEffect(() => {
    loadJobs();
  }, [filters]);

  async function loadJobs() {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      filters.sources.forEach(s => params.append('source', s));
      filters.categories.forEach(c => params.append('category', c));
      filters.regions.forEach(r => params.append('region', r));
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/collector?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load jobs');
      }

      if (data.success) {
        setJobs(data.data.jobs);
        setStats(data.data.stats);
        setLog(data.data.collectionLog);
      } else {
        throw new Error(data.error || 'Failed to load jobs');
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  async function handleCollect() {
    try {
      setCollecting(true);
      setError(null);

      const response = await fetch('/api/collector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to collect jobs');
      }

      if (data.success) {
        alert(`Successfully collected ${data.data.newJobs} new jobs!`);
        await loadJobs();
      } else {
        throw new Error(data.error || 'Failed to collect jobs');
      }
    } catch (error) {
      console.error('Failed to collect jobs:', error);
      setError(error instanceof Error ? error.message : 'Failed to collect jobs');
    } finally {
      setCollecting(false);
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
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collected Jobs</h1>
          <p className="text-gray-600 mt-1">
            Last updated: {log?.lastRun ? new Date(log.lastRun).toLocaleString() : 'Never'}
          </p>
          {error && (
            <p className="text-red-600 mt-2">
              Error: {error}
            </p>
          )}
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 flex items-center text-gray-700 hover:text-gray-900"
          >
            <FiFilter className="w-5 h-5 mr-2" />
            Filters
          </button>
          <button
            onClick={handleCollect}
            disabled={collecting}
            className={`px-4 py-2 flex items-center rounded-md ${
              collecting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <FiRefreshCw className={`w-5 h-5 mr-2 ${collecting ? 'animate-spin' : ''}`} />
            {collecting ? 'Collecting...' : 'Collect Jobs'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">By Source</h3>
            <div className="space-y-2">
              {Object.entries(stats.bySource).map(([source, count]) => (
                <div key={source} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{source}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">By Category</h3>
            <div className="space-y-2">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <div key={category} className="flex justify-between">
                  <span className="text-gray-600">{category}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">By Region</h3>
            <div className="space-y-2">
              {Object.entries(stats.byRegion).map(([region, count]) => (
                <div key={region} className="flex justify-between">
                  <span className="text-gray-600">{region}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && stats && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Search jobs..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sources
              </label>
              <select
                multiple
                value={filters.sources}
                onChange={(e) => setFilters({
                  ...filters,
                  sources: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {Object.keys(stats.bySource).map(source => (
                  <option key={source} value={source}>
                    {source} ({stats.bySource[source]})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <select
                multiple
                value={filters.categories}
                onChange={(e) => setFilters({
                  ...filters,
                  categories: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {Object.keys(stats.byCategory).map(category => (
                  <option key={category} value={category}>
                    {category} ({stats.byCategory[category]})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Regions
              </label>
              <select
                multiple
                value={filters.regions}
                onChange={(e) => setFilters({
                  ...filters,
                  regions: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {Object.keys(stats.byRegion).map(region => (
                  <option key={region} value={region}>
                    {region} ({stats.byRegion[region]})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-6">
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No jobs found. Try adjusting your filters or collect new jobs.
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onBookmark={() => {}}
              onIgnore={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
}