import { ExternalJob, JobSearchParams, JobSearchResult } from './types';
import { LinkedInJobSource } from './linkedin';
import { UpworkJobSource } from './upwork';

export async function searchAllJobs(params: JobSearchParams): Promise<{
  jobs: ExternalJob[];
  sources: { [key: string]: JobSearchResult };
}> {
  try {
    // Run all job searches in parallel
    const linkedinSource = new LinkedInJobSource();
    const upworkSource = new UpworkJobSource();
    
    const [linkedinJobs, upworkJobs] = await Promise.all([
      linkedinSource.searchJobs(params.query, params.location),
      upworkSource.searchJobs(params.query),
    ]);
    
    const linkedinResults: JobSearchResult = {
      jobs: linkedinJobs,
      total: linkedinJobs.length,
      hasMore: false,
      source: 'linkedin'
    };
    
    const upworkResults: JobSearchResult = {
      jobs: upworkJobs,
      total: upworkJobs.length,
      hasMore: false,
      source: 'upwork'
    };

    // Combine all jobs
    const allJobs = [
      ...linkedinResults.jobs,
      ...upworkResults.jobs,
    ];

    // Sort jobs by posted date (most recent first)
    const sortedJobs = allJobs.sort((a, b) => {
      const dateA = a.postedAt?.getTime() || 0;
      const dateB = b.postedAt?.getTime() || 0;
      return dateB - dateA;
    });

    // Remove duplicates (based on title and company)
    const uniqueJobs = sortedJobs.filter((job, index, self) =>
      index === self.findIndex((j) => (
        j.title === job.title && j.company === job.company
      ))
    );

    // Limit results if needed
    const limitedJobs = params.limit
      ? uniqueJobs.slice(0, params.limit)
      : uniqueJobs;

    return {
      jobs: limitedJobs,
      sources: {
        linkedin: linkedinResults,
        upwork: upworkResults,
      }
    };
  } catch (error) {
    console.error('Error aggregating job results:', error);
    return {
      jobs: [],
      sources: {}
    };
  }
}

export function enrichJobData(job: ExternalJob): ExternalJob {
  // Add any additional processing or enrichment here
  return {
    ...job,
    // Add normalized location
    location: normalizeLocation(job.location),
    // Extract skills from description
    skills: extractSkills(job.description),
  };
}

function normalizeLocation(location: string): string {
  // Normalize location format
  return location
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^Remote - /, 'Remote, ')
    .replace(/^Remote$/, 'Remote Worldwide');
}

function extractSkills(description: string): string[] {
  // Common tech skills to look for
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Angular', 'Vue',
    'Node.js', 'TypeScript', 'SQL', 'AWS', 'Docker', 'Kubernetes',
    'Machine Learning', 'AI', 'DevOps', 'Cloud', 'Frontend', 'Backend'
  ];

  return commonSkills.filter(skill =>
    description.toLowerCase().includes(skill.toLowerCase())
  );
}
