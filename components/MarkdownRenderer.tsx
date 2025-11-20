
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];
  
  const flushList = (keyPrefix: string) => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-list`} className="list-disc pl-6 mb-4 space-y-2 text-slate-300">
          {listBuffer}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, index) => {
    const key = `line-${index}`;

    // Headers
    if (line.startsWith('# ')) {
      flushList(key);
      elements.push(
        <h1 key={key} className="text-3xl font-serif font-bold text-slate-100 mt-8 mb-6 border-b border-slate-700 pb-2">
          {line.replace('# ', '')}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      flushList(key);
      elements.push(
        <h2 key={key} className="text-xl font-serif font-semibold text-academic-300 mt-6 mb-4">
          {line.replace('## ', '')}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      flushList(key);
      elements.push(
        <h3 key={key} className="text-lg font-serif font-medium text-academic-400 mt-4 mb-2">
          {line.replace('### ', '')}
        </h3>
      );
    } 
    // Lists
    else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const text = line.trim().substring(2);
      listBuffer.push(
        <li key={key} className="leading-relaxed">
           <span dangerouslySetInnerHTML={{ __html: parseBold(text) }} />
        </li>
      );
    } 
    // Empty lines
    else if (line.trim() === '') {
      flushList(key);
    } 
    // Paragraphs
    else {
      flushList(key);
      elements.push(
        <p key={key} className="mb-4 leading-7 text-slate-300 text-base">
          <span dangerouslySetInnerHTML={{ __html: parseBold(line) }} />
        </p>
      );
    }
  });

  flushList('final');

  return <div className="font-sans">{elements}</div>;
};

// Simple bold parser for **text**
const parseBold = (text: string): string => {
  // We replace **text** with <strong ...>text</strong>
  // Use explicit colors for dark mode visibility
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-100">$1</strong>');
};

export default MarkdownRenderer;
