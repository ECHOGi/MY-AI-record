import React from 'react';
import type { JournalEntry } from '../types';

interface JournalListProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  selectedEntryId: string | null;
}

const JournalList: React.FC<JournalListProps> = ({ entries, onSelectEntry, selectedEntryId }) => {
  if (entries.length === 0) {
    return <p className="text-center text-sky-200 text-sm p-4">尚未有任何紀錄。</p>;
  }

  return (
    <nav>
      <ul className="space-y-2">
        {entries.map(entry => (
          <li key={entry.id}>
            <button
              onClick={() => onSelectEntry(entry)}
              className={`w-full text-left p-3 rounded-md transition-all duration-200 transform hover:scale-[1.03] ${
                selectedEntryId === entry.id
                  ? 'bg-sky-900/50 shadow-inner'
                  : 'hover:bg-sky-900/30'
              }`}
            >
              <h3 className="font-semibold truncate text-white">{entry.title}</h3>
              <p className="text-sm text-sky-200">
                {new Date(entry.date).toLocaleDateString('zh-TW')}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default JournalList;
