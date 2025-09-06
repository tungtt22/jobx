import { Suspense } from 'react';

async function getStats() {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    totalApplications: 12,
    activeJobs: 5,
    savedJobs: 8,
  };
}

function StatsCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-3xl font-semibold text-blue-600">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Total Applications" value={stats.totalApplications} />
        <StatsCard title="Active Jobs" value={stats.activeJobs} />
        <StatsCard title="Saved Jobs" value={stats.savedJobs} />
      </div>
    </div>
  );
}
