'use client';

import { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import JobCard from './components/JobCard';
import JobFilters from './components/JobFilters';
import { Job, JobSearchFilters } from './types/job';

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<JobSearchFilters>({
    categories: ['DevSecOps', 'DevOps', 'SRE'],
    regions: ['APAC', 'EU']
  });

  // Load jobs
  useEffect(() => {
    loadJobs();
  }, [filters]);

  async function loadJobs() {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs/manage?' + new URLSearchParams({
        categories: filters.categories?.join(',') || '',
        regions: filters.regions?.join(',') || '',
        bookmarked: filters.isBookmarked ? 'true' : '',
        ignored: filters.isIgnored ? 'true' : ''
      }));
      const data = await response.json();
      if (data.success) {
        setJobs(data.data.jobs);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  // Search jobs
  async function handleSearch(query: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setJobs(data.data.jobs);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to search jobs');
    } finally {
      setLoading(false);
    }
  }

  // Job actions
  async function handleJobAction(jobId: string, action: string) {
    try {
      const response = await fetch('/api/jobs/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, jobId })
      });
      const data = await response.json();
      if (data.success) {
        // Update job in list
        setJobs(jobs.map(job => 
          job.id === jobId ? data.data : job
        ));
      }
    } catch (error) {
      console.error('Failed to perform job action:', error);
    }
  }

  return (
    <div>
      <Header
        onSearch={handleSearch}
        onFilter={() => setShowFilters(true)}
      />

      {/* Filters modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-lg w-full mx-4">
            <JobFilters
              onApplyFilters={setFilters}
              onClose={() => setShowFilters(false)}
              initialFilters={filters}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="mt-16">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No jobs found. Try adjusting your filters or search for new jobs.
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onBookmark={(id) => handleJobAction(id, 'bookmark')}
                onIgnore={(id) => handleJobAction(id, 'ignore')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}