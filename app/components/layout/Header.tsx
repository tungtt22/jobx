'use client';

import { useState } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';

interface HeaderProps {
  onSearch: (query: string) => void;
  onFilter: () => void;
}

export default function Header({ onSearch, onFilter }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="bg-white border-b border-gray-200 fixed w-full z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <form onSubmit={handleSubmit} className="flex-1 max-w-2xl">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
        <button
          onClick={onFilter}
          className="ml-4 px-4 py-2 flex items-center text-gray-700 hover:text-gray-900"
        >
          <FiFilter className="w-5 h-5 mr-2" />
          Filters
        </button>
      </div>
    </header>
  );
}
