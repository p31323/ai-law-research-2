import React from 'react';
import type { GroundingSource } from '../types';

interface SourceLinksProps {
  sources: GroundingSource[];
}

const SourceLinks: React.FC<SourceLinksProps> = ({ sources }) => {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">資料來源</h3>
      <p className="text-sm text-gray-600 mb-4">
        AI 的回答基於以下網路資料來源。請注意，AI 可能會產生不準確的資訊，建議點擊連結進行事實核查。
      </p>
      <ul className="space-y-2 list-inside">
        {sources.map((source, index) => (
          <li key={index} className="flex items-start">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 mt-1 text-blue-500 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            <a
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline break-all"
            >
              {source.title || source.uri}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SourceLinks;
