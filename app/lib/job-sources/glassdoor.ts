import axios from 'axios';
import { Job, JobCategory, JobRegion, ContractType } from '@/app/types/job';
import { AuthStorage } from '../services/authStorage';

const GLASSDOOR_API_URL = 'https://api.glassdoor.com/v1/jobs';

interface GlassdoorJob {
  id: string;
  title: string;
  employer: {
    name: string;
    rating: number;
  };
  location: string;
  description: string;
  salary: {
    payPeriod: string;
    salaryMin: number;
    salaryMax: number;
    currency: string;
  };
  jobLink: string;
  jobType: string;
  posted: string;
  benefits: string[];
}

export class GlassdoorJobSource {
  private authStorage: AuthStorage;

  constructor() {
    this.authStorage = new AuthStorage();
  }

  private async getHeaders() {
    const token = await this.authStorage.getToken('glassdoor');
    if (!token) {
      throw new Error('Glassdoor token not found');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private determineContractType(type: string): ContractType {
    const typeLC = type.toLowerCase();
    if (typeLC.includes('remote')) return 'remote';
    if (typeLC.includes('contract') || typeLC.includes('temporary')) return 'contract';
    if (typeLC.includes('hybrid')) return 'hybrid';
    if (typeLC.includes('onsite') || typeLC.includes('on-site')) return 'onsite';
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
      
      const response = await axios.get(GLASSDOOR_API_URL, {
        headers,
        params: {
          keyword: query,
          location: location || 'remote',
          jobType: 'fulltime',
          fromAge: 30,
          pageSize: 50
        }
      });

      const glassdoorJobs: GlassdoorJob[] = response.data.response.jobs;

      return glassdoorJobs.map(job => {
        const category = this.categorizeJob(job.title, job.description);
        const region = this.determineRegion(job.location);
        const skills = this.extractSkills(job.description);
        const contractType = this.determineContractType(job.jobType);

        return {
          id: `glassdoor-${job.id}`,
          title: job.title,
          company: job.employer.name,
          location: job.location,
          description: job.description,
          salary: {
            min: job.salary.salaryMin,
            max: job.salary.salaryMax,
            currency: job.salary.currency,
            period: job.salary.payPeriod as 'hour' | 'month' | 'year'
          },
          contractType,
          url: job.jobLink,
          source: 'glassdoor',
          sourceData: {
            originalId: job.id,
            originalUrl: job.jobLink,
            originalPostedDate: job.posted,
            benefits: job.benefits
          },
          category,
          region,
          skills,
          postedAt: new Date(job.posted),
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
      console.error('Glassdoor API error:', error);
      return [];
    }
  }
}
