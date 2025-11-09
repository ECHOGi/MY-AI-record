import React, { useState } from 'react';
import type { GanttTask } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface GanttChartViewProps {
  tasks: GanttTask[];
  onTasksChange: (tasks: GanttTask[]) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

const GanttChartView: React.FC<GanttChartViewProps> = ({ tasks, onTasksChange, onRegenerate, isGenerating }) => {
  const [editingTask, setEditingTask] = useState<{ id: string, field: 'name' | 'deadline' | 'status' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEditStart = (task: GanttTask, field: 'name' | 'deadline' | 'status') => {
    setEditingTask({ id: task.id, field });
    setEditValue(task[field]);
  };

  const handleEditSave = () => {
    if (!editingTask) return;
    const updatedTasks = tasks.map(task => 
      task.id === editingTask.id ? { ...task, [editingTask.field]: editValue } : task
    );
    onTasksChange(updatedTasks);
    setEditingTask(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleEditSave();
    } else if (e.key === 'Escape') {
        setEditingTask(null);
    }
  }

  const renderEditableCell = (task: GanttTask, field: 'name' | 'deadline' | 'status', type: 'text' | 'date' = 'text') => {
    if (editingTask?.id === task.id && editingTask.field === field) {
        return (
            <input
                type={type}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={handleEditSave}
                onKeyDown={handleKeyDown}
                className="form-input w-full rounded-md border-sky-500 ring-sky-500 text-sm"
                autoFocus
            />
        );
    }
    return (
        <span onClick={() => handleEditStart(task, field)} className="cursor-pointer hover:bg-yellow-100 p-1 rounded transition-colors">
            {task[field]}
        </span>
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <h2 className="text-xl font-semibold text-slate-700">尚未有進度表</h2>
        <p className="text-slate-500 mt-2">點擊下方按鈕，讓 AI 為您自動生成一份工作進度管制表。</p>
        <button onClick={onRegenerate} disabled={isGenerating} className="mt-6 inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 transition-all transform hover:scale-105">
          <SparklesIcon className="w-5 h-5"/>
          {isGenerating ? '分析日誌中...' : 'AI 自動生成進度表'}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">工作進度管制表</h2>
        <button onClick={onRegenerate} disabled={isGenerating} className="inline-flex items-center gap-2 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 transition-all transform hover:scale-105">
          <SparklesIcon className="w-4 h-4"/>
          {isGenerating ? '重新生成中...' : 'AI 重新生成'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/2">任務名稱</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">預計完成日期</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">進度</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {tasks.map(task => (
              <tr key={task.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {renderEditableCell(task, 'name', 'text')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {renderEditableCell(task, 'deadline', 'date')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {renderEditableCell(task, 'status', 'text')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-2 text-center">點擊任務名稱、日期或進度即可直接修改。</p>
    </div>
  );
};

export default GanttChartView;