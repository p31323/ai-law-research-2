import React, { useState } from 'react';
import type { Regulation } from '../types';
import { translateText } from '../services/geminiService';

const DetailItem: React.FC<{ label: string; value?: string; }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="mt-1 text-gray-800">{value}</p>
        </div>
    );
};

const TranslationControls: React.FC<{
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


const RegulationCard: React.FC<{ regulation: Regulation }> = ({ regulation }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translated, setTranslated] = useState<{ content: string; penalty: string; lang: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async (lang: string) => {
    // If we have already translated to this language, don't do it again
    if (translated && translated.lang === lang) return;

    setIsTranslating(true);
    setError(null);
    setTranslated(null);

    try {
        const [translatedContent, translatedPenalty] = await Promise.all([
            translateText(regulation.content, lang),
            regulation.penalty ? translateText(regulation.penalty, lang) : Promise.resolve(''),
        ]);
        setTranslated({ content: translatedContent, penalty: translatedPenalty, lang });
    } catch (err) {
        setError(err instanceof Error ? err.message : '翻譯失敗，請稍後再試。');
    } finally {
        setIsTranslating(false);
    }
  };


  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 transition-shadow hover:shadow-md">
        {/* Card Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xl font-bold text-blue-800">{regulation.regulationName}</h3>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
               <DetailItem label="主管機關" value={regulation.competentAuthority} />
               <DetailItem label="最新修正日期" value={regulation.lastAmendedDate} />
            </div>
        </div>
        
        {/* Card Body */}
        <div className="px-6 py-5 space-y-5">
            {/* Article Content */}
            <div>
                <h4 className="font-semibold text-gray-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    條文內容 ({regulation.article})
                </h4>
                <div className="mt-2 text-gray-800 whitespace-pre-wrap bg-gray-50/70 p-4 rounded-md border border-gray-200 font-mono text-sm">
                    {regulation.content}
                </div>
                {translated && translated.content && (
                    <div className="mt-3 p-4 bg-blue-50 rounded-md border border-blue-200">
                        <h5 className="text-sm font-semibold text-blue-700">{translated.lang} 譯文</h5>
                        <p className="mt-2 text-gray-800 whitespace-pre-wrap font-mono text-sm">{translated.content}</p>
                    </div>
                )}
            </div>

            {/* Penalty Content */}
            {regulation.penalty && (
                <div>
                    <h4 className="font-semibold text-yellow-800 flex items-center">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                        相關罰則
                    </h4>
                     <div className="mt-2 text-yellow-900 whitespace-pre-wrap bg-yellow-50 p-4 rounded-md border border-yellow-200 font-mono text-sm">
                        {regulation.penalty}
                    </div>
                    {translated && translated.penalty && (
                        <div className="mt-3 p-4 bg-yellow-50/70 rounded-md border border-yellow-100">
                             <h5 className="text-sm font-semibold text-yellow-800">{translated.lang} 譯文</h5>
                            <p className="mt-2 text-yellow-900 whitespace-pre-wrap font-mono text-sm">{translated.penalty}</p>
                        </div>
                    )}
                </div>
            )}
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>

        {/* Card Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end flex-wrap gap-4">
             <TranslationControls 
                isTranslating={isTranslating}
                onTranslate={handleTranslate}
             />
        </div>
    </div>
  );
};

export default RegulationCard;
