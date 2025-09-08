'use server';

import fs from 'fs/promises';
import path from 'path';
import { Job } from '@/app/types/job';
import { ApplicationStatus } from './applications';

const EXPORT_DIR = path.join(process.cwd(), 'exports');

function formatJob(job: Job) {
  return {
    'Job Title': job.title,
    'Company': job.company,
    'Location': job.location,
    'Category': job.category,
    'Region': job.region,
    'Contract Type': job.contractType,
    'Salary Range': job.salary 
      ? `${job.salary.min}-${job.salary.max} ${job.salary.currency}/${job.salary.period}`
      : 'Not specified',
    'Skills': job.skills.join(', '),
    'Source': job.source,
    'Original URL': job.sourceData.originalUrl,
    'Posted Date': new Date(job.postedAt).toLocaleDateString(),
    'Applied Date': job.metadata.appliedAt 
      ? new Date(job.metadata.appliedAt).toLocaleDateString()
      : 'Not applied',
    'Status': job.status,
    'Notes': job.metadata.notes || ''
  };
}

function convertToCSV(data: Record<string, any>[]): string {
  const fields = Object.keys(data[0]);
  const csv = [
    fields.join(','),
    ...data.map(row => 
      fields.map(field => {
        const value = row[field]?.toString() || '';
        return value.includes(',') ? `"${value}"` : value;
      }).join(',')
    )
  ].join('\n');
  
  return csv;
}

export async function exportToCSV(
  data: Record<string, any>[],
  filename: string
): Promise<string> {
  await fs.mkdir(EXPORT_DIR, { recursive: true });
  const filePath = path.join(EXPORT_DIR, filename);
  const csv = convertToCSV(data);
  await fs.writeFile(filePath, csv);
  return filePath;
}

export async function exportApplicationHistory(
  applications: ApplicationStatus[]
): Promise<string> {
  const formattedData = applications.map(app => ({
    'Job ID': app.jobId,
    'Status': app.status,
    'Timeline': app.timeline
      .map(t => `${new Date(t.date).toLocaleDateString()}: ${t.status}`)
      .join('; '),
    'Next Steps': app.nextSteps
      ?.map(s => `${s.action} (${new Date(s.dueDate).toLocaleDateString()})`)
      .join('; ') || '',
    'Contacts': app.contacts
      ?.map(c => `${c.name} (${c.role})`)
      .join('; ') || '',
    'Compensation': app.compensation
      ? `${app.compensation.amount} ${app.compensation.currency}/${app.compensation.period}`
      : '',
    'Benefits': app.compensation?.benefits?.join('; ') || ''
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  return exportToCSV(formattedData, `applications-${timestamp}.csv`);
}

export async function exportJobSearch(jobs: Job[]): Promise<string> {
  const formattedData = jobs.map(formatJob);
  const timestamp = new Date().toISOString().split('T')[0];
  return exportToCSV(formattedData, `job-search-${timestamp}.csv`);
}
