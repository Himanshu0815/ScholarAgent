
import React, { useState, useEffect } from 'react';
import { Search, Sparkles, ArrowRight, Microscope, Download, FileText, BookOpen, MessageSquare, AlignLeft, AlignJustify } from 'lucide-react';
import { generateResearch } from './services/gemini';
import { ResearchReport, AppView, FeedData } from './types';
import MarkdownRenderer from './components/MarkdownRenderer';
import { SourceList } from './components/SourceList';
import { HistorySidebar } from './components/HistorySidebar';
import { ResearchFeed } from './components/ResearchFeed';
import { ChatInterface } from './components/ChatInterface';

const SUGGESTED_TOPICS = [
  "Developments in CRISPR gene editing",
  "Fusion energy breakthroughs 2023-2024",
  "Impact of AI on modern pedagogy",
  "Sustainable polymers in material science"
];

const LOADING_PHASES = [
  { text: "Searching academic databases...", icon: Search },
  { text: "Analyzing relevant papers...", icon: BookOpen },
  { text: "Synthesizing findings & citations...", icon: Microscope },
  { text: "Formatting research report...", icon: FileText },
];

export default function App() {
  const [view, setView] = useState<AppView>('research');
  const [query, setQuery] = useState('');
  const [detailLevel, setDetailLevel] = useState<'concise' | 'detailed'>('detailed');
  const [isThinking, setIsThinking] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [history, setHistory] = useState<ResearchReport[]>([]);
  const [currentReport, setCurrentReport] = useState<ResearchReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Chat State
  const [showChat, setShowChat] = useState(false);
  
  // Feed State
  const [feedData, setFeedData] = useState<FeedData | null>(null);

  // Cycle loading phases
  useEffect(() => {
    if (isThinking) {
      setLoadingPhase(0);
      const interval = setInterval(() => {
        setLoadingPhase(prev => (prev + 1) % LOADING_PHASES.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isThinking]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsThinking(true);
    setError(null);
    
    try {
      const result = await generateResearch(searchQuery, detailLevel);
      
      const newReport: ResearchReport = {
        id: crypto.randomUUID(),
        topic: searchQuery,
        content: result.text,
        sources: result.sources,
        timestamp: Date.now()
      };

      setHistory(prev => [newReport, ...prev]);
      setCurrentReport(newReport);
      setQuery('');
      setShowChat(false); // Reset chat on new report
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleExport = () => {
    if (!currentReport) return;
    const element = document.createElement("a");
    const file = new Blob([currentReport.content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${currentReport.topic.replace(/\s+/g, '_').toLowerCase()}_report.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportPDF = () => {
    if (!currentReport) return;
    const element = document.getElementById('report-content');
    
    const opt = {
      margin:       [0.5, 0.5],
      filename:     `${currentReport.topic.replace(/\s+/g, '_').toLowerCase()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' }, // Force white bg for PDF even in dark mode
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // @ts-ignore
    if (typeof window !== 'undefined' && window.html2pdf) {
      // Temporarily enforce light mode text colors for the PDF generation if needed, 
      // but html2canvas usually snapshots styles. We might need a specific print stylesheet.
      // For now, relying on white background override.
       // @ts-ignore
      window.html2pdf().set(opt).from(element).save();
    } else {
        setError("PDF generation library is initializing. Please try again in a moment.");
    }
  };

  // Scroll to top when report changes
  useEffect(() => {
    if (currentReport && view === 'research') {
      window.scrollTo(0, 0);
    }
  }, [currentReport, view]);

  const CurrentLoadingIcon = LOADING_PHASES[loadingPhase].icon;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-900 text-slate-200">
      {/* Left Sidebar: History */}
      <div className="hidden md:block h-full border-r border-slate-700/50">
        <HistorySidebar 
          history={history} 
          onSelectReport={(report) => {
            setCurrentReport(report);
            setView('research');
            setShowChat(false);
          }} 
          onNewResearch={() => {
            setCurrentReport(null);
            setView('research');
            setShowChat(false);
          }}
          currentId={currentReport?.id || null}
          currentView={view}
          onViewChange={setView}
        />
      </div>

      <div className="flex-1 h-full flex flex-col overflow-hidden relative">
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-slate-900 relative scroll-smooth">
            
            {view === 'feed' ? (
              <ResearchFeed feedData={feedData} onUpdateFeed={setFeedData} />
            ) : (
              <>
                {!currentReport && !isThinking && (
                  <div className="flex flex-col items-center justify-center min-h-full p-8 max-w-3xl mx-auto animate-fade-in">
                    <div className="w-16 h-16 bg-slate-800 text-academic-400 rounded-2xl flex items-center justify-center mb-8 shadow-lg ring-1 ring-slate-700">
                      <Microscope className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-white text-center mb-4">
                      What would you like to research?
                    </h1>
                    <p className="text-slate-400 text-center mb-10 max-w-lg text-lg">
                      I can analyze academic databases, synthesize papers, and create citation-backed reports for you.
                    </p>

                    <div className="w-full relative mb-6">
                      <div className="relative group">
                        <input 
                          type="text" 
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                          placeholder="Enter a research topic..."
                          className="w-full pl-5 pr-14 py-5 text-lg bg-slate-800 border-2 border-slate-700 text-white rounded-xl shadow-sm focus:border-academic-500 focus:ring-4 focus:ring-academic-500/10 focus:outline-none transition-all placeholder:text-slate-500"
                        />
                        <button 
                          onClick={() => handleSearch(query)}
                          disabled={!query.trim()}
                          className="absolute right-3 top-3 p-2 bg-academic-600 text-white rounded-lg hover:bg-academic-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowRight className="w-6 h-6" />
                        </button>
                      </div>
                    </div>

                    {/* Detail Level Selection */}
                    <div className="flex gap-4 mb-12">
                      <button 
                        onClick={() => setDetailLevel('concise')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                          detailLevel === 'concise' 
                            ? 'bg-academic-900/50 border-academic-500 text-academic-300' 
                            : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                        }`}
                      >
                        <AlignLeft className="w-4 h-4" />
                        Concise Summary
                      </button>
                      <button 
                         onClick={() => setDetailLevel('detailed')}
                         className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                          detailLevel === 'detailed' 
                             ? 'bg-academic-900/50 border-academic-500 text-academic-300' 
                            : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                        }`}
                      >
                        <AlignJustify className="w-4 h-4" />
                        Detailed Report
                      </button>
                    </div>

                    <div className="w-full">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center">
                        Suggested Topics
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {SUGGESTED_TOPICS.map((topic, i) => (
                          <button
                            key={i}
                            onClick={() => handleSearch(topic)}
                            className="text-left p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-academic-500/50 hover:bg-slate-800 hover:shadow-md transition-all group"
                          >
                            <span className="text-slate-300 group-hover:text-academic-300 font-medium">
                              {topic}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {isThinking && (
                   <div className="flex flex-col items-center justify-center min-h-full p-8">
                      <div className="relative w-24 h-24 mb-8">
                        <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-academic-500 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CurrentLoadingIcon className="w-8 h-8 text-academic-500 animate-pulse" />
                        </div>
                      </div>
                      <h2 className="text-2xl font-serif font-bold text-white mb-2 animate-fade-in">
                        {LOADING_PHASES[loadingPhase].text}
                      </h2>
                      <p className="text-slate-500 text-center max-w-md">
                         Researching <span className="font-semibold text-slate-300">"{query}"</span>
                      </p>
                   </div>
                )}

                {currentReport && !isThinking && (
                  <div className="max-w-4xl mx-auto p-8 md:p-12 min-h-full transition-all">
                    
                    {/* Header Actions */}
                    <div className="flex justify-between items-start mb-8 border-b border-slate-800 pb-6 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-academic-400 text-sm font-medium mb-2">
                          <span className="bg-academic-900/50 border border-academic-800 px-2 py-1 rounded text-xs uppercase tracking-wide">Research Report</span>
                          <span className="text-slate-600">•</span>
                          <span>{new Date(currentReport.timestamp).toLocaleDateString()}</span>
                          {/* Show detail tag if we saved it, currently not saved in type but logic exists */}
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => setShowChat(!showChat)}
                           className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                             showChat 
                               ? 'bg-academic-600 text-white hover:bg-academic-500' 
                               : 'text-slate-400 hover:text-academic-400 hover:bg-slate-800'
                           }`}
                           title="Chat with Report"
                         >
                           <MessageSquare className="w-4 h-4" />
                           Chat
                         </button>
                         <div className="w-px h-8 bg-slate-700 mx-1"></div>
                         <button 
                          onClick={handleExport}
                          className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-academic-400 hover:bg-slate-800 rounded-md transition-colors text-sm font-medium"
                          title="Download Markdown"
                         >
                           <Download className="w-4 h-4" />
                           MD
                         </button>
                         <button 
                          onClick={handleExportPDF}
                          className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-academic-400 hover:bg-slate-800 rounded-md transition-colors text-sm font-medium"
                          title="Save as PDF"
                         >
                           <FileText className="w-4 h-4" />
                           PDF
                         </button>
                      </div>
                    </div>

                    {/* Content Wrapped for PDF Generation */}
                    {/* Note: PDF generation grabs the HTML. For dark mode apps, typically we want the PDF to be white paper.
                        The html2canvas settings in handleExportPDF try to force white bg, but text color might be issue.
                        Ideally, we'd toggle a 'print-mode' class or similar. For now, accepting dark PDF or trying to force style. */}
                    <div id="report-content" className="bg-slate-900 p-2">
                      <div className="prose prose-invert prose-lg max-w-none">
                        <MarkdownRenderer content={currentReport.content} />
                      </div>
                      <SourceList sources={currentReport.sources} />
                    </div>
                    
                    {/* Follow up prompt (Bottom) */}
                    {!showChat && (
                      <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-800">
                        <h4 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
                           <Search className="w-5 h-5 text-academic-500" />
                           Refine Research
                        </h4>
                        <div className="flex gap-2">
                           <input 
                             type="text"
                             value={query}
                             onChange={(e) => setQuery(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                             placeholder="Ask a follow-up question to generate a NEW report..."
                             className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-academic-500/20 focus:border-academic-500 outline-none placeholder:text-slate-500"
                           />
                           <button 
                              onClick={() => handleSearch(query)}
                              className="bg-academic-600 text-white px-6 py-3 rounded-lg hover:bg-academic-500 font-medium transition-colors"
                           >
                             Research
                           </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {error && (
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-red-900/80 border border-red-800 text-red-200 px-6 py-4 rounded-lg shadow-lg max-w-md text-center flex items-center gap-3 z-50 backdrop-blur-md">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-100">×</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Chat Sidebar (Right) */}
          {showChat && currentReport && (
            <ChatInterface 
              reportContext={currentReport.content} 
              onClose={() => setShowChat(false)} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
