
import React, { useState, useEffect } from 'react';
import { Newspaper, X, RefreshCw, Sparkles } from 'lucide-react';
import { generateResearchFeed } from '../services/gemini';
import { FeedData } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { SourceList } from './SourceList';

interface ResearchFeedProps {
  feedData: FeedData | null;
  onUpdateFeed: (data: FeedData) => void;
}

export const ResearchFeed: React.FC<ResearchFeedProps> = ({ feedData, onUpdateFeed }) => {
  const [topics, setTopics] = useState<string[]>(() => {
    const saved = localStorage.getItem('scholar_feed_topics');
    return saved ? JSON.parse(saved) : ['Artificial Intelligence', 'Climate Change'];
  });
  const [newTopic, setNewTopic] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('scholar_feed_topics', JSON.stringify(topics));
  }, [topics]);

  const handleAddTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (t: string) => {
    setTopics(topics.filter(topic => topic !== t));
  };

  const refreshFeed = async () => {
    if (topics.length === 0) {
      setError("Please add at least one topic to generate a feed.");
      return;
    }

    setIsRefreshing(true);
    setError(null);
    
    try {
      const result = await generateResearchFeed(topics);
      onUpdateFeed({
        content: result.text,
        sources: result.sources,
        lastUpdated: Date.now()
      });
    } catch (err) {
      setError("Failed to update feed. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 md:p-12 h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-100 flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-academic-400" />
            Personalized Feed
          </h1>
          <p className="text-slate-400 mt-2">
            Stay updated with the latest research in your areas of interest.
          </p>
        </div>
        <button
          onClick={refreshFeed}
          disabled={isRefreshing || topics.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-academic-600 text-white rounded-lg hover:bg-academic-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Curating...' : 'Refresh Feed'}
        </button>
      </div>

      {/* Topic Management */}
      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Following Topics
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {topics.map((topic) => (
            <div key={topic} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-full text-sm text-slate-200 shadow-sm group"
            >
              {topic}
              <button onClick={() => handleRemoveTopic(topic)} className="text-slate-400 hover:text-red-400">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {topics.length === 0 && (
            <span className="text-sm text-slate-500 italic">No topics added yet.</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
            placeholder="Add a topic (e.g., Quantum Computing)"
            className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-academic-500/20 focus:border-academic-500 outline-none text-sm placeholder:text-slate-500"
          />
          <button
            onClick={handleAddTopic}
            disabled={!newTopic.trim()}
            className="px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded-lg hover:bg-slate-600 disabled:opacity-50 font-medium text-sm transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-800 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Feed Content */}
      <div className="flex-1 bg-slate-900 rounded-xl">
        {!feedData ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
            <Sparkles className="w-10 h-10 mb-4 text-slate-700" />
            <p>Click "Refresh Feed" to generate your research digest.</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 border-b border-slate-800 pb-4">
              <span>Last updated: {new Date(feedData.lastUpdated).toLocaleTimeString()}</span>
            </div>
            <div className="prose prose-invert max-w-none">
              <MarkdownRenderer content={feedData.content} />
            </div>
            <SourceList sources={feedData.sources} />
          </div>
        )}
      </div>
    </div>
  );
};
