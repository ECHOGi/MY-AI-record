import React, { useState, useEffect } from 'react';
import type { JournalEntry } from '../types';

interface VideoGenerationModalProps {
  projectTitle: string;
  entries: JournalEntry[];
  onClose: () => void;
  generateVideo: (projectTitle: string, entries: JournalEntry[], onProgress: (message: string) => void) => Promise<string>;
}

type GenerationState = 'idle' | 'generating' | 'success' | 'error';

const VideoGenerationModal: React.FC<VideoGenerationModalProps> = ({ projectTitle, entries, onClose, generateVideo }) => {
  const [state, setState] = useState<GenerationState>('idle');
  const [progressMessage, setProgressMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateClick = async () => {
    if (entries.length === 0) {
        setError("請先新增至少一筆日誌紀錄才能生成影片。");
        setState('error'); // Set state to error to show the retry button
        return;
    }

    setState('generating');
    setError(null);
    setProgressMessage('正在初始化...');

    try {
        const url = await generateVideo(projectTitle, entries, setProgressMessage);
        setVideoUrl(url);
        setState('success');
    } catch (e: any) {
        setError(e.message || "發生未知錯誤");
        setState('error');
    }
  };
  
  useEffect(() => {
    // Start generation automatically when the modal opens
    handleGenerateClick();
    
    // Cleanup the object URL when the component unmounts
    return () => {
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderContent = () => {
    switch (state) {
      case 'generating':
        return (
          <div className="text-center p-8">
            <div className="mx-auto w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-lg font-semibold mt-4 text-slate-800">影片生成中</h3>
            <p className="text-slate-500 mt-2">{progressMessage}</p>
             <p className="text-xs text-slate-400 mt-4">這可能需要幾分鐘的時間，請保持此視窗開啟。</p>
          </div>
        );
      case 'success':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-slate-800">影片已生成！</h3>
            {videoUrl && <video src={videoUrl} controls className="w-full rounded-md" />}
          </div>
        );
      case 'error':
         return (
             <div className="text-center p-8">
                <h3 className="text-lg font-semibold text-red-600">生成失敗</h3>
                <p className="text-slate-500 mt-2 bg-red-50 p-3 rounded-md">{error}</p>
             </div>
         );
      case 'idle':
        return null; // Should not happen with useEffect
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-800">AI 專案影片總結</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
            {renderContent()}
        </div>

        <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
            關閉
          </button>
          {state === 'success' && videoUrl && (
             <a href={videoUrl} download={`${projectTitle}_summary.mp4`} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700">
                下載影片
             </a>
          )}
           {state === 'error' && (
             <button onClick={handleGenerateClick} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700">
                重試
             </a >
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoGenerationModal;
