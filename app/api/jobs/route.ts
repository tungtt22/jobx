import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/app/lib/api-utils';

// In-memory storage for jobs
let jobs = [
  {
    id: '1',
    title: 'Frontend Developer',
    company: 'Tech Corp',
    location: 'Remote',
    description: 'Looking for a skilled frontend developer...',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// GET /api/jobs - Get all jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search')?.toLowerCase() || '';

    let filteredJobs = jobs;
    
    // Simple search implementation
    if (search) {
      filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(search) ||
        job.company.toLowerCase().includes(search) ||
        job.description.toLowerCase().includes(search)
      );
    }

    // Simple pagination
    const start = (page - 1) * limit;
    const paginatedJobs = filteredJobs.slice(start, start + limit);

    return successResponse({
      jobs: paginatedJobs,
      total: filteredJobs.length,
      page,
      limit
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.company || !body.description) {
      return errorResponse('Missing required fields');
    }

    const newJob = {
      id: Date.now().toString(),
      title: body.title,
      company: body.company,
      location: body.location || 'Remote',
      description: body.description,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    jobs.push(newJob);
    return successResponse(newJob, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/jobs/:id - Update a job
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = request.url.split('/jobs/')[1];

    const jobIndex = jobs.findIndex(job => job.id === id);
    if (jobIndex === -1) {
      return errorResponse('Job not found', 404);
    }

    jobs[jobIndex] = {
      ...jobs[jobIndex],
      ...body,
      updatedAt: new Date()
    };

    return successResponse(jobs[jobIndex]);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/jobs/:id - Delete a job
export async function DELETE(request: NextRequest) {
  try {
    const id = request.url.split('/jobs/')[1];

    const jobIndex = jobs.findIndex(job => job.id === id);
    if (jobIndex === -1) {
      return errorResponse('Job not found', 404);
    }

    jobs = jobs.filter(job => job.id !== id);
    return successResponse({ message: 'Job deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}