import { Job } from '@/app/types/job';
import { BaseJobScraper } from './base-scraper';
import { AuthStorage } from '../services/authStorage';
import axios from 'axios';
import * as cheerio from 'cheerio';

class LinkedInScraper extends BaseJobScraper {
  protected readonly SOURCE_NAME = 'linkedin';
  protected readonly SEARCH_URL = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';

  protected buildSearchUrl(query: string, location?: string): string {
    const params = new URLSearchParams({
      keywords: query,
      location: location || 'Worldwide',
      f_WT: '2', // Remote jobs
      sortBy: 'DD', // Most recent
      start: '0',
      f_TPR: 'r86400', // Last 24 hours
    });
    return `${this.SEARCH_URL}?${params.toString()}`;
  }

  private async getJobDetails(jobId: string): Promise<string> {
    try {
      const response = await axios.get(
        `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching job details:', error);
      return '';
    }
  }

  protected async parseJobListings($: cheerio.CheerioAPI): Promise<Job[]> {
    const jobs: Job[] = [];
    
    // Find all job cards
    const jobCards = $('.job-search-card');
    
    for (let i = 0; i < jobCards.length; i++) {
      const $job = $(jobCards[i]);
      
      // Extract basic info from the card
      const title = $job.find('.job-search-card__title').text().trim();
      const company = $job.find('.job-search-card__company-name').text().trim();
      const location = $job.find('.job-search-card__location').text().trim();
      const listingUrl = $job.find('.job-search-card__link').attr('href') || '';
      const jobId = listingUrl.split('?')[0].split('-').pop() || '';
      
      if (title && company && jobId) {
        // Get detailed job description
        const detailsHtml = await this.getJobDetails(jobId);
        const $details = cheerio.load(detailsHtml);
        const description = $details('.show-more-less-html__markup').text().trim();
        const salary = $details('.compensation__salary').text().trim();
        const employmentType = $details('.job-criteria__item--employment-type .job-criteria__text').text().trim();
        
        const category = this.categorizeJob(title, description);
        const region = this.determineRegion(location);
        const skills = this.extractSkills(description);
        const contractType = this.determineContractType(employmentType);

        jobs.push({
          id: `linkedin-${jobId}`,
          title,
          company,
          location,
          description,
          salary: salary ? {
            min: 0,
            max: 0,
            currency: 'USD',
            period: 'year'
          } : undefined,
          url: `https://www.linkedin.com/jobs/view/${jobId}`,
          source: 'linkedin',
          sourceData: {
            originalId: jobId,
            originalUrl: `https://www.linkedin.com/jobs/view/${jobId}`,
            originalPostedDate: new Date().toISOString()
          },
          category,
          region,
          skills,
          contractType,
          postedAt: new Date(),
          status: 'active',
          metadata: {
            isBookmarked: false,
            isIgnored: false
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    return jobs;
  }

  async searchAllPages(query: string, location?: string, maxPages: number = 5): Promise<Job[]> {
    let allJobs: Job[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore && page < maxPages) {
      try {
        const params = new URLSearchParams({
          keywords: query,
          location: location || 'Worldwide',
          f_WT: '2', // Remote jobs
          sortBy: 'DD', // Most recent
          start: (page * 25).toString(), // LinkedIn uses 25 jobs per page
          f_TPR: 'r86400', // Last 24 hours
        });

        const url = `${this.SEARCH_URL}?${params.toString()}`;
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        const $ = cheerio.load(response.data);
        const jobs = await this.parseJobListings($);
        
        if (jobs.length === 0) {
          hasMore = false;
        } else {
          allJobs = [...allJobs, ...jobs];
          page++;
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        hasMore = false;
      }
    }

    return allJobs;
  }
}

export class LinkedInJobSource {
  private scraper: LinkedInScraper;

  constructor() {
    this.scraper = new LinkedInScraper();
  }

  async searchJobs(query: string, location?: string): Promise<Job[]> {
    // Always use scraper now, no API needed
    return this.scraper.searchAllPages(query, location);
  }
}