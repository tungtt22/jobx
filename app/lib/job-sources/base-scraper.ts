import axios from 'axios';
import * as cheerio from 'cheerio';
import { Job, JobCategory, JobRegion, ContractType } from '@/app/types/job';

const COMMON_HEADERS = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

export abstract class BaseJobScraper {
  protected abstract readonly SOURCE_NAME: string;
  protected abstract readonly SEARCH_URL: string;

  protected async fetchHtml(url: string, customHeaders: Record<string, string> = {}): Promise<string> {
    try {
      // Add random delay between requests
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

      const response = await axios.get(url, {
        headers: {
          ...COMMON_HEADERS,
          ...customHeaders,
          // Add random referer
          'Referer': 'https://www.google.com/',
          // Add cookie if provided
          ...(this.getCookies() && { 'Cookie': this.getCookies() })
        },
        // Add proxy if configured
        ...(this.getProxy() && {
          proxy: this.getProxy()
        }),
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 300;
        }
      });

      // Save cookies from response if any
      if (response.headers['set-cookie']) {
        this.saveCookies(response.headers['set-cookie']);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          console.error(`Access denied to ${url}. Trying with different headers/proxy...`);
          // Retry with different configuration
          return this.retryWithDifferentConfig(url);
        }
      }
      throw error;
    }
  }

  private async retryWithDifferentConfig(url: string): Promise<string> {
    // Try with different User-Agent
    const alternativeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    
    try {
      const response = await axios.get(url, {
        headers: {
          ...COMMON_HEADERS,
          'User-Agent': alternativeUA,
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Retry failed for ${url}:`, error);
      throw error;
    }
  }

  protected getCookies(): string | null {
    // Implement cookie storage/retrieval
    return null;
  }

  protected saveCookies(cookies: string[]) {
    // Implement cookie storage
  }

  protected getProxy(): { host: string; port: number } | null {
    // Implement proxy configuration
    return null;
  }

  protected categorizeJob(title: string, description: string): JobCategory {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.match(/security|devsecops|compliance|audit/)) return 'DevSecOps';
    if (text.match(/devops|ci\/cd|pipeline|automation/)) return 'DevOps';
    if (text.match(/sre|reliability|infrastructure/)) return 'SRE';
    if (text.match(/cloud|aws|azure|gcp/)) return 'Cloud';
    return 'Other';
  }

  protected determineRegion(location: string): JobRegion {
    location = location.toLowerCase();
    
    if (location.match(/asia|pacific|singapore|japan|korea|australia|india/)) {
      return 'APAC';
    }
    if (location.match(/europe|germany|france|uk|spain|italy|netherlands/)) {
      return 'EU';
    }
    if (location.match(/united states|usa|canada|mexico/)) {
      return 'NA';
    }
    return 'OTHER';
  }

  protected determineContractType(text: string): ContractType {
    text = text.toLowerCase();
    if (text.includes('remote')) return 'remote';
    if (text.includes('contract')) return 'contract';
    if (text.includes('hybrid')) return 'hybrid';
    if (text.includes('onsite')) return 'onsite';
    return 'permanent';
  }

  protected extractSkills(description: string): string[] {
    const commonSkills = [
      'Kubernetes', 'Docker', 'AWS', 'Azure', 'GCP',
      'Terraform', 'Ansible', 'Jenkins', 'GitLab',
      'Python', 'Go', 'Java', 'Node.js', 'Shell',
      'Monitoring', 'Logging', 'Security', 'CI/CD',
      'Linux', 'Networking', 'Cloud Native'
    ];

    return commonSkills.filter(skill =>
      description.toLowerCase().includes(skill.toLowerCase())
    );
  }

  protected abstract parseJobListings($: cheerio.CheerioAPI): Promise<Job[]>;

  public async searchJobs(query: string, location?: string): Promise<Job[]> {
    try {
      const searchUrl = this.buildSearchUrl(query, location);
      const html = await this.fetchHtml(searchUrl);
      const $ = cheerio.load(html);
      return this.parseJobListings($);
    } catch (error) {
      console.error(`Error scraping ${this.SOURCE_NAME}:`, error);
      return [];
    }
  }

  protected abstract buildSearchUrl(query: string, location?: string): string;
}