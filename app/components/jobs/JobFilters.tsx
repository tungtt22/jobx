'use client';

import { useState } from 'react';
import { JobCategory, JobRegion, JobSearchFilters, ContractType, SalaryRange } from '@/app/types/job';

interface JobFiltersProps {
  onApplyFilters: (filters: JobSearchFilters) => void;
  onClose: () => void;
  initialFilters?: JobSearchFilters;
}

const ALL_CATEGORIES: JobCategory[] = ['DevSecOps', 'DevOps', 'SRE', 'Cloud', 'Other'];
const ALL_REGIONS: JobRegion[] = ['APAC', 'EU', 'NA', 'OTHER'];
const ALL_CONTRACT_TYPES: ContractType[] = ['remote', 'contract', 'permanent', 'hybrid', 'onsite'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'AUD'];

export default function JobFilters({
  onApplyFilters,
  onClose,
  initialFilters,
}: JobFiltersProps) {
  const [filters, setFilters] = useState<JobSearchFilters>(initialFilters || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters(filters);
    onClose();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ALL_CATEGORIES.map((category) => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.categories?.includes(category)}
                  onChange={(e) => {
                    const newCategories = e.target.checked
                      ? [...(filters.categories || []), category]
                      : filters.categories?.filter((c) => c !== category);
                    setFilters({ ...filters, categories: newCategories });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Regions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Regions
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ALL_REGIONS.map((region) => (
              <label key={region} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.regions?.includes(region)}
                  onChange={(e) => {
                    const newRegions = e.target.checked
                      ? [...(filters.regions || []), region]
                      : filters.regions?.filter((r) => r !== region);
                    setFilters({ ...filters, regions: newRegions });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">{region}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Contract Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contract Types
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ALL_CONTRACT_TYPES.map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.contractTypes?.includes(type)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...(filters.contractTypes || []), type]
                      : filters.contractTypes?.filter((t) => t !== type);
                    setFilters({ ...filters, contractTypes: newTypes });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Salary Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salary Range
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Min</label>
              <input
                type="number"
                value={filters.salary?.min || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    salary: {
                      ...filters.salary,
                      min: parseInt(e.target.value) || undefined
                    }
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Max</label>
              <input
                type="number"
                value={filters.salary?.max || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    salary: {
                      ...filters.salary,
                      max: parseInt(e.target.value) || undefined
                    }
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="mt-2">
            <select
              value={filters.salary?.currency || 'USD'}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  salary: {
                    ...filters.salary,
                    currency: e.target.value
                  }
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Other filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Other Filters
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isBookmarked}
                onChange={(e) =>
                  setFilters({ ...filters, isBookmarked: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Bookmarked only</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!filters.isIgnored}
                onChange={(e) =>
                  setFilters({ ...filters, isIgnored: !e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Hide ignored</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
}