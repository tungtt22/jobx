import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseJobScraper } from './base-scraper';
import { Job, JobCategory, JobRegion, ContractType } from '@/app/types/job';

// Indeed Global Scraper
export class IndeedGlobalScraper extends BaseJobScraper {
  protected readonly SOURCE_NAME = 'Indeed Global';
  protected readonly SEARCH_URL = 'https://www.indeed.com/jobs';

  protected buildSearchUrl(query: string, location?: string): string {
    const params = new URLSearchParams({
      q: query,
      ...(location && { l: location })
    });
    return `${this.SEARCH_URL}?${params.toString()}`;
  }

  protected async parseJobListings($: cheerio.CheerioAPI): Promise<Job[]> {
    const jobs: Job[] = [];
    
    $('.job_seen_beacon').each((_, element) => {
      try {
        const $job = $(element);
        const title = $job.find('.jobTitle a').text().trim();
        const company = $job.find('.companyName').text().trim();
        const location = $job.find('.companyLocation').text().trim();
        const salary = $job.find('.salary-snippet').text().trim();
        const url = $job.find('.jobTitle a').attr('href');
        const postedAt = $job.find('.date').text().trim();

        if (title && company && url) {
          jobs.push({
            id: `ind_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            company,
            location: location || 'Remote',
            description: $job.find('.job-snippet').text().trim(),
            salary: salary || undefined,
            url: url.startsWith('http') ? url : `https://www.indeed.com${url}`,
            source: 'indeed',
            category: this.categorizeJob(title, $job.find('.job-snippet').text()),
            region: this.determineRegion(location),
            contractType: this.determineContractType(location),
            skills: this.extractSkills($job.find('.job-snippet').text()),
            postedAt: this.parseDate(postedAt)
          });
        }
      } catch (error) {
        console.error('Error parsing Indeed job:', error);
      }
    });

    return jobs;
  }

  private parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;
    
    const now = new Date();
    if (dateStr.includes('hour')) {
      const hours = parseInt(dateStr.match(/\d+/)?.[0] || '0');
      return new Date(now.getTime() - hours * 60 * 60 * 1000);
    }
    if (dateStr.includes('day')) {
      const days = parseInt(dateStr.match(/\d+/)?.[0] || '0');
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }
    return undefined;
  }
}

// Glassdoor Scraper
export class GlassdoorScraper extends BaseJobScraper {
  protected readonly SOURCE_NAME = 'Glassdoor';
  protected readonly SEARCH_URL = 'https://www.glassdoor.com/Job/jobs.htm';

  protected buildSearchUrl(query: string, location?: string): string {
    const params = new URLSearchParams();
    params.set('sc.keyword', query);
    if (location) {
      params.set('locT', 'C');
      params.set('locId', location);
    }
    return `${this.SEARCH_URL}?${params.toString()}`;
  }

