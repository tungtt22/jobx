'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Job } from '@/app/types/job';
import { FiBookmark, FiEyeOff, FiExternalLink, FiCheck } from 'react-icons/fi';

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJob();
  }, [id]);

  async function loadJob() {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/manage?id=${id}`);
      const data = await response.json();
      if (data.success) {
        setJob(data.data);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string) {
    try {
      const response = await fetch('/api/jobs/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, jobId: id })
      });
      const data = await response.json();
      if (data.success) {
        setJob(data.data);
      }
    } catch (error) {
      console.error('Failed to perform job action:', error);
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;
  if (!job) return <div className="text-center py-8">Job not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-lg text-gray-600 mt-1">{job.company}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>{job.location}</span>
              <span>•</span>
              <span>{job.source}</span>
              {job.salary && (
                <>
                  <span>•</span>
                  <span>{job.salary}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleAction('bookmark')}
              className={`p-2 rounded-full hover:bg-gray-100 ${
                job.metadata.isBookmarked ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <FiBookmark className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleAction('ignore')}
              className={`p-2 rounded-full hover:bg-gray-100 ${
                job.metadata.isIgnored ? 'text-red-600' : 'text-gray-400'
              }`}
            >
              <FiEyeOff className="w-5 h-5" />
            </button>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
            >
              <FiExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Skills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {job.skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Apply button */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Posted {new Date(job.postedAt).toLocaleDateString()}
          </div>
          <button
            onClick={() => handleAction('apply')}
            disabled={job.status === 'applied'}
            className={`px-6 py-2 rounded-lg flex items-center space-x-2 ${
              job.status === 'applied'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {job.status === 'applied' ? (
              <>
                <FiCheck className="w-5 h-5" />
                <span>Applied</span>
              </>
            ) : (
              <span>Apply Now</span>
            )}
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
        <div className="prose max-w-none">{job.description}</div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
        <textarea
          value={job.metadata.notes || ''}
          onChange={(e) => handleAction('notes', { notes: e.target.value })}
          placeholder="Add your notes about this job..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
