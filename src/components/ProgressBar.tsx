import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const cappedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
        <div 
          className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-linear" 
          style={{ width: `${cappedProgress}%` }}
          role="progressbar"
          aria-valuenow={cappedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>
      <p className="text-gray-600 font-medium text-center" aria-live="polite">
        {`AI 正在查詢與分析法規... ${Math.round(cappedProgress)}%`}
      </p>
    </div>
  );
};

export default ProgressBar;
