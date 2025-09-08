'use server';

import fs from 'fs/promises';
import path from 'path';
import { Job } from '@/app/types/job';

const DATA_DIR = path.join(process.cwd(), 'data');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');

export interface ApplicationStatus {
  jobId: string;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'accepted' | 'withdrawn';
  timeline: {
    date: Date;
    status: string;
    notes?: string;
  }[];
  nextSteps?: {
    action: string;
    dueDate: Date;
    completed: boolean;
  }[];
  feedback?: string;
  compensation?: {
    amount: number;
    currency: string;
    period: 'hour' | 'month' | 'year';
    benefits?: string[];
  };
  contacts?: {
    name: string;
    role: string;
    email?: string;
    notes?: string;
  }[];
}

async function loadApplications(): Promise<Record<string, ApplicationStatus>> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(APPLICATIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveApplications(applications: Record<string, ApplicationStatus>) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(APPLICATIONS_FILE, JSON.stringify(applications, null, 2));
}

export async function trackApplication(jobId: string): Promise<ApplicationStatus> {
  const applications = await loadApplications();

  if (!applications[jobId]) {
    applications[jobId] = {
      jobId,
      status: 'applied',
      timeline: [{
        date: new Date(),
        status: 'applied',
        notes: 'Initial application submitted'
      }]
    };

    await saveApplications(applications);
  }

  return applications[jobId];
}

export async function updateStatus(
  jobId: string,
  status: ApplicationStatus['status'],
  notes?: string
): Promise<ApplicationStatus> {
  const applications = await loadApplications();

  if (!applications[jobId]) {
    throw new Error('Application not found');
  }

  applications[jobId].status = status;
  applications[jobId].timeline.push({
    date: new Date(),
    status,
    notes
  });

  await saveApplications(applications);
  return applications[jobId];
}

export async function addNextStep(
  jobId: string,
  action: string,
  dueDate: Date
): Promise<ApplicationStatus> {
  const applications = await loadApplications();

  if (!applications[jobId]) {
    throw new Error('Application not found');
  }

  if (!applications[jobId].nextSteps) {
    applications[jobId].nextSteps = [];
  }

  applications[jobId].nextSteps.push({
    action,
    dueDate,
    completed: false
  });

  await saveApplications(applications);
  return applications[jobId];
}

export async function completeNextStep(
  jobId: string,
  index: number
): Promise<ApplicationStatus> {
  const applications = await loadApplications();

  if (!applications[jobId]?.nextSteps?.[index]) {
    throw new Error('Step not found');
  }

  applications[jobId].nextSteps[index].completed = true;
  await saveApplications(applications);
  return applications[jobId];
}

export async function addContact(
  jobId: string,
  contact: ApplicationStatus['contacts'][0]
): Promise<ApplicationStatus> {
  const applications = await loadApplications();

  if (!applications[jobId]) {
    throw new Error('Application not found');
  }

  if (!applications[jobId].contacts) {
    applications[jobId].contacts = [];
  }

  applications[jobId].contacts.push(contact);
  await saveApplications(applications);
  return applications[jobId];
}

export async function addOffer(
  jobId: string,
  compensation: ApplicationStatus['compensation']
): Promise<ApplicationStatus> {
  const applications = await loadApplications();

  if (!applications[jobId]) {
    throw new Error('Application not found');
  }

  applications[jobId].compensation = compensation;
  await saveApplications(applications);
  return applications[jobId];
}

export async function getApplicationStatus(jobId: string): Promise<ApplicationStatus | null> {
  const applications = await loadApplications();
  return applications[jobId] || null;
}

export async function getAllApplications(): Promise<ApplicationStatus[]> {
  const applications = await loadApplications();
  return Object.values(applications);
}

export async function getActiveApplications(): Promise<ApplicationStatus[]> {
  const applications = await loadApplications();
  return Object.values(applications).filter(app =>
    ['applied', 'interviewing'].includes(app.status)
  );
}

export async function getUpcomingSteps(): Promise<{
  jobId: string;
  step: ApplicationStatus['nextSteps'][0];
}[]> {
  const applications = await loadApplications();
  
  const steps = Object.entries(applications).flatMap(([jobId, app]) =>
    (app.nextSteps || [])
      .filter(step => !step.completed)
      .map(step => ({ jobId, step }))
  );

  return steps.sort((a, b) => 
    new Date(a.step.dueDate).getTime() - new Date(b.step.dueDate).getTime()
  );
}
