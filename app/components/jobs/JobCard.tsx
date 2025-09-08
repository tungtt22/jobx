'use client';

import { Job } from '@/app/types/job';
import { FiBookmark, FiEye, FiEyeOff, FiExternalLink } from 'react-icons/fi';
import Link from 'next/link';

interface JobCardProps {
  job: Job;
  onBookmark: (jobId: string) => void;
  onIgnore: (jobId: string) => void;
}

export default function JobCard({ job, onBookmark, onIgnore }: JobCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            <Link href={`/jobs/${job.id}`} className="hover:text-blue-600">
              {job.title}
            </Link>
          </h3>
          <p className="text-gray-600">{job.company}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onBookmark(job.id)}
            className={`p-2 rounded-full hover:bg-gray-100 ${
              job.metadata.isBookmarked ? 'text-blue-600' : 'text-gray-400'
            }`}
            title={job.metadata.isBookmarked ? 'Remove bookmark' : 'Bookmark job'}
          >
            <FiBookmark className="w-5 h-5" />
          </button>
          <button
            onClick={() => onIgnore(job.id)}
            className={`p-2 rounded-full hover:bg-gray-100 ${
              job.metadata.isIgnored ? 'text-red-600' : 'text-gray-400'
            }`}
            title={job.metadata.isIgnored ? 'Show job' : 'Ignore job'}
          >
            {job.metadata.isIgnored ? (
              <FiEyeOff className="w-5 h-5" />
            ) : (
              <FiEye className="w-5 h-5" />
            )}
          </button>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
            title="Open job posting"
          >
            <FiExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
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
        <div className="mt-2 flex flex-wrap gap-2">
          {job.skills.map((skill) => (
            <span
              key={skill}
              className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-4 text-gray-600 line-clamp-3">{job.description}</p>
      <div className="mt-4 flex justify-between items-center text-sm">
        <span className="text-gray-500">
          Posted {new Date(job.postedAt).toLocaleDateString()}
        </span>
        <span className={`font-medium ${
          job.category === 'DevSecOps' ? 'text-red-600' :
          job.category === 'DevOps' ? 'text-blue-600' :
          job.category === 'SRE' ? 'text-green-600' :
          'text-gray-600'
        }`}>
          {job.category}
        </span>
      </div>
    </div>
  );
}
