import React from 'react';
import type { Regulation, GroundingSource } from '../types';
import RegulationCard from './RegulationCard';
import SourceLinks from './SourceLinks';

interface ResultsDisplayProps {
  regulations: Regulation[];
  sources: GroundingSource[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ regulations, sources }) => {
  if (regulations.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">找不到相關法規，請嘗試使用不同的關鍵字或情境描述。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-semibold text-gray-800 border-b border-gray-200 pb-2">查詢結果</h2>
      {regulations.map((reg, index) => (
        <RegulationCard key={index} regulation={reg} />
      ))}
      <SourceLinks sources={sources} />
    </div>
  );
};

export default ResultsDisplay;
