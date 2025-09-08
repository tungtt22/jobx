import axios from 'axios';
import { Job, JobCategory, JobRegion, ContractType } from '@/app/types/job';
import { AuthStorage } from '../services/authStorage';

const INDEED_API_URL = 'https://apis.indeed.com/v2/jobsearch';

interface IndeedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  url: string;
  type: string;
  posted_date: string;
  requirements: string[];
}

export class IndeedJobSource {
  private authStorage: AuthStorage;

  constructor() {
    this.authStorage = new AuthStorage();
  }

  private async getHeaders() {
    const token = await this.authStorage.getToken('indeed');
    if (!token) {
      throw new Error('Indeed token not found');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private determineContractType(type: string): ContractType {
    if (type.toLowerCase().includes('remote')) return 'remote';
    if (type.toLowerCase().includes('contract')) return 'contract';
    if (type.toLowerCase().includes('hybrid')) return 'hybrid';
    return 'permanent';
  }

  private categorizeJob(title: string, description: string): JobCategory {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.match(/security|devsecops|compliance|audit/)) return 'DevSecOps';
    if (text.match(/devops|ci\/cd|pipeline|automation/)) return 'DevOps';
    if (text.match(/sre|reliability|infrastructure/)) return 'SRE';
    if (text.match(/cloud|aws|azure|gcp/)) return 'Cloud';
    return 'Other';
  }

  private determineRegion(location: string): JobRegion {
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

  private extractSkills(description: string): string[] {
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

  async searchJobs(query: string, location?: string): Promise<Job[]> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.get(INDEED_API_URL, {
        headers,
        params: {
          q: query,
          l: location || 'remote',
          limit: 50,
          fromage: 30, // last 30 days
        }
      });

      const indeedJobs: IndeedJob[] = response.data.results;

      return indeedJobs.map(job => {
        const category = this.categorizeJob(job.title, job.description);
        const region = this.determineRegion(job.location);
        const skills = this.extractSkills(job.description);
        const contractType = this.determineContractType(job.type);

        return {
          id: `indeed-${job.id}`,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          salary: {
            min: job.salary.min,
            max: job.salary.max,
            currency: job.salary.currency,
            period: job.salary.period as 'hour' | 'month' | 'year'
          },
          contractType,
          url: job.url,
          source: 'indeed',
          sourceData: {
            originalId: job.id,
            originalUrl: job.url,
            originalPostedDate: job.posted_date,
            requirements: job.requirements
          },
          category,
          region,
          skills,
          postedAt: new Date(job.posted_date),
          status: 'active',
          metadata: {
            isBookmarked: false,
            isIgnored: false
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
    } catch (error) {
      console.error('Indeed API error:', error);
      return [];
    }
  }
}
