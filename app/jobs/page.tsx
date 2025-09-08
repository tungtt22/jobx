'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/app/lib/api-client';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
  });

  // Fetch jobs
  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      const response = await apiClient.jobs.getAll();
      setJobs(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  // Create new job
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await apiClient.jobs.create(newJob);
      setJobs([...jobs, response.data]);
      setNewJob({ title: '', company: '', location: '', description: '' });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    }
  }

  // Delete job
  async function handleDelete(id: string) {
    try {
      await apiClient.jobs.delete(id);
      setJobs(jobs.filter(job => job.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Jobs</h1>

      {/* Create Job Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Job Title"
          value={newJob.title}
          onChange={e => setNewJob({ ...newJob, title: e.target.value })}
          className="block w-full border rounded p-2"
        />
        <input
          type="text"
          placeholder="Company"
          value={newJob.company}
          onChange={e => setNewJob({ ...newJob, company: e.target.value })}
          className="block w-full border rounded p-2"
        />
        <input
          type="text"
          placeholder="Location"
          value={newJob.location}
          onChange={e => setNewJob({ ...newJob, location: e.target.value })}
          className="block w-full border rounded p-2"
        />
        <textarea
          placeholder="Description"
          value={newJob.description}
          onChange={e => setNewJob({ ...newJob, description: e.target.value })}
          className="block w-full border rounded p-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Job
        </button>
      </form>

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.map(job => (
          <div key={job.id} className="border rounded p-4">
            <h2 className="text-xl font-semibold">{job.title}</h2>
            <p className="text-gray-600">{job.company} - {job.location}</p>
            <p className="mt-2">{job.description}</p>
            <button
              onClick={() => handleDelete(job.id)}
              className="mt-2 text-red-500 hover:text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
