
import React from 'react';
import { GroundingChunk } from '../types';
import { ExternalLink, BookOpen, Quote, Download } from 'lucide-react';

interface SourceListProps {
  sources: GroundingChunk[];
  compact?: boolean;
}

export const SourceList: React.FC<SourceListProps> = ({ sources, compact = false }) => {
  if (!sources || sources.length === 0) return null;

  const downloadFile = (content: string, filename: string, type: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportBibTex = () => {
    let bib = '';
    sources.forEach((s, i) => {
      if (s.web) {
        const id = `ref_${i + 1}_${new Date().getTime()}`;
        bib += `@misc{${id},\n`;
        bib += `  title = {{${s.web.title}}},\n`;
        bib += `  howpublished = {\\url{${s.web.uri}}},\n`;
        bib += `  note = {Accessed: ${new Date().toISOString().split('T')[0]}}\n`;
        bib += `}\n\n`;
      }
    });
    downloadFile(bib, 'citations.bib', 'text/plain');
  };

  const handleExportRIS = () => {
    let ris = '';
    sources.forEach((s, i) => {
      if (s.web) {
        ris += `TY  - ELEC\n`;
        ris += `TI  - ${s.web.title}\n`;
        ris += `UR  - ${s.web.uri}\n`;
        ris += `ID  - ${i + 1}\n`;
        ris += `ER  - \n\n`;
      }
    });
    downloadFile(ris, 'citations.ris', 'text/plain');
  };

  if (compact) {
    return (
      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Sources
        </p>
        <ul className="space-y-1.5">
          {sources.map((source, idx) => (
            source.web && (
              <li key={idx}>
                <a 
                  href={source.web.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-xs text-slate-400 hover:text-academic-400 transition-colors group"
                >
                  <span className="flex-shrink-0 w-4 h-4 rounded bg-slate-700 text-slate-300 flex items-center justify-center text-[9px] font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="truncate underline decoration-slate-600 group-hover:decoration-academic-500">
                    {source.web.title || source.web.uri}
                  </span>
                </a>
              </li>
            )
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-6 border-t border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          References & Sources
        </h3>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Export to:</span>
          <button 
            onClick={handleExportBibTex}
            className="px-2 py-1 text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 hover:text-academic-300 hover:border-academic-500 transition-colors flex items-center gap-1"
            title="Export to BibTeX"
          >
            <Quote className="w-3 h-3" /> BibTeX
          </button>
          <button 
            onClick={handleExportRIS}
            className="px-2 py-1 text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 hover:text-academic-300 hover:border-academic-500 transition-colors flex items-center gap-1"
            title="Export to Zotero/EndNote (RIS)"
          >
            <Download className="w-3 h-3" /> RIS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sources.map((source, idx) => (
          source.web && (
            <a 
              key={idx} 
              href={source.web.uri} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-start p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-academic-500/50 transition-all group"
            >
              {/* Reference Number Badge */}
              <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-academic-400 text-xs font-bold mr-3 mt-0.5 border border-slate-700">
                {idx + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate group-hover:text-academic-300 transition-colors">
                  {source.web.title || "Untitled Source"}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {source.web.uri}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-academic-400 ml-2 flex-shrink-0" />
            </a>
          )
        ))}
      </div>
    </div>
  );
};
