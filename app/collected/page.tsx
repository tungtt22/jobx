'use client';

import { useState, useEffect } from 'react';
import JobCard from '@/app/components/JobCard';
import JobFilters from '@/app/components/JobFilters';
import Button from '@/app/components/Button';

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

interface JobData {
  jobs: Job[];
  totalJobs: number;
  collectedAt: string;
  sources: string[];
  categories: string[];
  jobTypes?: string[];
  stats: {
    bySource: { [key: string]: number };
    byCategory: { [key: string]: number };
    byContractType: { [key: string]: number };
    byJobType?: { [key: string]: number };
    bySalary: { withSalary: number; withoutSalary: number };
  };
}

export default function CollectedJobsPage() {
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectResult, setCollectResult] = useState<any>(null);

  // Load jobs from API
  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/collector');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Transform API data to match our interface
        const transformedData: JobData = {
          jobs: data.jobs || [],
          totalJobs: data.total || 0,
          collectedAt: data.lastUpdated || new Date().toISOString(),
          sources: [...new Set((data.jobs || []).map((job: Job) => job.source))],
          categories: [...new Set((data.jobs || []).map((job: Job) => job.category))],
          jobTypes: [...new Set((data.jobs || []).map((job: Job) => job.jobType).filter(Boolean))],
          stats: data.stats || {
            bySource: {},
            byCategory: {},
            byContractType: {},
            bySalary: { withSalary: 0, withoutSalary: 0 }
          }
        };
        
        setJobData(transformedData);
        setFilteredJobs(transformedData.jobs);
      } else {
        throw new Error(data.error || 'Failed to load jobs');
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (filters: {
    search: string;
    source: string;
    category: string;
    contractType: string;
    jobType: string;
    minSalary: number;
  }) => {
    if (!jobData) return;

    let filtered = jobData.jobs;

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm) ||
        job.company.toLowerCase().includes(searchTerm) ||
        job.description.toLowerCase().includes(searchTerm) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchTerm))
      );
    }

    // Apply source filter
    if (filters.source) {
      filtered = filtered.filter(job => job.source === filters.source);
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(job => job.category === filters.category);
    }

    // Apply contract type filter
    if (filters.contractType) {
      filtered = filtered.filter(job => job.contractType === filters.contractType);
    }

    // Apply job type filter
    if (filters.jobType) {
      filtered = filtered.filter(job => job.jobType === filters.jobType);
    }

    // Apply min salary filter
    if (filters.minSalary > 0) {
      filtered = filtered.filter(job => {
        if (!job.salary) return false;
        const salaryMatch = job.salary.match(/\$?(\d+),?(\d+)?/);
        if (salaryMatch) {
          const salary = parseInt(salaryMatch[1] + (salaryMatch[2] || '000'));
          return salary >= filters.minSalary;
        }
        return false;
      });
    }

    setFilteredJobs(filtered);
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
  };

  const handleCollectJobs = async () => {
    setIsCollecting(true);
    setCollectResult(null);
    setError(null);

    try {
      const response = await fetch('/api/collector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries: ['devops', 'sre', 'finops', 'site reliability', 'platform engineer', 'cloud engineer', 'infrastructure engineer', 'automation engineer'],
          locations: ['Remote', 'Global', 'APAC', 'EU', 'Vietnam', 'Ho Chi Minh', 'Hanoi', 'Da Nang'],
          categories: ['DevOps', 'SRE', 'FinOps', 'Cloud', 'Infrastructure', 'Platform'],
          contractTypes: ['remote', 'hybrid', 'freelance', 'contract'],
          maxJobsPerSource: 50
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCollectResult(data);
      
      // Reload jobs after collection
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during collection');
    } finally {
      setIsCollecting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
          <button
            onClick={loadJobs}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No job data available.</p>
          <button
            onClick={loadJobs}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Load Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Collected Jobs</h1>
              <p className="text-gray-600">
                {jobData.totalJobs} jobs collected from {jobData.sources.length} sources
              </p>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(jobData.collectedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleCollectJobs}
                disabled={isCollecting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
              >
                {isCollecting ? 'Collecting...' : 'Collect New Jobs'}
              </Button>
              <Button
                onClick={loadJobs}
                variant="secondary"
                className="px-4 py-2"
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Collection Result */}
        {collectResult && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Collection Completed!</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p><strong>Status:</strong> {collectResult.success ? 'Success' : 'Failed'}</p>
                <p><strong>Message:</strong> {collectResult.message}</p>
              </div>
              {collectResult.result && (
                <div>
                  <p><strong>Total Jobs:</strong> {collectResult.result.totalJobsCollected || 0}</p>
                  <p><strong>New Jobs:</strong> {collectResult.result.newJobsAdded || 0}</p>
                </div>
              )}
              <div>
                <p><strong>Duration:</strong> {collectResult.result?.duration || 'N/A'}ms</p>
                <p><strong>Sources:</strong> {Object.keys(collectResult.result?.sources || {}).length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{jobData.totalJobs}</div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </div>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{jobData.sources.length}</div>
            <div className="text-sm text-gray-600">Sources</div>
          </div>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="text-2xl font-bold text-purple-600">{jobData.categories.length}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="text-2xl font-bold text-orange-600">{filteredJobs.length}</div>
            <div className="text-sm text-gray-600">Filtered Jobs</div>
          </div>
        </div>

        {/* Filters */}
        <JobFilters
          onFiltersChange={handleFiltersChange}
          availableSources={jobData.sources}
          availableCategories={jobData.categories}
          availableContractTypes={[...new Set(jobData.jobs.map(job => job.contractType))]}
          availableJobTypes={jobData.jobTypes || []}
        />

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onJobClick={handleJobClick}
            />
          ))}
        </div>

        {/* No Results */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No jobs found matching your filters</div>
            <button
              onClick={() => handleFiltersChange({
                search: '',
                source: '',
                category: '',
                contractType: '',
                jobType: '',
                minSalary: 0
              })}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Job Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Company</h3>
                    <p className="text-gray-600">{selectedJob.company}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">Description</h3>
                    <p className="text-gray-600">{selectedJob.description}</p>
                  </div>
                  
                  {selectedJob.skills && selectedJob.skills.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      <p>Source: {selectedJob.source}</p>
                      <p>Category: {selectedJob.category}</p>
                      <p>Contract: {selectedJob.contractType}</p>
                    </div>
                    <a
                      href={selectedJob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Apply Now
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}