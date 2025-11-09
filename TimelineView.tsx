import React from 'react';
import type { JournalEntry } from '../types';
import { TagIcon } from './icons/TagIcon';

interface TimelineViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ entries, onSelectEntry }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-slate-700">時間軸是空的</h2>
        <p className="text-slate-500 mt-2">新增一些日誌紀錄來建立您的專案時間軸。</p>
      </div>
    );
  }

  return (
    <div className="relative pl-8 animate-fade-in max-w-4xl mx-auto">
      {/* The vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>

      <ul className="space-y-12">
        {entries.map(entry => (
          <li key={entry.id} className="relative">
            {/* The dot on the timeline */}
            <div className="absolute left-0 top-1 w-4 h-4 bg-white border-2 border-sky-500 rounded-full"></div>

            <div className="ml-8">
              <p className="text-sm font-medium text-sky-600">
                {new Date(entry.date).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <h3 className="text-xl font-bold mt-1 text-slate-800">{entry.title}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed line-clamp-3">
                {entry.summary || entry.content}
              </p>
              {entry.tags.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <TagIcon className="w-4 h-4 text-slate-400" />
                  {entry.tags.map(tag => (
                    <span key={tag} className="bg-sky-100 text-sky-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={() => onSelectEntry(entry)}
                className="mt-4 text-sm font-semibold text-sky-600 hover:text-sky-800 transition-colors"
              >
                查看詳細內容 &rarr;
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TimelineView;
