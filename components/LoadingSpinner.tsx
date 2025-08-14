import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      <p className="mt-4 text-slate-600">AI 正在查詢與分析法規，請稍候...</p>
    </div>
  );
};

export default LoadingSpinner;
