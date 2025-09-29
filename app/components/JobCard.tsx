'use client';

import { useState } from 'react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  url: string;
  source: string;
  category: string;
  region: string;
  contractType: string;
  skills: string[];
  postedAt: string;
  jobType?: string;
}

interface JobCardProps {
  job: Job;
  onJobClick?: (job: Job) => void;
}

export default function JobCard({ job, onJobClick }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (onJobClick) {
      onJobClick(job);
    }
  };

  const getSourceColor = (source: string) => {
    const colors: { [key: string]: string } = {
      upwork: 'bg-green-100 text-green-800',
      freelancer: 'bg-blue-100 text-blue-800',
      fiverr: 'bg-purple-100 text-purple-800',
      toptal: 'bg-yellow-100 text-yellow-800',
      guru: 'bg-orange-100 text-orange-800',
      remoteok: 'bg-red-100 text-red-800',
      weworkremotely: 'bg-indigo-100 text-indigo-800',
      indeed: 'bg-teal-100 text-teal-800',
      glassdoor: 'bg-pink-100 text-pink-800',
      angellist: 'bg-cyan-100 text-cyan-800',
      linkedin: 'bg-blue-100 text-blue-800'
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Frontend: 'bg-blue-100 text-blue-800',
      Backend: 'bg-green-100 text-green-800',
      Fullstack: 'bg-purple-100 text-purple-800',
      Mobile: 'bg-orange-100 text-orange-800',
      DevOps: 'bg-red-100 text-red-800',
      Design: 'bg-pink-100 text-pink-800',
      Marketing: 'bg-yellow-100 text-yellow-800',
      Writing: 'bg-indigo-100 text-indigo-800',
      Data: 'bg-teal-100 text-teal-800',
      QA: 'bg-cyan-100 text-cyan-800',
      Security: 'bg-gray-100 text-gray-800',
      Administrative: 'bg-slate-100 text-slate-800',
      Video: 'bg-violet-100 text-violet-800',
      Translation: 'bg-emerald-100 text-emerald-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {job.title}
            </h3>
            <p className="text-gray-600 font-medium">{job.company}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(job.source)}`}>
              {job.source.toUpperCase()}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(job.category)}`}>
              {job.category}
            </span>
          </div>
        </div>

        {/* Job Details */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.location}
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDate(job.postedAt)}
          </div>
          {job.salary && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              {job.salary}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className={`text-gray-700 text-sm ${isExpanded ? '' : 'line-clamp-3'}`}>
            {job.description}
          </p>
          {job.description.length > 150 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {job.skills.slice(0, 6).map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 6 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                  +{job.skills.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="capitalize">{job.contractType}</span>
            {job.jobType && (
              <span className="capitalize">{job.jobType}</span>
            )}
          </div>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            View Job
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
