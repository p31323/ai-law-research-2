import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Regulation, GroundingSource } from './types';
import { fetchRegulations } from './services/geminiService';
import { countryLanguageOptions } from './constants';
import Header from './components/Header';
import SearchControls from './components/SearchControls';
import ResultsDisplay from './components/ResultsDisplay';
import ProgressBar from './components/ProgressBar';
import InitialState from './components/InitialState';
import SourceLinks from './components/SourceLinks';

const App: React.FC = () => {
  const [results, setResults] = useState<Regulation[]>([]);
  const [rawText, setRawText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<string>('Taiwan');
  const [language, setLanguage] = useState<string>('正體中文');
  const [sources, setSources] = useState<GroundingSource[]>([]);
  
  const progressIntervalRef = useRef<number | null>(null);

  const stopProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Effect for cleaning up interval on component unmount
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

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setError('請輸入查詢內容。');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults([]);
    setRawText(null);
    setSources([]);

    // --- Start fake progress simulation ---
    setProgress(0);
    stopProgress(); // Clear any existing interval
    progressIntervalRef.current = window.setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          stopProgress();
          return 95;
        }
        // Simulate a non-linear progress
        if (prev < 50) return prev + Math.random() * 5;
        if (prev < 80) return prev + Math.random() * 3;
        if (prev < 95) return prev + Math.random() * 1;
        return prev + 0.5;
      });
    }, 400);

    try {
      const { regulations, rawText, sources: fetchedSources } = await fetchRegulations(searchQuery, country, language);
      setSources(fetchedSources);

      if (regulations) {
        setResults(regulations);
        setRawText(null);
      } else {
         const trimmedText = rawText.trim();
         setRawText(trimmedText ? trimmedText : null);
         if (trimmedText) {
            setError('AI 回應的格式無法解析，但已顯示原始文字內容。');
         } else if (fetchedSources.length === 0) {
            setError('找不到相關資訊，請嘗試使用不同的關鍵字或情境描述。');
         }
      }
    } catch (err) {
      console.error(err);
      setError('查詢時發生錯誤，請稍後再試。可能是 API 金鑰未設定或無效。');
    } finally {
      stopProgress();
      setProgress(100);
      // Wait for the 100% animation to be seen before hiding
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, [stopProgress, country, language]);

  return (
    <div className="min-h-screen font-sans text-gray-800">
      <Header />
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
          <p className="text-gray-600 mb-4">
            選擇目標國家與語言，然後輸入法律問題、情境或關鍵字。
          </p>
          <SearchControls 
            onSearch={handleSearch} 
            isLoading={isLoading}
            country={country}
            language={language}
            onCountryChange={handleCountryChange}
            onLanguageChange={setLanguage}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">發生錯誤：</strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {isLoading && <ProgressBar progress={progress} />}
        
        {!isLoading && results.length === 0 && rawText === null && sources.length === 0 && <InitialState />}

        {results.length > 0 && <ResultsDisplay regulations={results} sources={sources} />}
        
        { !isLoading && results.length === 0 && (rawText || sources.length > 0) &&
          <div className="space-y-6">
            {rawText && (
               <div className="bg-gray-50 border border-gray-200 text-gray-800 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-2">AI 原始回應</h3>
                  <pre className="whitespace-pre-wrap font-sans text-sm">{rawText}</pre>
              </div>
            )}
            {sources.length > 0 && <SourceLinks sources={sources} />}
          </div>
        }

      </main>
    </div>
  );
};

export default App;
