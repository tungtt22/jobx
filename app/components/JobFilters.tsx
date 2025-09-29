'use client';

import { useState } from 'react';

interface JobFiltersProps {
  onFiltersChange: (filters: {
    search: string;
    source: string;
    category: string;
    contractType: string;
    jobType: string;
    minSalary: number;
  }) => void;
  availableSources: string[];
  availableCategories: string[];
  availableContractTypes: string[];
  availableJobTypes: string[];
}

export default function JobFilters({
  onFiltersChange,
  availableSources,
  availableCategories,
  availableContractTypes,
  availableJobTypes
}: JobFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    category: '',
    contractType: '',
    jobType: '',
    minSalary: 0
  });

  const handleFilterChange = (key: string, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      source: '',
      category: '',
      contractType: '',
      jobType: '',
      minSalary: 0
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            placeholder="Search jobs, companies, skills..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Source Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source
          </label>
          <select
            value={filters.source}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Sources</option>
            {availableSources.map(source => (
              <option key={source} value={source}>
                {source.charAt(0).toUpperCase() + source.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {availableCategories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Contract Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contract Type
          </label>
          <select
            value={filters.contractType}
            onChange={(e) => handleFilterChange('contractType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {availableContractTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Job Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Type
          </label>
          <select
            value={filters.jobType}
            onChange={(e) => handleFilterChange('jobType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Job Types</option>
            {availableJobTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Min Salary Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Salary ($)
          </label>
          <input
            type="number"
            placeholder="0"
            value={filters.minSalary}
            onChange={(e) => handleFilterChange('minSalary', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Active Filters */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
              Search: {filters.search}
              <button
                onClick={() => handleFilterChange('search', '')}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.source && (
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
              Source: {filters.source}
              <button
                onClick={() => handleFilterChange('source', '')}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-md">
              Category: {filters.category}
              <button
                onClick={() => handleFilterChange('category', '')}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.contractType && (
            <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-md">
              Contract: {filters.contractType}
              <button
                onClick={() => handleFilterChange('contractType', '')}
                className="ml-1 text-orange-600 hover:text-orange-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.jobType && (
            <span className="inline-flex items-center px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-md">
              Job Type: {filters.jobType}
              <button
                onClick={() => handleFilterChange('jobType', '')}
                className="ml-1 text-pink-600 hover:text-pink-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.minSalary > 0 && (
            <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md">
              Min Salary: ${filters.minSalary}
              <button
                onClick={() => handleFilterChange('minSalary', 0)}
                className="ml-1 text-yellow-600 hover:text-yellow-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
