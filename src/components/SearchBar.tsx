"use client";

import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a product..."
          className="w-full p-4 pr-12 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <button
          type="submit"
          className="absolute right-2.5 p-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:ring-4 focus:outline-none"
        >
          <MagnifyingGlassIcon className="w-5 h-5" aria-hidden="true" />
          <span className="sr-only">Search</span>
        </button>
      </div>
    </form>
  );
} 