
import React from 'react';
import { ResearchReport, AppView } from '../types';
import { Clock, Plus, Newspaper } from 'lucide-react';

interface HistorySidebarProps {
  history: ResearchReport[];
  onSelectReport: (report: ResearchReport) => void;
  onNewResearch: () => void;
  currentId: string | null;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  history, 
  onSelectReport, 
  onNewResearch, 
  currentId,
  currentView,
  onViewChange
}) => {
  return (
    <div className="w-64 h-full bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0 font-sans">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2 font-serif font-bold text-xl text-slate-200 mb-6">
          <div className="w-8 h-8 bg-academic-600 rounded-lg flex items-center justify-center text-white shadow-glow">
            S
          </div>
          ScholarAgent
        </div>
        
        <div className="space-y-2">
           <button
            onClick={() => {
              onViewChange('research');
              onNewResearch();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'research' && !currentId
                ? 'bg-slate-800 text-academic-300'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            New Research
          </button>
          
          <button
            onClick={() => onViewChange('feed')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'feed'
                ? 'bg-slate-800 text-academic-300'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            My Feed
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-2 mb-2 mt-4">
          Research History
        </h3>
        {history.length === 0 ? (
          <div className="text-center text-slate-600 text-sm py-8 px-4 italic">
            No research history yet.
          </div>
        ) : (
          history.map((report) => (
            <button
              key={report.id}
              onClick={() => {
                onViewChange('research');
                onSelectReport(report);
              }}
              className={`w-full text-left p-3 rounded-lg transition-all text-sm group ${
                currentView === 'research' && currentId === report.id 
                  ? 'bg-slate-800/80 shadow-sm border-l-4 border-l-academic-500 text-slate-200' 
                  : 'hover:bg-slate-900 border-l-4 border-l-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <div className="font-medium truncate">
                {report.topic}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600 mt-1 group-hover:text-slate-500">
                <Clock className="w-3 h-3" />
                {new Date(report.timestamp).toLocaleDateString()}
              </div>
            </button>
          ))
        )}
      </div>
      
      <div className="p-4 border-t border-slate-800 text-xs text-slate-600 text-center">
        Powered by Gemini 2.5 Flash
      </div>
    </div>
  );
};
