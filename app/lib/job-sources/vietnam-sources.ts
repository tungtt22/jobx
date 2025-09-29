import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseJobScraper } from './base-scraper';
import { Job, JobCategory, JobRegion, ContractType } from '@/app/types/job';

// VietnamWorks Job Scraper
export class VietnamWorksScraper extends BaseJobScraper {
  protected readonly SOURCE_NAME = 'VietnamWorks';
  protected readonly SEARCH_URL = 'https://www.vietnamworks.com/tim-viec-lam';

  protected buildSearchUrl(query: string, location?: string): string {
    const params = new URLSearchParams({
      q: query,
      ...(location && { location })
    });
    return `${this.SEARCH_URL}?${params.toString()}`;
  }

  protected async parseJobListings($: cheerio.CheerioAPI): Promise<Job[]> {
    const jobs: Job[] = [];
    
    $('.job-item').each((_, element) => {
      try {
        const $job = $(element);
        const title = $job.find('.job-title a').text().trim();
        const company = $job.find('.company-name').text().trim();
        const location = $job.find('.job-location').text().trim();
        const salary = $job.find('.salary').text().trim();
        const url = $job.find('.job-title a').attr('href');
        const postedAt = $job.find('.job-posted').text().trim();

        if (title && company && url) {
          jobs.push({
            id: `vw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            company,
            location: location || 'Vietnam',
            description: $job.find('.job-description').text().trim(),
            salary: salary || undefined,
            url: url.startsWith('http') ? url : `https://www.vietnamworks.com${url}`,
            source: 'vietnamworks',
            category: this.categorizeJob(title, $job.find('.job-description').text()),
            region: 'APAC',
            contractType: this.determineContractType(location),
            skills: this.extractSkills($job.find('.job-description').text()),
            postedAt: this.parseDate(postedAt)
          });
        }
      } catch (error) {
        console.error('Error parsing VietnamWorks job:', error);
      }
    });

    return jobs;
  }

  private parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;
    
    const now = new Date();
    if (dateStr.includes('giờ')) {
      const hours = parseInt(dateStr.match(/\d+/)?.[0] || '0');
      return new Date(now.getTime() - hours * 60 * 60 * 1000);
    }
    if (dateStr.includes('ngày')) {
      const days = parseInt(dateStr.match(/\d+/)?.[0] || '0');
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }
    return undefined;
  }
}

// TopCV Job Scraper
export class TopCVScraper extends BaseJobScraper {
  protected readonly SOURCE_NAME = 'TopCV';
  protected readonly SEARCH_URL = 'https://www.topcv.vn/tim-viec-lam';

  protected buildSearchUrl(query: string, location?: string): string {
    const params = new URLSearchParams({
      q: query,
      ...(location && { location })
    });
    return `${this.SEARCH_URL}?${params.toString()}`;
  }

  protected async parseJobListings($: cheerio.CheerioAPI): Promise<Job[]> {
    const jobs: Job[] = [];
    
    $('.job-item').each((_, element) => {
      try {
        const $job = $(element);
        const title = $job.find('.job-title a').text().trim();
        const company = $job.find('.company-name').text().trim();
        const location = $job.find('.job-location').text().trim();
        const salary = $job.find('.salary').text().trim();
        const url = $job.find('.job-title a').attr('href');

        if (title && company && url) {
          jobs.push({
            id: `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            company,
            location: location || 'Vietnam',
            description: $job.find('.job-description').text().trim(),
            salary: salary || undefined,
            url: url.startsWith('http') ? url : `https://www.topcv.vn${url}`,
            source: 'topcv',
            category: this.categorizeJob(title, $job.find('.job-description').text()),
            region: 'APAC',
            contractType: this.determineContractType(location),
            skills: this.extractSkills($job.find('.job-description').text()),
            postedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error parsing TopCV job:', error);
      }
    });

    return jobs;
  }
}

// ITviec Job Scraper
export class ITviecScraper extends BaseJobScraper {
  protected readonly SOURCE_NAME = 'ITviec';
  protected readonly SEARCH_URL = 'https://itviec.com/it-jobs';

  protected buildSearchUrl(query: string, location?: string): string {
    const params = new URLSearchParams({
      q: query,
      ...(location && { location })
    });
    return `${this.SEARCH_URL}?${params.toString()}`;
  }

  protected async parseJobListings($: cheerio.CheerioAPI): Promise<Job[]> {
    const jobs: Job[] = [];
    
    $('.job').each((_, element) => {
      try {
        const $job = $(element);
        const title = $job.find('.job-title a').text().trim();
        const company = $job.find('.company-name').text().trim();
        const location = $job.find('.job-location').text().trim();
        const salary = $job.find('.salary').text().trim();
        const url = $job.find('.job-title a').attr('href');

        if (title && company && url) {
          jobs.push({
            id: `it_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            company,
            location: location || 'Vietnam',
            description: $job.find('.job-description').text().trim(),
            salary: salary || undefined,
            url: url.startsWith('http') ? url : `https://itviec.com${url}`,
            source: 'itviec',
            category: this.categorizeJob(title, $job.find('.job-description').text()),
            region: 'APAC',
            contractType: this.determineContractType(location),
            skills: this.extractSkills($job.find('.job-description').text()),
            postedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error parsing ITviec job:', error);
      }
    });

    return jobs;
  }
}

// CareerBuilder Vietnam Scraper
export class CareerBuilderVNScraper extends BaseJobScraper {
  protected readonly SOURCE_NAME = 'CareerBuilder Vietnam';
  protected readonly SEARCH_URL = 'https://careerbuilder.vn/viec-lam';

  protected buildSearchUrl(query: string, location?: string): string {
    const params = new URLSearchParams({
      keyword: query,
      ...(location && { location })
    });
    return `${this.SEARCH_URL}?${params.toString()}`;
  }

  protected async parseJobListings($: cheerio.CheerioAPI): Promise<Job[]> {
    const jobs: Job[] = [];
    
    $('.job-item').each((_, element) => {
      try {
        const $job = $(element);
        const title = $job.find('.job-title a').text().trim();
        const company = $job.find('.company-name').text().trim();
        const location = $job.find('.job-location').text().trim();
        const salary = $job.find('.salary').text().trim();
        const url = $job.find('.job-title a').attr('href');

        if (title && company && url) {
          jobs.push({
            id: `cb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            company,
            location: location || 'Vietnam',
            description: $job.find('.job-description').text().trim(),
            salary: salary || undefined,
            url: url.startsWith('http') ? url : `https://careerbuilder.vn${url}`,
            source: 'careerbuilder',
            category: this.categorizeJob(title, $job.find('.job-description').text()),
            region: 'APAC',
            contractType: this.determineContractType(location),
            skills: this.extractSkills($job.find('.job-description').text()),
            postedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error parsing CareerBuilder job:', error);
      }
    });

    return jobs;
  }
}
