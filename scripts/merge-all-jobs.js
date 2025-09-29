#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const COLLECTED_JOBS_FILE = path.join(DATA_DIR, 'collected-jobs.json');

async function mergeAllJobs() {
  try {
    console.log('🔄 Merging all job data into collected-jobs.json...');
    
    // Get all job files
    const files = await fs.readdir(DATA_DIR);
    const jobFiles = files.filter(file => 
      file.startsWith('real-jobs-') || 
      file.startsWith('international-jobs-') || 
      file.startsWith('freelancer-jobs-') ||
      file.startsWith('vietnam-jobs-') ||
      file.startsWith('more-real-jobs-')
    ).sort((a, b) => {
      // Prioritize real-jobs files first, then by date
      if (a.startsWith('real-jobs-') && !b.startsWith('real-jobs-')) return -1;
      if (!a.startsWith('real-jobs-') && b.startsWith('real-jobs-')) return 1;
      return b.localeCompare(a); // Most recent first
    });

    console.log(`📁 Found ${jobFiles.length} job files to merge`);

    let allJobs = [];
    let allStats = {
      bySource: {},
      byCategory: {},
      byContractType: {},
      byJobType: {},
      bySalary: { withSalary: 0, withoutSalary: 0 }
    };

    // Load and merge all job files
    for (const file of jobFiles) {
      try {
        const filePath = path.join(DATA_DIR, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const jobData = JSON.parse(data);
        
        console.log(`📄 Loading ${file}: ${jobData.jobs?.length || 0} jobs`);
        
        if (jobData.jobs && Array.isArray(jobData.jobs)) {
          allJobs.push(...jobData.jobs);
        }
        
        // Merge stats
        if (jobData.stats) {
          Object.entries(jobData.stats.bySource || {}).forEach(([source, count]) => {
            allStats.bySource[source] = (allStats.bySource[source] || 0) + count;
          });
          Object.entries(jobData.stats.byCategory || {}).forEach(([category, count]) => {
            allStats.byCategory[category] = (allStats.byCategory[category] || 0) + count;
          });
          Object.entries(jobData.stats.byContractType || {}).forEach(([type, count]) => {
            allStats.byContractType[type] = (allStats.byContractType[type] || 0) + count;
          });
          Object.entries(jobData.stats.byJobType || {}).forEach(([type, count]) => {
            allStats.byJobType[type] = (allStats.byJobType[type] || 0) + count;
          });
          allStats.bySalary.withSalary += jobData.stats.bySalary?.withSalary || 0;
          allStats.bySalary.withoutSalary += jobData.stats.bySalary?.withoutSalary || 0;
        }
      } catch (error) {
        console.error(`❌ Error loading ${file}:`, error.message);
      }
    }

    console.log(`📊 Total jobs before deduplication: ${allJobs.length}`);

    // Remove duplicates
    const uniqueJobs = removeDuplicates(allJobs);
    console.log(`📊 Total jobs after deduplication: ${uniqueJobs.length}`);

    // Create unified collected jobs file
    const collectedJobs = {
      jobs: uniqueJobs,
      lastUpdated: new Date(),
      stats: allStats
    };

    // Save to collected-jobs.json
    await fs.writeFile(COLLECTED_JOBS_FILE, JSON.stringify(collectedJobs, null, 2));
    
    console.log('✅ Successfully merged all jobs into collected-jobs.json');
    console.log(`📈 Final statistics:`);
    console.log(`   - Total jobs: ${uniqueJobs.length}`);
    console.log(`   - Sources: ${Object.keys(allStats.bySource).length}`);
    console.log(`   - Categories: ${Object.keys(allStats.byCategory).length}`);
    console.log(`   - Contract types: ${Object.keys(allStats.byContractType).length}`);
    console.log(`   - Jobs with salary: ${allStats.bySalary.withSalary}`);
    console.log(`   - Jobs without salary: ${allStats.bySalary.withoutSalary}`);

    // Show breakdown by source
    console.log('\n📊 Jobs by source:');
    Object.entries(allStats.bySource)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count]) => {
        console.log(`   ${source}: ${count} jobs`);
      });

  } catch (error) {
    console.error('❌ Error merging jobs:', error);
    process.exit(1);
  }
}

function removeDuplicates(jobs) {
  const seen = new Map();
  
  for (const job of jobs) {
    const key = `${job.title}_${job.company}_${job.location}`.toLowerCase();
    
    if (!seen.has(key)) {
      seen.set(key, job);
    } else {
      // Keep the more recent job
      const existing = seen.get(key);
      if (job.postedAt && (!existing.postedAt || job.postedAt > existing.postedAt)) {
        seen.set(key, job);
      }
    }
  }
  
  return Array.from(seen.values());
}

async function main() {
  await mergeAllJobs();
}

if (require.main === module) {
  main();
}

module.exports = { mergeAllJobs };
