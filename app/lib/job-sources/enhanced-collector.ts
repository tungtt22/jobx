import { Job } from '@/app/types/job';
import { VietnamWorksScraper, TopCVScraper, ITviecScraper, CareerBuilderVNScraper } from './vietnam-sources';
import { IndeedGlobalScraper, GlassdoorScraper, AngelListScraper, RemoteOKScraper, WeWorkRemotelyScraper } from './international-sources';
import { LinkedInJobSource } from './linkedin';
import { UpworkJobSource } from './upwork';

export interface JobSource {
  name: string;
  scraper: any;
  enabled: boolean;
  priority: number;
  rateLimit: number; // requests per minute
}

export interface CollectionConfig {
  sources: JobSource[];
  maxJobsPerSource: number;
  delayBetweenRequests: number;
  retryAttempts: number;
  timeout: number;
}

export interface CollectionResult {
  success: boolean;
  totalJobs: number;
  newJobs: number;
  sources: {
    [sourceName: string]: {
      success: boolean;
      jobsCollected: number;
      errors?: string[];
    };
  };
  duration: number;
}

export class EnhancedJobCollector {
  private config: CollectionConfig;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config?: Partial<CollectionConfig>) {
    this.config = {
      sources: [
        // International sources (APAC, EU) - Priority 1
        { name: 'remoteok', scraper: new RemoteOKScraper(), enabled: true, priority: 1, rateLimit: 15 },
        { name: 'weworkremotely', scraper: new WeWorkRemotelyScraper(), enabled: true, priority: 1, rateLimit: 10 },
        { name: 'angellist', scraper: new AngelListScraper(), enabled: true, priority: 1, rateLimit: 10 },
        { name: 'indeed', scraper: new IndeedGlobalScraper(), enabled: true, priority: 1, rateLimit: 20 },
        { name: 'glassdoor', scraper: new GlassdoorScraper(), enabled: true, priority: 1, rateLimit: 15 },
        
        // Professional networks - Priority 2
        { name: 'linkedin', scraper: new LinkedInJobSource(), enabled: true, priority: 2, rateLimit: 25 },
        { name: 'upwork', scraper: new UpworkJobSource(), enabled: true, priority: 2, rateLimit: 20 },
        
        // Vietnam sources - Priority 3
        { name: 'vietnamworks', scraper: new VietnamWorksScraper(), enabled: true, priority: 3, rateLimit: 30 },
        { name: 'topcv', scraper: new TopCVScraper(), enabled: true, priority: 3, rateLimit: 30 },
        { name: 'itviec', scraper: new ITviecScraper(), enabled: true, priority: 3, rateLimit: 30 },
        { name: 'careerbuilder', scraper: new CareerBuilderVNScraper(), enabled: true, priority: 3, rateLimit: 20 },
      ],
      maxJobsPerSource: 100,
      delayBetweenRequests: 2000,
      retryAttempts: 3,
      timeout: 30000,
      ...config
    };
  }

  async collectJobs(
    searchQueries: string[],
    locations?: string[],
    categories?: string[],
    contractTypes?: string[]
  ): Promise<CollectionResult> {
    const startTime = Date.now();
    const result: CollectionResult = {
      success: true,
      totalJobs: 0,
      newJobs: 0,
      sources: {},
      duration: 0
    };

    try {
      // Sort sources by priority
      const enabledSources = this.config.sources
        .filter(source => source.enabled)
        .sort((a, b) => a.priority - b.priority);

      const allJobs: Job[] = [];
      const sourceResults: { [key: string]: any } = {};

      // Collect from each source (prioritize international sources)
      for (const source of enabledSources) {
        try {
          console.log(`Collecting from ${source.name} (Priority: ${source.priority})...`);
          
          // Check rate limit
          await this.checkRateLimit(source.name, source.rateLimit);
          
          const sourceJobs: Job[] = [];
          
          // For international sources, prioritize global/remote locations
          const searchLocations = source.priority <= 2 
            ? ['Remote', 'Global', 'APAC', 'EU', 'NA', ...(locations || [])]
            : (locations || ['']);
          
          // Search with different queries and locations
          for (const query of searchQueries) {
            for (const location of searchLocations) {
              try {
                const jobs = await this.collectFromSource(source, query, location);
                sourceJobs.push(...jobs);
                
                // Respect rate limits
                await this.delay(this.config.delayBetweenRequests);
                
                // Limit jobs per source
                if (sourceJobs.length >= this.config.maxJobsPerSource) {
                  break;
                }
              } catch (error) {
                console.error(`Error collecting from ${source.name} with query "${query}":`, error);
              }
            }
            
            if (sourceJobs.length >= this.config.maxJobsPerSource) {
              break;
            }
          }

          // Filter by categories if specified
          let filteredJobs = categories 
            ? sourceJobs.filter(job => categories.includes(job.category))
            : sourceJobs;

          // Filter by contract types if specified
          if (contractTypes && contractTypes.length > 0) {
            filteredJobs = filteredJobs.filter(job => 
              contractTypes.includes(job.contractType)
            );
          }

          // Remove duplicates within source
          const uniqueJobs = this.removeDuplicates(filteredJobs);
          
          allJobs.push(...uniqueJobs);
          
          sourceResults[source.name] = {
            success: true,
            jobsCollected: uniqueJobs.length
          };

          console.log(`Collected ${uniqueJobs.length} jobs from ${source.name}`);
          
        } catch (error) {
          console.error(`Failed to collect from ${source.name}:`, error);
          sourceResults[source.name] = {
            success: false,
            jobsCollected: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error']
          };
        }
      }

      // Remove global duplicates
      const finalJobs = this.removeDuplicates(allJobs);
      
      // Enrich job data
      const enrichedJobs = finalJobs.map(job => this.enrichJobData(job));
      
      result.totalJobs = enrichedJobs.length;
      result.newJobs = enrichedJobs.length; // For now, assume all are new
      result.sources = sourceResults;
      result.duration = Date.now() - startTime;

      console.log(`Collection completed: ${enrichedJobs.length} total jobs in ${result.duration}ms`);
      
      return result;

    } catch (error) {
      console.error('Collection failed:', error);
      result.success = false;
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  private async collectFromSource(source: JobSource, query: string, location: string): Promise<Job[]> {
    const jobs = await source.scraper.searchJobs(query, location);
    return jobs.map(job => ({
      ...job,
      source: source.name
    }));
  }

  private async checkRateLimit(sourceName: string, rateLimit: number): Promise<void> {
    const now = Date.now();
    const key = sourceName;
    const current = this.requestCounts.get(key);
    
    if (current) {
      if (now < current.resetTime) {
        if (current.count >= rateLimit) {
          const waitTime = current.resetTime - now;
          console.log(`Rate limit reached for ${sourceName}, waiting ${waitTime}ms`);
          await this.delay(waitTime);
        }
      } else {
        // Reset counter
        this.requestCounts.set(key, { count: 0, resetTime: now + 60000 });
      }
    } else {
      this.requestCounts.set(key, { count: 0, resetTime: now + 60000 });
    }
    
    // Increment counter
    const currentCount = this.requestCounts.get(key)!;
    this.requestCounts.set(key, { count: currentCount.count + 1, resetTime: currentCount.resetTime });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private removeDuplicates(jobs: Job[]): Job[] {
    const seen = new Map<string, Job>();
    
    for (const job of jobs) {
      const key = `${job.title}_${job.company}_${job.location}`.toLowerCase();
      
      if (!seen.has(key)) {
        seen.set(key, job);
      } else {
        // Keep the more recent job
        const existing = seen.get(key)!;
        if (job.postedAt && (!existing.postedAt || job.postedAt > existing.postedAt)) {
          seen.set(key, job);
        }
      }
    }
    
    return Array.from(seen.values());
  }

  private enrichJobData(job: Job): Job {
    return {
      ...job,
      // Add any additional enrichment logic here
      skills: this.extractSkills(job.description),
      category: this.categorizeJob(job.title, job.description),
      region: this.determineRegion(job.location),
      contractType: this.determineContractType(job.location)
    };
  }

  private extractSkills(description: string): string[] {
    const devopsSkills = [
      // Cloud Platforms
      'AWS', 'Azure', 'GCP', 'Google Cloud', 'Amazon Web Services',
      // Container & Orchestration
      'Docker', 'Kubernetes', 'K8s', 'OpenShift', 'Rancher', 'Helm',
      // Infrastructure as Code
      'Terraform', 'CloudFormation', 'Ansible', 'Pulumi', 'CDK',
      // CI/CD
      'Jenkins', 'GitLab CI', 'GitHub Actions', 'Azure DevOps', 'CircleCI', 'Travis CI',
      // Monitoring & Observability
      'Prometheus', 'Grafana', 'ELK Stack', 'Datadog', 'New Relic', 'Splunk',
      'Jaeger', 'Zipkin', 'OpenTelemetry',
      // Programming Languages
      'Python', 'Go', 'Bash', 'Shell', 'PowerShell', 'YAML', 'JSON',
      // Databases
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
      // DevOps Tools
      'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence',
      // SRE Specific
      'SRE', 'Site Reliability', 'SLI', 'SLO', 'Error Budget', 'Incident Response',
      // FinOps Specific
      'FinOps', 'Cloud Cost', 'Cost Optimization', 'Cloud Financial Management',
      'AWS Cost Explorer', 'Azure Cost Management', 'GCP Billing',
      // Security
      'DevSecOps', 'Security', 'Compliance', 'SOC2', 'ISO27001'
    ];

    return devopsSkills.filter(skill =>
      description.toLowerCase().includes(skill.toLowerCase())
    );
  }

  private categorizeJob(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    // Prioritize DevOps, SRE, FinOps categories
    if (text.match(/sre|site reliability|reliability engineer/)) return 'SRE';
    if (text.match(/finops|financial operations|cloud cost|cost optimization/)) return 'FinOps';
    if (text.match(/devops|dev ops|development operations|platform engineer|infrastructure engineer/)) return 'DevOps';
    if (text.match(/cloud engineer|cloud architect|aws|azure|gcp|kubernetes|docker/)) return 'Cloud';
    if (text.match(/automation engineer|ci\/cd|jenkins|gitlab|github actions/)) return 'Automation';
    if (text.match(/infrastructure|infra|platform|system engineer/)) return 'Infrastructure';
    
    // Other categories
    if (text.match(/frontend|front-end|ui|ux|react|vue|angular/)) return 'Frontend';
    if (text.match(/backend|back-end|api|server|microservice/)) return 'Backend';
    if (text.match(/fullstack|full-stack|full stack/)) return 'Fullstack';
    if (text.match(/mobile|ios|android|flutter|react native/)) return 'Mobile';
    if (text.match(/data|analytics|ml|ai|machine learning/)) return 'Data';
    if (text.match(/security|cybersecurity|devsecops/)) return 'Security';
    if (text.match(/qa|test|testing/)) return 'QA';
    if (text.match(/design|ui|ux|product/)) return 'Design';
    if (text.match(/management|lead|architect/)) return 'Management';
    
    return 'Other';
  }

  private determineRegion(location: string): string {
    const loc = location.toLowerCase();
    
    // Prioritize APAC and EU regions
    if (loc.match(/asia|pacific|singapore|japan|korea|australia|india|thailand|malaysia|philippines|indonesia|china|hong kong|taiwan/)) return 'APAC';
    if (loc.match(/europe|germany|france|uk|spain|italy|netherlands|sweden|norway|denmark|finland|poland|portugal|austria|belgium|switzerland/)) return 'EU';
    if (loc.match(/vietnam|viet nam|ho chi minh|hanoi|da nang/)) return 'APAC';
    if (loc.match(/united states|usa|canada|mexico|america/)) return 'NA';
    if (loc.match(/remote|anywhere|worldwide|global/)) return 'REMOTE';
    
    return 'OTHER';
  }

  private determineContractType(location: string): string {
    const text = location.toLowerCase();
    
    // Prioritize remote, hybrid, freelance
    if (text.includes('remote') || text.includes('work from home') || text.includes('wfh')) return 'remote';
    if (text.includes('hybrid') || text.includes('flexible')) return 'hybrid';
    if (text.includes('freelance') || text.includes('freelancer') || text.includes('gig')) return 'freelance';
    if (text.includes('contract') || text.includes('contractor')) return 'contract';
    if (text.includes('onsite') || text.includes('on-site') || text.includes('office')) return 'onsite';
    
    // Default to remote for DevOps/SRE roles
    return 'remote';
  }

  // Method to get collection statistics
  getCollectionStats(jobs: Job[]): any {
    const stats = {
      total: jobs.length,
      bySource: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byRegion: {} as Record<string, number>,
      byContractType: {} as Record<string, number>,
      bySalary: {
        withSalary: 0,
        withoutSalary: 0
      }
    };

    jobs.forEach(job => {
      // Count by source
      stats.bySource[job.source] = (stats.bySource[job.source] || 0) + 1;
      
      // Count by category
      stats.byCategory[job.category] = (stats.byCategory[job.category] || 0) + 1;
      
      // Count by region
      stats.byRegion[job.region] = (stats.byRegion[job.region] || 0) + 1;
      
      // Count by contract type
      stats.byContractType[job.contractType] = (stats.byContractType[job.contractType] || 0) + 1;
      
      // Count salary info
      if (job.salary) {
        stats.bySalary.withSalary++;
      } else {
        stats.bySalary.withoutSalary++;
      }
    });

    return stats;
  }
}
