import React, { useState } from 'react';
import type { JournalEntry, JournalImage, JournalFile } from '../types';
import { summarizeAndTag, describeImage } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { DocumentIcon } from './icons/DocumentIcon';

interface JournalFormProps {
  onSave: (entry: JournalEntry) => void;
  onCancel: () => void;
  entryToEdit?: JournalEntry;
}

const JournalForm: React.FC<JournalFormProps> = ({ onSave, onCancel, entryToEdit }) => {
  const [title, setTitle] = useState(entryToEdit?.title || '');
  const [date, setDate] = useState(entryToEdit?.date || new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState(entryToEdit?.content || '');
  const [summary, setSummary] = useState(entryToEdit?.summary || '');
  const [tags, setTags] = useState<string[]>(entryToEdit?.tags || []);
  const [images, setImages] = useState<JournalImage[]>(entryToEdit?.images || []);
  const [files, setFiles] = useState<JournalFile[]>(entryToEdit?.files || []);

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [describingImageIndex, setDescribingImageIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<{ base64: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const [meta, base64] = result.split(',');
        const mimeType = meta.split(':')[1].split(';')[0];
        resolve({ base64, mimeType });
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files: File[] = Array.from(event.target.files);
      for (const file of files) {
        const { base64, mimeType } = await fileToBase64(file);
        setImages(prev => [...prev, { base64, mimeType, description: '' }]);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles: File[] = Array.from(event.target.files);
      for (const file of selectedFiles) {
        const { base64, mimeType } = await fileToBase64(file);
        setFiles(prev => [...prev, { name: file.name, base64, mimeType }]);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateSummary = async () => {
    if (!content.trim()) {
      setError('請先輸入日誌內容。');
      return;
    }
    setIsSummarizing(true);
    setError(null);
    try {
      const result = await summarizeAndTag(content);
      setSummary(result.summary);
      setTags(result.tags);
    } catch (e: any) {
      setError(e.message || '生成失敗，請稍後再試。');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDescribeImage = async (index: number) => {
    setDescribingImageIndex(index);
    setError(null);
    try {
      const image = images[index];
      const description = await describeImage(image.base64, image.mimeType);
      setImages(prev => {
        const newImages = [...prev];
        newImages[index].description = description;
        return newImages;
      });
    } catch (e: any) {
      setError(e.message || '生成描述失敗，請稍後再試。');
    } finally {
      setDescribingImageIndex(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim()) {
        setError('標題和日期為必填欄位。');
        return;
    }
    onSave({
      id: entryToEdit?.id || new Date().toISOString(),
      title,
      date,
      content,
      summary,
      tags,
      images,
      files,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800">{entryToEdit ? '編輯紀錄' : '新增紀錄'}</h2>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700">標題</label>
          <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-700">日期</label>
          <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm" />
        </div>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-slate-700">內容</label>
        <textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={8} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm" placeholder="記錄下您的專案進度、會議筆記或任何想法..."></textarea>
      </div>

      <div>
        <button type="button" onClick={handleGenerateSummary} disabled={isSummarizing} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300 transition-all duration-200 transform hover:scale-105">
          <SparklesIcon className="w-5 h-5"/>
          {isSummarizing ? '生成中...' : 'AI 生成摘要與標籤'}
        </button>
      </div>

      {summary && (
        <div>
          <label className="block text-sm font-medium text-slate-700">AI 摘要</label>
          <p className="mt-1 text-sm text-slate-700 bg-slate-50 p-3 rounded-md border">{summary}</p>
        </div>
      )}

      {tags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700">AI 建議標籤</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag} className="bg-sky-100 text-sky-800 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      )}
      
      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">上傳照片</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-slate-400" />
            <div className="flex text-sm text-slate-600">
              <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500">
                <span>選擇檔案</span>
                <input id="image-upload" name="image-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleImageUpload} />
              </label>
              <p className="pl-1">或拖曳至此</p>
            </div>
            <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img src={`data:${image.mimeType};base64,${image.base64}`} alt={`預覽 ${index}`} className="w-full h-24 object-cover rounded-md" />
                <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs w-5 h-5 flex items-center justify-center">&times;</button>
                <button type="button" onClick={() => handleDescribeImage(index)} disabled={describingImageIndex === index} className="absolute bottom-1 right-1 text-xs inline-flex items-center gap-1 px-2 py-1 border border-transparent font-medium rounded-md shadow-sm text-white bg-sky-600/80 hover:bg-sky-700/80 focus:outline-none disabled:bg-sky-300/80">
                  <SparklesIcon className="w-3 h-3"/>
                  {describingImageIndex === index ? '...' : 'AI描述'}
                </button>
                {image.description && <p className="text-xs mt-1 text-slate-500 truncate" title={image.description}>{image.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">上傳文件</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <DocumentIcon className="mx-auto h-12 w-12 text-slate-400" />
            <div className="flex text-sm text-slate-600">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500">
                <span>選擇檔案</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileUpload} />
              </label>
              <p className="pl-1">或拖曳至此</p>
            </div>
            <p className="text-xs text-slate-500">PDF, PPT, DOCX, etc.</p>
          </div>
        </div>
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                 <span className="text-sm text-slate-700 truncate pr-2">{file.name}</span>
                 <button type="button" onClick={() => handleRemoveFile(index)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <button type="button" onClick={onCancel} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200 transform hover:scale-105">
          取消
        </button>
        <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200 transform hover:scale-105">
          儲存紀錄
        </button>
      </div>
    </form>
  );
};

export default JournalForm;