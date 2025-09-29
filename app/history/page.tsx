'use client';

import { useState, useEffect } from 'react';
import { Job } from '@/app/types/job';
import JobCard from '@/app/components/JobCard';

export default function HistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs/history');
      const data = await response.json();
      if (data.success) {
        setJobs(data.data.jobs);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to load job history');
    } finally {
      setLoading(false);
    }
  }

  // Group jobs by status
  const groupedJobs = jobs.reduce((groups, job) => {
    const status = job.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(job);
    return groups;
  }, {} as Record<string, Job[]>);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;
  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No job history found.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Job History</h1>

      {/* Applied Jobs */}
      {groupedJobs['applied'] && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Applied Jobs
          </h2>
          <div className="space-y-4">
            {groupedJobs['applied'].map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onBookmark={() => {}}
                onIgnore={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expired Jobs */}
      {groupedJobs['expired'] && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Expired Jobs
          </h2>
          <div className="space-y-4">
            {groupedJobs['expired'].map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onBookmark={() => {}}
                onIgnore={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ignored Jobs */}
      {groupedJobs['ignored'] && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ignored Jobs
          </h2>
          <div className="space-y-4">
            {groupedJobs['ignored'].map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onBookmark={() => {}}
                onIgnore={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
