import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Regulation, GroundingSource, Policy } from './types';
import { fetchRegulations, fetchPolicies, translateText } from './services/geminiService';
import { countryLanguageOptions } from './constants';
import Header from './components/Header';
import SearchControls from './components/SearchControls';
import ResultsDisplay from './components/ResultsDisplay';
import ProgressBar from './components/ProgressBar';
import InitialState from './components/InitialState';
import SourceLinks from './components/SourceLinks';

export interface SearchFilters {
  competentAuthority: string;
  dateFrom: string;
  dateTo: string;
}

export interface PolicySearchFilters {
  dateFrom: string;
  dateTo: string;
  includeKeywords: string;
  excludeKeywords: string;
}

// +++ Policy Display Components (defined here to avoid creating new files) +++

const PolicyTranslationControls: React.FC<{
    isTranslating: boolean;
    onTranslate: (lang: string) => void;
}> = ({ isTranslating, onTranslate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const translationLanguages = ['正體中文', 'English', '日本語', 'Deutsch', 'Français'];
    
    const handleSelectLanguage = (lang: string) => {
        setIsMenuOpen(false);
        onTranslate(lang);
    };

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    disabled={isTranslating}
                    className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-wait"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`-ml-1 mr-2 h-5 w-5 ${isTranslating ? 'animate-spin' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502" />
                    </svg>
                    {isTranslating ? '翻譯中...' : '翻譯'}
                    <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            {isMenuOpen && (
                 <div
                    onMouseLeave={() => setIsMenuOpen(false)}
                    className="origin-bottom-right absolute right-0 bottom-full mb-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="py-1" role="none">
                        {translationLanguages.map((lang) => (
                             <a
                                key={lang}
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSelectLanguage(lang);
                                }}
                                className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"
                                role="menuitem"
                            >
                                {lang}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const PolicyCard: React.FC<{ policy: Policy }> = ({ policy }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translated, setTranslated] = useState<{ summary: string; keyPoints: string[]; lang: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async (lang: string) => {
    if (translated && translated.lang === lang) return;

    setIsTranslating(true);
    setError(null);
    setTranslated(null);

    try {
        const translations = await Promise.all([
            translateText(policy.summary, lang),
            ...policy.keyPoints.map(point => translateText(point, lang))
        ]);
        const [translatedSummary, ...translatedKeyPoints] = translations;
        setTranslated({ summary: translatedSummary, keyPoints: translatedKeyPoints, lang });
    } catch (err) {
        setError(err instanceof Error ? err.message : '翻譯失敗，請稍後再試。');
    } finally {
        setIsTranslating(false);
    }
  };
  
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 transition-shadow hover:shadow-md animate-fade-in">
      {/* Card Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-xl font-bold text-green-800">{policy.policyName}</h3>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm text-gray-600">
          <div><span className="font-medium">發布機關:</span> {policy.issuingAgency}</div>
          <div><span className="font-medium">發布日期:</span> {policy.publicationDate}</div>
          <div><span className="font-medium">狀態:</span> <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">{policy.status}</span></div>
        </div>
      </div>
      
      {/* Card Body */}
      <div className="px-6 py-5 space-y-5">
        {/* Summary */}
        <div>
          <h4 className="font-semibold text-gray-800 flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            政策摘要
          </h4>
          <div className="mt-2 text-gray-700 bg-gray-50/70 p-4 rounded-md border border-gray-200 text-sm leading-relaxed">
            {policy.summary}
          </div>
           {translated && translated.summary && (
            <div className="mt-3 p-4 bg-green-50 rounded-md border border-green-200">
                <h5 className="text-sm font-semibold text-green-700">{translated.lang} 譯文</h5>
                <p className="mt-2 text-gray-700 text-sm leading-relaxed">{translated.summary}</p>
            </div>
          )}
        </div>

        {/* Key Points */}
        {policy.keyPoints && policy.keyPoints.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              主要重點
            </h4>
            <ul className="mt-2 space-y-2 pl-5">
              {policy.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start">
                    <svg className="w-4 h-4 mr-2 mt-1 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span className="text-gray-700 text-sm">{point}</span>
                </li>
              ))}
            </ul>
            {translated && translated.keyPoints.length > 0 && (
              <div className="mt-3 p-4 bg-green-50 rounded-md border border-green-200">
                <h5 className="text-sm font-semibold text-green-700">{translated.lang} 譯文</h5>
                <ul className="mt-2 space-y-2">
                  {translated.keyPoints.map((point, index) => (
                     <li key={index} className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-1 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-gray-700 text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
      
       {/* Card Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end flex-wrap gap-4">
             <PolicyTranslationControls 
                isTranslating={isTranslating}
                onTranslate={handleTranslate}
             />
        </div>
    </div>
  );
};


const PolicyResultsDisplay: React.FC<{ policies: Policy[], sources: GroundingSource[] }> = ({ policies, sources }) => {
  if (policies.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">找不到相關政策，請嘗試使用不同的關鍵字或情境描述。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-semibold text-gray-800 border-b border-gray-200 pb-2">查詢結果</h2>
      {policies.map((policy, index) => (
        <PolicyCard key={index} policy={policy} />
      ))}
      {/* Ensure data sources are always displayed with results */}
      <SourceLinks sources={sources} />
    </div>
  );
};

// --- End of Policy Display Components ---


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'law' | 'policy'>('law');

  // States for Law search
  const [lawResults, setLawResults] = useState<Regulation[]>([]);
  const [lawRawText, setLawRawText] = useState<string | null>(null);
  const [isLawLoading, setIsLawLoading] = useState(false);
  const [lawProgress, setLawProgress] = useState(0);
  const [lawError, setLawError] = useState<string | null>(null);
  const [lawSources, setLawSources] = useState<GroundingSource[]>([]);
  
  // States for Policy search
  const [policyResults, setPolicyResults] = useState<Policy[]>([]);
  const [policyRawText, setPolicyRawText] = useState<string | null>(null);
  const [isPolicyLoading, setIsPolicyLoading] = useState(false);
  const [policyProgress, setPolicyProgress] = useState(0);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policySources, setPolicySources] = useState<GroundingSource[]>([]);

  const [country, setCountry] = useState<string>('Taiwan');
  const [language, setLanguage] = useState<string>('正體中文');
  
  const progressIntervalRef = useRef<number | null>(null);

  const stopProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopProgress();
    };
  }, [stopProgress]);

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const newLanguages = countryLanguageOptions[newCountry] || [];
    setLanguage(newLanguages[0] || '');
  };

  const startProgressSimulation = (setProgress: React.Dispatch<React.SetStateAction<number>>) => {
      setProgress(0);
      stopProgress();
      progressIntervalRef.current = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            stopProgress();
            return 95;
          }
          if (prev < 50) return prev + Math.random() * 5;
          if (prev < 80) return prev + Math.random() * 3;
          return prev + Math.random() * 1.5;
        });
      }, 400);
  };

  const handleLawSearch = useCallback(async (searchQuery: string, filters: SearchFilters) => {
    if (!searchQuery.trim()) {
      setLawError('請輸入查詢內容。');
      return;
    }
    setIsLawLoading(true);
    setLawError(null);
    setLawResults([]);
    setLawRawText(null);
    setLawSources([]);

    startProgressSimulation(setLawProgress);

    try {
      const { regulations, rawText, sources: fetchedSources } = await fetchRegulations(searchQuery, country, language, filters);

      // A valid result MUST have both regulations and sources.
      if (regulations && regulations.length > 0 && fetchedSources && fetchedSources.length > 0) {
        setLawSources(fetchedSources);
        setLawResults(regulations);
        setLawRawText(null);
        setLawError(null);
      } else {
        setLawResults([]);
        setLawSources([]);
        
        const trimmedText = rawText.trim();
        const isMeaningfulRawText = trimmedText && trimmedText !== '[]';
        
        setLawRawText(isMeaningfulRawText ? trimmedText : null);

        if (isMeaningfulRawText) {
          setLawError('AI 回應的格式無法解析或不符合來源要求，但已顯示原始文字內容。');
        } else {
          setLawError('找不到相關資訊，請嘗試使用不同的關鍵字或情境描述。');
        }
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '查詢時發生未知的錯誤，請稍後再試。';
      setLawError(errorMessage);
    } finally {
      stopProgress();
      setLawProgress(100);
      setTimeout(() => {
        setIsLawLoading(false);
      }, 500);
    }
  }, [stopProgress, country, language]);

  const handlePolicySearch = useCallback(async (searchQuery: string, filters: PolicySearchFilters) => {
    if (!searchQuery.trim()) {
      setPolicyError('請輸入查詢內容。');
      return;
    }
    setIsPolicyLoading(true);
    setPolicyError(null);
    setPolicyResults([]);
    setPolicyRawText(null);
    setPolicySources([]);

    startProgressSimulation(setPolicyProgress);

    try {
      const { policies, rawText, sources: fetchedSources } = await fetchPolicies(searchQuery, country, language, filters);

      // A valid result MUST have both policies and sources.
      if (policies && policies.length > 0 && fetchedSources && fetchedSources.length > 0) {
        setPolicySources(fetchedSources);
        setPolicyResults(policies);
        setPolicyRawText(null);
        setPolicyError(null);
      } else {
        setPolicyResults([]);
        setPolicySources([]);
        
        const trimmedText = rawText.trim();
        const isMeaningfulRawText = trimmedText && trimmedText !== '[]';

        setPolicyRawText(isMeaningfulRawText ? trimmedText : null);

        if (isMeaningfulRawText) {
          setPolicyError('AI 回應的格式無法解析或不符合來源要求，但已顯示原始文字內容。');
        } else {
          setPolicyError('找不到相關資訊，請嘗試使用不同的關鍵字或情境描述。');
        }
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '查詢時發生未知的錯誤，請稍後再試。';
      setPolicyError(errorMessage);
    } finally {
      stopProgress();
      setPolicyProgress(100);
      setTimeout(() => {
        setIsPolicyLoading(false);
      }, 500);
    }
  }, [stopProgress, country, language]);


  const renderContent = () => {
    if (activeTab === 'law') {
      return (
        <>
          {lawError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <strong className="font-bold">發生錯誤：</strong>
              <span className="block sm:inline">{lawError}</span>
            </div>
          )}
          {isLawLoading && <ProgressBar progress={lawProgress} />}
          {!isLawLoading && lawResults.length === 0 && lawRawText === null && lawError === null && <InitialState />}
          {lawResults.length > 0 && <ResultsDisplay regulations={lawResults} sources={lawSources} />}
          {!isLawLoading && lawResults.length === 0 && lawRawText &&
            <div className="space-y-6">
              {lawRawText && (
                 <div className="bg-gray-50 border border-gray-200 text-gray-800 p-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">AI 原始回應</h3>
                    <pre className="whitespace-pre-wrap font-sans text-sm">{lawRawText}</pre>
                </div>
              )}
              {lawSources.length > 0 && <SourceLinks sources={lawSources} />}
            </div>
          }
        </>
      );
    }

    if (activeTab === 'policy') {
       return (
        <>
          {policyError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <strong className="font-bold">發生錯誤：</strong>
              <span className="block sm:inline">{policyError}</span>
            </div>
          )}
          {isPolicyLoading && <ProgressBar progress={policyProgress} />}
          {!isPolicyLoading && policyResults.length === 0 && policyRawText === null && policyError === null && <InitialState />}
          {policyResults.length > 0 && <PolicyResultsDisplay policies={policyResults} sources={policySources} />}
          {!isPolicyLoading && policyResults.length === 0 && policyRawText &&
            <div className="space-y-6">
              {policyRawText && (
                 <div className="bg-gray-50 border border-gray-200 text-gray-800 p-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">AI 原始回應</h3>
                    <pre className="whitespace-pre-wrap font-sans text-sm">{policyRawText}</pre>
                </div>
              )}
              {policySources.length > 0 && <SourceLinks sources={policySources} />}
            </div>
          }
        </>
      );
    }
    return null;
  };
  
  const getTabClassName = (tabName: 'law' | 'policy') => 
    `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm cursor-pointer transition-colors duration-200 ease-in-out ${
      activeTab === tabName
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    }`;


  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header />
      <main className="max-w-4xl mx-auto p-4 md:p-8">

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('law')}
              className={getTabClassName('law')}
              role="tab"
              aria-selected={activeTab === 'law'}
            >
              法規查詢
            </button>
            <button
              onClick={() => setActiveTab('policy')}
              className={getTabClassName('policy')}
              role="tab"
              aria-selected={activeTab === 'policy'}
            >
              政策查詢
            </button>
          </nav>
        </div>

        <section aria-labelledby="search-heading" className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8 overflow-hidden">
           <div className="p-6 md:p-8">
              <h2 id="search-heading" className="text-xl font-semibold text-gray-900">
                {activeTab === 'law' ? 'AI 法律查詢' : 'AI 政策查詢'}
              </h2>
              <p className="mt-1 text-gray-600">
                {activeTab === 'law' 
                    ? '選擇目標國家與語言，然後輸入您的法律問題、情境或關鍵字。'
                    : '輸入關鍵字，尋找相關的政府政策、計畫或最新動態。'
                }
              </p>
          </div>
          <div className="bg-gray-50/70 p-6 md:p-8 border-t border-gray-200">
              <SearchControls 
                key={activeTab} // Add key to force re-render and reset state on tab change
                searchType={activeTab}
                onSearch={(query, filters) => {
                  if (activeTab === 'law') {
                    handleLawSearch(query, filters as SearchFilters);
                  } else {
                    handlePolicySearch(query, filters as PolicySearchFilters);
                  }
                }}
                isLoading={activeTab === 'law' ? isLawLoading : isPolicyLoading}
                country={country}
                language={language}
                onCountryChange={handleCountryChange}
                onLanguageChange={setLanguage}
              />
          </div>
        </section>

        {renderContent()}

      </main>
    </div>
  );
};

export default App;