import React, { useState } from 'react';
import { countryLanguageOptions } from '../constants';

interface SearchControlsProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  country: string;
  language: string;
  onCountryChange: (country: string) => void;
  onLanguageChange: (language: string) => void;
}

const SearchControls: React.FC<SearchControlsProps> = ({ 
  onSearch, 
  isLoading, 
  country, 
  language, 
  onCountryChange, 
  onLanguageChange 
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const availableLanguages = countryLanguageOptions[country] || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="country-select" className="block text-sm font-medium text-gray-700 mb-1">國家 / 地區</label>
          <select 
            id="country-select"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 disabled:bg-gray-100"
          >
            {Object.keys(countryLanguageOptions).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-1">回應語言</label>
          <select 
            id="language-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            disabled={isLoading || availableLanguages.length <= 1}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 disabled:bg-gray-100"
          >
            {availableLanguages.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {country === 'Taiwan' && (
        <div className="flex items-start text-sm text-gray-600 p-3 bg-blue-50 border border-blue-100 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            台灣地區查詢已特別優化：AI 將優先從中華民國「全國法規資料庫」網站擷取與引用資料，以確保資訊的準確性與權威性。
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="輸入法律問題、情境或關鍵字..."
          className="flex-grow w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="flex items-center justify-center bg-blue-600 text-white font-bold px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <span>查詢</span>
        </button>
      </div>
    </form>
  );
};

export default SearchControls;