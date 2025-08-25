import React, { useState } from 'react';
import { countryLanguageOptions } from '../constants';
import type { SearchFilters, PolicySearchFilters } from '../App';

interface SearchControlsProps {
  searchType: 'law' | 'policy';
  onSearch: (query: string, filters: SearchFilters | PolicySearchFilters) => void;
  isLoading: boolean;
  country: string;
  language: string;
  onCountryChange: (country: string) => void;
  onLanguageChange: (language: string) => void;
}

const SearchControls: React.FC<SearchControlsProps> = ({ 
  searchType,
  onSearch, 
  isLoading, 
  country, 
  language, 
  onCountryChange, 
  onLanguageChange 
}) => {
  const [query, setQuery] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Law filters
  const [competentAuthority, setCompetentAuthority] = useState('');
  const [lawDateFrom, setLawDateFrom] = useState('');
  const [lawDateTo, setLawDateTo] = useState('');

  // Policy filters
  const [policyDateFrom, setPolicyDateFrom] = useState('');
  const [policyDateTo, setPolicyDateTo] = useState('');
  const [includeKeywords, setIncludeKeywords] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState('');


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchType === 'law') {
        onSearch(query, { competentAuthority, dateFrom: lawDateFrom, dateTo: lawDateTo });
    } else {
        onSearch(query, { dateFrom: policyDateFrom, dateTo: policyDateTo, includeKeywords, excludeKeywords });
    }
  };

  const availableLanguages = countryLanguageOptions[country] || [];

  const placeholderText = searchType === 'law' 
    ? "輸入法律問題、情境或關鍵字..." 
    : "輸入政策主題、計畫名稱或關鍵字...";
    
  const exampleText = searchType === 'law'
    ? "例如：「在公共場所室內吸菸的罰則是什麼？」"
    : "例如：「2050 淨零排放路徑」、「數位發展計畫」";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label htmlFor="country-select" className="block text-sm font-medium text-gray-700">國家 / 地區</label>
          <select 
            id="country-select"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            disabled={isLoading}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 disabled:bg-gray-50"
          >
            {Object.keys(countryLanguageOptions).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="language-select" className="block text-sm font-medium text-gray-700">回應語言</label>
          <select 
            id="language-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            disabled={isLoading || availableLanguages.length <= 1}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 disabled:bg-gray-50"
          >
            {availableLanguages.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {searchType === 'law' && country === 'Taiwan' && (
        <div className="flex items-start text-sm text-gray-600 p-3 bg-blue-50 border border-blue-100 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            台灣地區查詢已特別優化：AI 將優先從中華民國「全國法規資料庫」網站擷取與引用資料，以確保資訊的準確性與權威性。
          </p>
        </div>
      )}

      <div>
        <label htmlFor="search-query" className="block text-sm font-medium text-gray-700">查詢內容</label>
        <input
          id="search-query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholderText}
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition duration-200 disabled:bg-gray-50"
          disabled={isLoading}
          aria-describedby="query-description"
          required
        />
        <p id="query-description" className="mt-2 text-sm text-gray-500">{exampleText}</p>
      </div>
      
      <div
        id="advanced-filters-panel"
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isAdvancedOpen ? 'max-h-[30rem] opacity-100 pt-6' : 'max-h-0 opacity-0'}`}
        style={{ transitionProperty: 'max-height, opacity, padding' }}
        >
        {searchType === 'law' && (
            <div className="p-5 bg-gray-100/70 rounded-lg border border-gray-200 space-y-4">
                <h3 className="text-base font-semibold text-gray-800">法規進階設定</h3>
                <div>
                    <label htmlFor="competent-authority" className="block text-sm font-medium text-gray-700">主管機關</label>
                    <input
                        id="competent-authority"
                        type="text"
                        value={competentAuthority}
                        onChange={(e) => setCompetentAuthority(e.target.value)}
                        placeholder="例如：勞動部、衛生福利部"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition duration-200 disabled:bg-gray-50"
                        disabled={isLoading}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="law-date-from" className="block text-sm font-medium text-gray-700">最新修正日期 (起)</label>
                        <input
                            id="law-date-from"
                            type="date"
                            value={lawDateFrom}
                            onChange={(e) => setLawDateFrom(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition duration-200 disabled:bg-gray-50"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="law-date-to" className="block text-sm font-medium text-gray-700">最新修正日期 (迄)</label>
                        <input
                            id="law-date-to"
                            type="date"
                            value={lawDateTo}
                            onChange={(e) => setLawDateTo(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition duration-200 disabled:bg-gray-50"
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>
        )}
        {searchType === 'policy' && (
             <div className="p-5 bg-gray-100/70 rounded-lg border border-gray-200 space-y-4">
                <h3 className="text-base font-semibold text-gray-800">政策進階設定</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="policy-date-from" className="block text-sm font-medium text-gray-700">公告日期 (起)</label>
                        <input
                            id="policy-date-from"
                            type="date"
                            value={policyDateFrom}
                            onChange={(e) => setPolicyDateFrom(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition duration-200 disabled:bg-gray-50"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="policy-date-to" className="block text-sm font-medium text-gray-700">公告日期 (迄)</label>
                        <input
                            id="policy-date-to"
                            type="date"
                            value={policyDateTo}
                            onChange={(e) => setPolicyDateTo(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition duration-200 disabled:bg-gray-50"
                            disabled={isLoading}
                        />
                    </div>
                </div>
                 <div>
                  <label htmlFor="include-keywords" className="block text-sm font-medium text-gray-700">包含關鍵字</label>
                  <input
                      id="include-keywords"
                      type="text"
                      value={includeKeywords}
                      onChange={(e) => setIncludeKeywords(e.target.value)}
                      placeholder="例如：半導體、再生能源 (以逗號分隔)"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition duration-200 disabled:bg-gray-50"
                      disabled={isLoading}
                  />
              </div>
               <div>
                  <label htmlFor="exclude-keywords" className="block text-sm font-medium text-gray-700">排除關鍵字</label>
                  <input
                      id="exclude-keywords"
                      type="text"
                      value={excludeKeywords}
                      onChange={(e) => setExcludeKeywords(e.target.value)}
                      placeholder="例如：觀光、農業 (以逗號分隔)"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition duration-200 disabled:bg-gray-50"
                      disabled={isLoading}
                  />
              </div>
            </div>
        )}
      </div>


      <div className="border-t border-gray-200 pt-5 flex justify-between items-center flex-wrap gap-4">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md p-2 -ml-2 border border-blue-500 hover:bg-blue-50"
            aria-expanded={isAdvancedOpen}
            aria-controls="advanced-filters-panel"
          >
            <span>進階篩選</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 ml-1 transition-transform duration-300 ${isAdvancedOpen ? 'rotate-180' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

        <button
          type="submit"
          className="flex items-center justify-center bg-blue-600 text-white font-semibold px-6 py-3 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <span>{isLoading ? '查詢中...' : '開始查詢'}</span>
        </button>
      </div>
    </form>
  );
};

export default SearchControls;