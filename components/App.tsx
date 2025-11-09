import React, { useState, useEffect, useMemo } from 'react';
import type { JournalEntry, GanttTask } from '../types';
import pptxgen from "pptxgenjs";

// Fix: Standardized all component imports to use the root-level re-exports to prevent duplicate module errors.
import JournalList from '../JournalList';
import JournalDetail from '../JournalDetail';
import JournalForm from '../JournalForm';
import TimelineView from '../TimelineView';
import GanttChartView from '../GanttChartView';
import VideoGenerationModal from './VideoGenerationModal';
import { 
    generateGanttChartData, 
    generatePresentationContent, 
    generateVideoSummary 
} from '../services/geminiService';

import { HomeIcon } from './icons/HomeIcon';
import { TimelineIcon } from './icons/TimelineIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { PresentationIcon } from './icons/PresentationIcon';
import { VideoIcon } from './icons/VideoIcon';
import { PlusIcon } from './icons/PlusIcon';

const App: React.FC = () => {
    const [projectTitle, setProjectTitle] = useState('AI 專案日誌');
    const [editingTitle, setEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState(projectTitle);

    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
    const [view, setView] = useState<'home' | 'timeline' | 'gantt'>('home');
    const [currentMainView, setCurrentMainView] = useState<'detail' | 'form' | 'welcome'>('welcome');
    
    const [entryToEdit, setEntryToEdit] = useState<JournalEntry | undefined>(undefined);
    
    const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
    const [isGeneratingGantt, setIsGeneratingGantt] = useState(false);
    
    const [isGeneratingPpt, setIsGeneratingPpt] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load from localStorage
    useEffect(() => {
        try {
            const savedTitle = localStorage.getItem('projectTitle');
            if (savedTitle) setProjectTitle(savedTitle);

            const savedEntries = localStorage.getItem('journalEntries');
            if (savedEntries) setEntries(JSON.parse(savedEntries));

            const savedTasks = localStorage.getItem('ganttTasks');
            if (savedTasks) setGanttTasks(JSON.parse(savedTasks));
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
    }, []);

    // Effect to manage the main view state and selected entry
    useEffect(() => {
        if (currentMainView === 'form') {
            return;
        }

        if (entries.length > 0) {
            const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            if (currentMainView === 'welcome') {
                setSelectedEntry(sorted[0]);
                setCurrentMainView('detail');
            } 
            else if (!selectedEntry || !entries.find(e => e.id === selectedEntry.id)) {
                setSelectedEntry(sorted[0]);
            }
        } else {
            setCurrentMainView('welcome');
            setSelectedEntry(null);
        }
    }, [entries, currentMainView, selectedEntry]);
    

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('projectTitle', projectTitle);
    }, [projectTitle]);

    useEffect(() => {
        localStorage.setItem('journalEntries', JSON.stringify(entries));
    }, [entries]);

     useEffect(() => {
        localStorage.setItem('ganttTasks', JSON.stringify(ganttTasks));
    }, [ganttTasks]);

    const sortedEntries = useMemo(() => 
        [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [entries]
    );

    const handleSaveEntry = (entry: JournalEntry) => {
        const index = entries.findIndex(e => e.id === entry.id);
        if (index > -1) {
            const updatedEntries = [...entries];
            updatedEntries[index] = entry;
            setEntries(updatedEntries);
        } else {
            setEntries(prevEntries => [...prevEntries, entry]);
        }
        setSelectedEntry(entry);
        setCurrentMainView('detail');
        setView('home');
        setEntryToEdit(undefined);
    };

    const handleSelectEntry = (entry: JournalEntry) => {
        setSelectedEntry(entry);
        setCurrentMainView('detail');
        setView('home');
    };
    
    const handleGoHome = () => {
        setView('home');
        if(entries.length > 0) {
            const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setSelectedEntry(sorted[0]);
            setCurrentMainView('detail');
        } else {
            setCurrentMainView('welcome');
        }
    }

    const handleNewEntry = () => {
        setEntryToEdit(undefined);
        setCurrentMainView('form');
        setView('home');
    };
    
    const handleEditEntry = () => {
        if (selectedEntry) {
            setEntryToEdit(selectedEntry);
            setCurrentMainView('form');
        }
    };

    const handleTitleBlur = () => {
        setProjectTitle(tempTitle);
        setEditingTitle(false);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleTitleBlur();
        } else if (e.key === 'Escape') {
            setTempTitle(projectTitle);
            setEditingTitle(false);
        }
    };

    const handleGenerateGantt = async () => {
        if (entries.length === 0) return;
        setIsGeneratingGantt(true);
        setError(null);
        try {
            const tasks = await generateGanttChartData(entries);
            setGanttTasks(tasks);
        } catch(e: any) {
            setError(e.message || '無法生成進度表資料。');
        } finally {
            setIsGeneratingGantt(false);
        }
    };

    const handleGeneratePpt = async () => {
        if (entries.length === 0) {
            setError("請先新增至少一筆日誌紀錄。");
            return;
        }
        setIsGeneratingPpt(true);
        setError(null);
        try {
            const content = await generatePresentationContent(entries);
            const ppt = new pptxgen();
            
            ppt.addSlide().addText(content.title, { 
                x: 1, y: 2.5, w: 8, h: 1.5, 
                align: 'center', fontSize: 32, bold: true, color: '003366'
            });

            content.slides.forEach(slideData => {
                const slide = ppt.addSlide();
                slide.addText(slideData.title, { 
                    x: 0.5, y: 0.25, w: 9, h: 1, 
                    fontSize: 24, bold: true, color: '003366'
                });
                slide.addText(slideData.points.join('\n'), {
                    x: 0.5, y: 1.5, w: 9, h: 4,
                    bullet: true, fontSize: 18
                });
                if(slideData.speakerNotes){
                    slide.addNotes(slideData.speakerNotes);
                }
            });

            await ppt.writeFile({ fileName: `${projectTitle}.pptx` });

        } catch (e: any) {
            setError(e.message || '生成簡報失敗。');
        } finally {
            setIsGeneratingPpt(false);
        }
    };
    
    const handleOpenVideoModal = () => {
        setIsVideoModalOpen(true);
    };

    const renderMainContent = () => {
        if (view === 'timeline') {
            return <TimelineView entries={sortedEntries} onSelectEntry={handleSelectEntry} />;
        }
        if (view === 'gantt') {
            return <GanttChartView tasks={ganttTasks} onTasksChange={setGanttTasks} onRegenerate={handleGenerateGantt} isGenerating={isGeneratingGantt} />;
        }
        
        switch (currentMainView) {
            case 'form':
                return <JournalForm onSave={handleSaveEntry} onCancel={handleGoHome} entryToEdit={entryToEdit} />;
            case 'detail':
                return selectedEntry ? <JournalDetail entry={selectedEntry} /> : <div />;
            case 'welcome':
            default:
                return (
                    <div className="text-center py-20 animate-fade-in flex flex-col items-center">
                        <h2 className="text-2xl font-semibold text-slate-700">歡迎使用 AI 專案日誌</h2>
                        <p className="text-slate-500 mt-2 max-w-md">點擊左上角的「<PlusIcon className="w-4 h-4 inline-block -mt-1"/>」按鈕來開始您的第一筆日誌。</p>
                    </div>
                );
        }
    };
    
    const NavIconButton = ({ active, onClick, icon, label } : { active: boolean, onClick: () => void, icon: React.ReactNode, label: string}) => (
        <button onClick={onClick} title={label} className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-110 ${active ? 'bg-sky-900/60 text-white' : 'text-sky-100 hover:bg-sky-900/40'}`}>
            {icon}
        </button>
    );

    const FooterButton = ({ onClick, disabled = false, icon: Icon, text } : { onClick: () => void, disabled?: boolean, icon: React.FC<any>, text: React.ReactNode }) => (
         <button
            onClick={onClick}
            disabled={disabled}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium rounded-md transition-all duration-200 transform text-sky-100 hover:bg-sky-900/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
            <Icon className="w-5 h-5"/>
            <span>{text}</span>
        </button>
    );

    return (
        <div className="h-screen bg-slate-50 font-sans flex overflow-hidden">
             <aside className="w-80 bg-gradient-to-b from-sky-700 to-indigo-800 flex flex-col shadow-2xl z-10">
                <div className="p-4 pt-5 border-b border-white/20">
                    {editingTitle ? (
                        <input
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleTitleKeyDown}
                            className="w-full bg-transparent text-xl font-bold text-white border-b-2 border-sky-300 focus:outline-none"
                            autoFocus
                        />
                    ) : (
                        <h1
                            className="text-xl font-bold text-white cursor-pointer truncate"
                            onClick={() => { setEditingTitle(true); setTempTitle(projectTitle); }}
                            title="點擊以編輯標題"
                        >
                            {projectTitle}
                        </h1>
                    )}
                </div>
                
                <div className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <NavIconButton label="首頁" active={view === 'home'} onClick={handleGoHome} icon={<HomeIcon className="w-6 h-6"/>}/>
                        <NavIconButton label="時間軸" active={view === 'timeline'} onClick={() => setView('timeline')} icon={<TimelineIcon className="w-6 h-6"/>}/>
                        <NavIconButton label="進度表" active={view === 'gantt'} onClick={() => setView('gantt')} icon={<ChartBarIcon className="w-6 h-6"/>}/>
                    </div>
                    <button onClick={handleNewEntry} title="新增紀錄" className="p-2 rounded-full bg-sky-400 text-white shadow-md hover:bg-sky-300 transition-all duration-200 transform hover:scale-110">
                        <PlusIcon className="w-6 h-6"/>
                    </button>
                </div>
               
                <div className="flex-grow overflow-y-auto p-4 pt-0">
                    <JournalList entries={sortedEntries} onSelectEntry={handleSelectEntry} selectedEntryId={selectedEntry?.id || null} />
                </div>

                <footer className="p-4 border-t border-white/20 space-y-2">
                   <FooterButton onClick={handleGoHome} icon={HomeIcon} text="回到首頁"/>
                   <FooterButton onClick={() => setView('timeline')} icon={TimelineIcon} text="時間軸"/>
                   <FooterButton onClick={() => setView('gantt')} icon={ChartBarIcon} text="工作進度管制表"/>
                   <FooterButton onClick={handleGeneratePpt} disabled={isGeneratingPpt} icon={PresentationIcon} text={isGeneratingPpt ? '生成中...' : 'AI 生成簡報'}/>
                   <FooterButton onClick={handleOpenVideoModal} icon={VideoIcon} text="AI 生成影片"/>
                </footer>
            </aside>
            
            <main className="flex-grow flex flex-col overflow-hidden">
                {view === 'home' && currentMainView === 'detail' && selectedEntry && (
                    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-8 py-3 flex justify-end items-center">
                        <button onClick={handleEditEntry} className="text-sm font-medium text-sky-600 hover:text-sky-800 transition-colors transform hover:scale-105">
                            編輯此紀錄
                        </button>
                    </header>
                )}
                
                <div className="flex-grow overflow-y-auto p-8">
                   {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                   {renderMainContent()}
                </div>
            </main>
            
            {isVideoModalOpen && (
                <VideoGenerationModal
                    projectTitle={projectTitle}
                    entries={entries}
                    onClose={() => setIsVideoModalOpen(false)}
                    generateVideo={generateVideoSummary}
                />
            )}
        </div>
    );
};

export default App;