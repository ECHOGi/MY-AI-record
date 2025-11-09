import React from 'react';
import type { JournalEntry } from '../types';
import { TagIcon } from './icons/TagIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { DocumentIcon } from './icons/DocumentIcon';

interface JournalDetailProps {
  entry: JournalEntry;
}

const JournalDetail: React.FC<JournalDetailProps> = ({ entry }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <p className="text-sm text-slate-500 mb-1">
          {new Date(entry.date).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{entry.title}</h2>
        {entry.tags.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <TagIcon className="w-5 h-5 text-slate-400" />
            {entry.tags.map(tag => (
              <span key={tag} className="bg-sky-100 text-sky-800 text-xs font-medium px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>
      
      {entry.summary && (
        <blockquote className="border-l-4 border-sky-400 pl-4 py-2 bg-sky-50 text-sky-900">
          <p className="font-medium italic">AI 摘要: {entry.summary}</p>
        </blockquote>
      )}

      <article className="prose prose-slate max-w-none prose-p:leading-relaxed">
        <p className="whitespace-pre-wrap">{entry.content}</p>
      </article>

      {entry.files && entry.files.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-800"><DocumentIcon className="w-5 h-5 text-slate-500" /> 相關文件</h3>
          <ul className="space-y-2 rounded-md border border-slate-200 bg-slate-50/50 p-4">
            {entry.files.map((file, index) => (
              <li key={index}>
                <a
                  href={`data:${file.mimeType};base64,${file.base64}`}
                  download={file.name}
                  className="text-sky-600 hover:text-sky-800 hover:underline transition-colors duration-200 font-medium"
                  title={`下載 ${file.name}`}
                >
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {entry.images.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-800"><PhotoIcon className="w-5 h-5 text-slate-500"/> 相關照片</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entry.images.map((image, index) => (
              <div key={index} className="group relative overflow-hidden rounded-lg shadow-md transition-transform duration-300 hover:scale-105">
                <img
                  src={`data:${image.mimeType};base64,${image.base64}`}
                  alt={image.description || `專案圖片 ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                {image.description && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p>AI 描述: {image.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalDetail;
