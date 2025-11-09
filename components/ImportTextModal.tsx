import React, { useState } from 'react';
import type { JournalEntry } from '../types';
import { createJournalEntryFromText } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';

interface ImportTextModalProps {
  onClose: () => void;
  onCreate: (entryData: Partial<JournalEntry> & { content: string }) => void;
}

const ImportTextModal: React.FC<ImportTextModalProps> = ({ onClose, onCreate }) => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const placeholderText = `在這裡貼上您的會議紀錄、專案筆記，或任何您想記錄的文字...

例如：

115年「解癮-解開毒品上癮的真相」反毒教育特展
第1次籌備會議紀錄
時間: 114年9月17日(星期三)下午2時
地點: 花蓮縣政府2樓大簡報室
...
`;

    const handleAnalyze = async () => {
        if (!text.trim()) {
            setError('請先貼上文字內容。');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const result = await createJournalEntryFromText(text);
            onCreate({
                ...result,
                content: text, // Pass the original text as content
            });
        } catch (e: any) {
            setError(e.message || '分析失敗，請檢查您的 API 金鑰或網路連線。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6 m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">AI 智慧匯入</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2">
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={placeholderText}
                        className="w-full h-full min-h-[300px] p-3 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition"
                        disabled={isLoading}
                        aria-label="Text to import"
                    />
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end gap-3">
                    <button onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                        取消
                    </button>
                    <button onClick={handleAnalyze} disabled={isLoading} className="inline-flex items-center gap-2 justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 disabled:cursor-not-allowed">
                        <SparklesIcon className="w-5 h-5"/>
                        {isLoading ? '分析中...' : 'AI 分析並建立紀錄'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportTextModal;
