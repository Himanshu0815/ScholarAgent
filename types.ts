
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingSupport {
  segment: {
    startIndex: number;
    endIndex: number;
    text: string;
  };
  groundingChunkIndices: number[];
  confidenceScores: number[];
}

export interface ResearchReport {
  id: string;
  topic: string;
  content: string;
  timestamp: number;
  sources: GroundingChunk[];
}

export type AppView = 'research' | 'feed';

export interface FeedData {
  content: string;
  sources: GroundingChunk[];
  lastUpdated: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  sources?: GroundingChunk[];
  timestamp: number;
}