  protected async parseJobListings($: cheerio.CheerioAPI): Promise<Job[]> {
    const jobs: Job[] = [];
    
    $('.react-job-listing').each((_, element) => {
      try {
        const $job = $(element);
        const title = $job.find('.jobLink').text().trim();
        const company = $job.find('.jobInfoItem .employerName').text().trim();
        const location = $job.find('.jobInfoItem .loc').text().trim();
        const salary = $job.find('.salaryText').text().trim();
        const url = $job.find('.jobLink').attr('href');

        if (title && company && url) {
          jobs.push({
            id: `gd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            company,
            location: location || 'Remote',
            description: $job.find('.jobDescriptionContent').text().trim(),
            salary: salary || undefined,
            url: url.startsWith('http') ? url : `https://www.glassdoor.com${url}`,
            source: 'glassdoor',
            category: this.categorizeJob(title, $job.find('.jobDescriptionContent').text()),
            region: this.determineRegion(location),
            contractType: this.determineContractType(location),
            skills: this.extractSkills($job.find('.jobDescriptionContent').text()),
            postedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error parsing Glassdoor job:', error);
      }
    });

    return jobs;
  }
}

// AngelList (Wellfound) Scraper
export class AngelListScraper extends BaseJobScraper {
  protected readonly SOURCE_NAME = 'AngelList';
  protected readonly SEARCH_URL = 'https://wellfound.com/role_locations';

  protected buildSearchUrl(query: string, location?: string): string {
    const params = new URLSearchParams({
      search: query,
      ...(location && { location })
    });
    return `${this.SEARCH_URL}?${params.toString()}`;
  }

  protected async parseJobListings($: cheerio.CheerioAPI): Promise<Job[]> {
    const jobs: Job[] = [];
    
    $('.job-card').each((_, element) => {
      try {
        const $job = $(element);
        const title = $job.find('.job-title').text().trim();
        const company = $job.find('.company-name').text().trim();
        const location = $job.find('.job-location').text().trim();
        const salary = $job.find('.salary').text().trim();
        const url = $job.find('.job-link').attr('href');

        if (title && company && url) {
          jobs.push({
            id: `al_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            company,
            location: location || 'Remote',
            description: $job.find('.job-description').text().trim(),
            salary: salary || undefined,
            url: url.startsWith('http') ? url : `https://wellfound.com${url}`,
            source: 'angellist',
            category: this.categorizeJob(title, $job.find('.job-description').text()),
            region: this.determineRegion(location),
            contractType: this.determineContractType(location),
            skills: this.extractSkills($job.find('.job-description').text()),
            postedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error parsing AngelList job:', error);
      }
    });

    return jobs;
  }
}

// RemoteOK Scraper
export class RemoteOKScraper extends BaseJobScraper {
  protected readonly SOURCE_NAME = 'RemoteOK';
  protected readonly SEARCH_URL = 'https://remoteok.io/remote-dev-jobs';

  protected buildSearchUrl(query: string, location?: string): string {
    const params = new URLSearchParams({
      search: query
    });
    return `${this.SEARCH_URL}?${params.toString()}`;
  }

  protected async parseJobListings($: cheerio.CheerioAPI): Promise<Job[]> {
    const jobs: Job[] = [];
    
    $('.job').each((_, element) => {
      try {
        const $job = $(element);
        const title = $job.find('.job-title').text().trim();
        const company = $job.find('.company').text().trim();
        const location = 'Remote';
        const salary = $job.find('.salary').text().trim();
        const url = $job.find('.job-link').attr('href');

        if (title && company && url) {
          jobs.push({
            id: `ro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            company,
            location,
            description: $job.find('.job-description').text().trim(),
            salary: salary || undefined,
            url: url.startsWith('http') ? url : `https://remoteok.io${url}`,
            source: 'remoteok',
            category: this.categorizeJob(title, $job.find('.job-description').text()),
            region: 'OTHER',
            contractType: 'remote',
            skills: this.extractSkills($job.find('.job-description').text()),
            postedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error parsing RemoteOK job:', error);
      }
    });

    return jobs;
  }
}

// We Work Remotely Scraper
export class WeWorkRemotelyScraper extends BaseJobScraper {
  protected readonly SOURCE_NAME = 'We Work Remotely';
  protected readonly SEARCH_URL = 'https://weworkremotely.com/categories/remote-programming-jobs';

  protected buildSearchUrl(query: string, location?: string): string {
    return this.SEARCH_URL;
  }

  protected async parseJobListings($: cheerio.CheerioAPI): Promise<Job[]> {
    const jobs: Job[] = [];
    
    $('.job').each((_, element) => {
      try {
        const $job = $(element);
        const title = $job.find('.title').text().trim();
        const company = $job.find('.company').text().trim();
        const location = 'Remote';
        const url = $job.find('.title a').attr('href');

        if (title && company && url) {
          jobs.push({
            id: `wwr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            company,
            location,
            description: $job.find('.description').text().trim(),
            salary: undefined,
            url: url.startsWith('http') ? url : `https://weworkremotely.com${url}`,
            source: 'weworkremotely',
            category: this.categorizeJob(title, $job.find('.description').text()),
            region: 'OTHER',
            contractType: 'remote',
            skills: this.extractSkills($job.find('.description').text()),
            postedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error parsing We Work Remotely job:', error);
      }
    });

    return jobs;
  }
}
