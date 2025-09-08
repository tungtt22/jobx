import { Job } from '@/app/types/job';
import { BaseJobScraper } from './base-scraper';
import { AuthStorage } from '../services/authStorage';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Helper functions for category and skills extraction
function categorizeJob(title: string, description: string): string {
  // Simple keyword-based categorization, can be improved
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('devsecops')) return 'DevSecOps';
  if (text.includes('devops')) return 'DevOps';
  if (text.includes('sre')) return 'SRE';
  if (text.includes('cloud')) return 'Cloud';
  return 'Other';
}

function extractSkills(description: string): string[] {
  // Very basic skill extraction, can be improved
  const skills: string[] = [];
  const lower = description.toLowerCase();
  if (lower.includes('aws')) skills.push('AWS');
  if (lower.includes('azure')) skills.push('Azure');
  if (lower.includes('gcp')) skills.push('GCP');
  if (lower.includes('docker')) skills.push('Docker');
  if (lower.includes('kubernetes')) skills.push('Kubernetes');
  return skills;
}

class UpworkScraper extends BaseJobScraper {
  protected readonly SOURCE_NAME = 'upwork';
  protected readonly SEARCH_URL = 'https://www.upwork.com/nx/jobs/search';

  protected buildSearchUrl(query: string): string {
    const params = new URLSearchParams({
      q: query,
      sort: 'recency',
      contractor_tier: '2,3', // Intermediate and Expert
      t: '0,1' // Both hourly and fixed price
    });
    return `${this.SEARCH_URL}?${params.toString()}`;
  }

  protected async parseJobListings($: cheerio.CheerioAPI): Promise<Job[]> {
    const jobs: Job[] = [];
    
    $('.job-tile').each((_, element) => {
      const $job = $(element);
      const title = $job.find('.job-title').text().trim();
      const description = $job.find('.job-description').text().trim();
      const budgetText = $job.find('.budget').text().trim();
      const link = $job.find('a.job-link').attr('href') || '';
      const datePosted = $job.find('.job-date').attr('datetime') || new Date().toISOString();

      // Parse budget if possible
      let salary: Job['salary'] | undefined = undefined;
      if (budgetText) {
        // Try to extract a number and currency, fallback to USD/hour
        const match = budgetText.match(/([\d,\.]+)/);
        const amount = match ? parseFloat(match[1].replace(/,/g, '')) : 0;
        salary = {
          min: amount,
          max: amount,
          currency: 'USD',
          period: 'hour'
        };
      }

      if (title && description) {
        const category = categorizeJob(title, description);
        const region = 'OTHER'; // Upwork jobs are typically remote
        const skills = extractSkills(description);

        jobs.push({
          id: `upwork-${Date.now()}-${jobs.length}`,
          title,
          company: 'Upwork Client',
          location: 'Remote',
          description,
          salary,
          url: `https://www.upwork.com${link}`,
          source: 'upwork',
          sourceData: {
            originalId: link.split('?')[0],
            originalUrl: `https://www.upwork.com${link}`,
            originalPostedDate: datePosted
          },
          category,
          region,
          skills,
          contractType: 'remote',
          postedAt: new Date(datePosted),
          status: 'active',
          metadata: {
            isBookmarked: false,
            isIgnored: false
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    return jobs;
  }
}

class UpworkAPIClient {
  private readonly API_URL = 'https://api.upwork.com/v2';
  private authStorage: AuthStorage;

  constructor() {
    this.authStorage = new AuthStorage();
  }

  private async getHeaders() {
    const token = await this.authStorage.getToken('upwork');
    if (!token) return null;

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async searchJobs(query: string): Promise<Job[]> {
    const headers = await this.getHeaders();
    if (!headers) return [];

    try {
      const response = await axios.get(`${this.API_URL}/jobs/search.json`, {
        headers,
        params: {
          q: query,
          job_type: ['hourly', 'fixed'],
          duration: ['week', 'month', 'semester', 'ongoing'],
          sort: 'recency'
        }
      });

      // Defensive: response.data.jobs may not exist
      const jobsArr = response.data && response.data.jobs ? response.data.jobs : [];
      return jobsArr.map((job: any) => ({
        id: `upwork-${job.id}`,
        title: job.title,
        company: 'Upwork Client',
        location: 'Remote',
        description: job.description,
        salary: job.budget ? {
          min: job.budget.amount,
          max: job.budget.amount,
          currency: job.budget.currency || 'USD',
          period: job.type === 'hourly' ? 'hour' : 'fixed'
        } : undefined,
        url: job.url,
        source: 'upwork',
        sourceData: {
          originalId: job.id,
          originalUrl: job.url,
          originalPostedDate: job.created_at
        },
        category: categorizeJob(job.title, job.description),
        region: 'OTHER',
        skills: Array.isArray(job.skills) ? job.skills : [],
        contractType: 'remote',
        postedAt: new Date(job.created_at),
        status: 'active',
        metadata: {
          isBookmarked: false,
          isIgnored: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      console.error('Upwork API error:', error);
      return [];
    }
  }
}

export class UpworkJobSource {
  private scraper: UpworkScraper;
  private apiClient: UpworkAPIClient;

  constructor() {
    this.scraper = new UpworkScraper();
    this.apiClient = new UpworkAPIClient();
  }

  async searchJobs(query: string): Promise<Job[]> {
    // Try API first if token is available
    const apiJobs = await this.apiClient.searchJobs(query);
    if (apiJobs.length > 0) {
      return apiJobs;
    }

    // Fallback to scraping
    return this.scraper.searchJobs(query);
  }
}