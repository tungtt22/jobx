'use client';

import { useState } from 'react';
import Button from './Button';

interface CollectionResult {
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
  stats: any;
  duration: number;
}

export default function JobCollector() {
  const [isCollecting, setIsCollecting] = useState(false);
  const [result, setResult] = useState<CollectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCollect = async () => {
    setIsCollecting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/collector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries: ['developer', 'engineer', 'programmer', 'software', 'frontend', 'backend'],
          locations: ['Vietnam', 'Remote', 'Ho Chi Minh', 'Hanoi'],
          categories: ['Frontend', 'Backend', 'Fullstack', 'DevOps', 'Mobile'],
          maxJobsPerSource: 30
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Job Collection System</h2>
      
      <div className="mb-6">
        <Button
          onClick={handleCollect}
          disabled={isCollecting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
        >
          {isCollecting ? 'Collecting Jobs...' : 'Start Job Collection'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <h3 className="font-bold">Collection Completed Successfully!</h3>
            <p>Duration: {result.duration}ms</p>
            <p>Total Jobs: {result.totalJobs}</p>
            <p>New Jobs Added: {result.newJobs}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-100 rounded">
              <h4 className="font-bold mb-2">Sources Results</h4>
              <div className="space-y-2">
                {Object.entries(result.sources).map(([source, data]) => (
                  <div key={source} className="flex justify-between items-center">
                    <span className="capitalize">{source}</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      data.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {data.success ? `${data.jobsCollected} jobs` : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-100 rounded">
              <h4 className="font-bold mb-2">Statistics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>By Source:</span>
                  <span>{Object.keys(result.stats.bySource || {}).length} sources</span>
                </div>
                <div className="flex justify-between">
                  <span>By Category:</span>
                  <span>{Object.keys(result.stats.byCategory || {}).length} categories</span>
                </div>
                <div className="flex justify-between">
                  <span>By Region:</span>
                  <span>{Object.keys(result.stats.byRegion || {}).length} regions</span>
                </div>
                <div className="flex justify-between">
                  <span>With Salary:</span>
                  <span>{result.stats.bySalary?.withSalary || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {result.sources && Object.values(result.sources).some(s => s.errors) && (
            <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              <h4 className="font-bold mb-2">Errors:</h4>
              {Object.entries(result.sources)
                .filter(([_, data]) => data.errors)
                .map(([source, data]) => (
                  <div key={source} className="mb-2">
                    <strong>{source}:</strong> {data.errors?.join(', ')}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
