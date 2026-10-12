import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { API_BASE_URL } from '../config';
import { 
  MessageSquareQuote, 
  Send, 
  Loader2, 
  Sparkles, 
  ShieldCheck, 
  X,
  Bot,
  BookOpen,
  FileText,
  Layers
} from 'lucide-react';
import type { RAGAnswer, RAGSource } from '../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: RAGSource[];
  confidence?: number;
  timestamp: string;
}

interface CorpusScope {
  total_papers: number;
  total_chunks: number;
  topics: string[];
  titles: string[];
  query?: string;
  review_id?: string;
  suggested_questions?: string[];
  has_unpublished?: boolean;
  unpublished_count?: number;
  unpublished_titles?: string[];
  uploaded_count?: number;
}

interface RAGChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId?: string;
  queryTitle?: string;
}

export const RAGChatDrawer: FC<RAGChatDrawerProps> = ({
  isOpen,
  onClose,
  reviewId,
  queryTitle
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: "Hello! I am your FAISS-indexed Medical Literature Research Assistant. Ask me any granular question regarding datasets, architectural hyperparameters, artifact rejection techniques, validation protocols, or findings across the indexed published literature and uploaded manuscripts.",
      timestamp: 'Just now'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Active corpus scope
  const [corpusScope, setCorpusScope] = useState<CorpusScope>({
    total_papers: 0,
    total_chunks: 0,
    topics: [],
    titles: []
  });

  const fetchCorpusScope = async () => {
    try {
      const url = reviewId 
        ? `${API_BASE_URL}/api/rag/corpus?review_id=${encodeURIComponent(reviewId)}` 
        : `${API_BASE_URL}/api/rag/corpus`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCorpusScope(data);
      }
    } catch (e) {
      console.log('Error fetching corpus scope:', e);
    }
  };

  // Fetch active corpus scope on drawer open
  useEffect(() => {
    if (isOpen) {
      fetchCorpusScope();
    }
  }, [isOpen, reviewId]);

  const defaultSuggestedQuestions = [
    "Which architecture achieved the lowest false alarm rate?",
    "Why does ST-GCN resist muscle artifacts?",
    "What datasets had adult patients?",
    "What is the sensitivity drop in patient-independent validation?"
  ];

  const unpublishedSuggestedQuestions = [
    "What methodology is used in the uploaded manuscript?",
    "What are the main findings of the unpublished study?",
    "What datasets or patient cohorts are evaluated in the uploaded paper?",
    "Compare the unpublished manuscript against published literature."
  ];

  const activeTitle = queryTitle || corpusScope.query || (corpusScope.topics && corpusScope.topics[0]) || '';
  const shortTitle = activeTitle.length > 42 ? activeTitle.slice(0, 42) + '...' : activeTitle;

  const dynamicSuggestedQuestions = activeTitle ? [
    `What are the main findings for "${shortTitle}"?`,
    "What benchmark datasets and cohorts were evaluated?",
    "What machine learning architectures and models were compared?",
    "What clinical translation gaps were identified?"
  ] : defaultSuggestedQuestions;

  const suggestedQuestions = corpusScope.suggested_questions && corpusScope.suggested_questions.length > 0
    ? corpusScope.suggested_questions
    : (corpusScope.has_unpublished ? unpublishedSuggestedQuestions : dynamicSuggestedQuestions);

  const handleSend = async (questionText?: string) => {
    const q = questionText || inputQuery;
    if (!q.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/rag/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: reviewId || '',
          question: q,
          auto_train: true
        })
      });

      if (!res.ok) {
        throw new Error('Failed to query RAG service');
      }

      const data: RAGAnswer = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.answer,
        sources: data.grounded_sources,
        confidence: data.confidence,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If corpus was updated, refresh scope
      if (data.corpus_scope) {
        setCorpusScope(data.corpus_scope as CorpusScope);
      } else {
        fetchCorpusScope();
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "I encountered an error querying the FAISS vector index. Please ensure the backend is running and papers have been indexed.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shadow-xs">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Interactive Literature RAG Chat
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100/70 text-teal-800 border border-teal-200">
                  FAISS Dense Index
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                100% Grounded Q&A over retrieved studies & auto-trained manuscripts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Query Topic Banner */}
        {activeTitle && (
          <div className="px-4 py-2 bg-teal-50/80 border-b border-teal-100 flex items-center gap-2 text-xs text-teal-900">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="font-bold text-teal-700 shrink-0">Topic:</span>
            <span className="truncate font-medium">{activeTitle}</span>
          </div>
        )}

        {/* Live Corpus Scope Bar */}
        <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-slate-600 flex-wrap">
            <div className="flex items-center gap-1 font-semibold text-slate-800">
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              <span>Corpus:</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-teal-800 font-mono font-bold text-[10px]">
              {corpusScope.total_papers || 0} Studies
            </span>
            <span className="text-slate-400">•</span>
            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[10px]">
              {corpusScope.total_chunks || 0} Chunks
            </span>

            {/* Unpublished Badge */}
            {corpusScope.has_unpublished && (
              <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-800 font-bold text-[10px] flex items-center gap-1 shadow-2xs">
                <FileText className="w-3 h-3 text-purple-600" />
                <span>{corpusScope.unpublished_count} Unpublished Manuscript{corpusScope.unpublished_count && corpusScope.unpublished_count > 1 ? 's' : ''} Active</span>
              </span>
            )}
          </div>

          {corpusScope.topics && corpusScope.topics.length > 0 && (
            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">
              {corpusScope.topics[0]}
            </span>
          )}
        </div>

        {/* Active Topics Tags */}
        {corpusScope.topics && corpusScope.topics.length > 0 && (
          <div className="px-4 py-1.5 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <span className="text-slate-400 font-medium shrink-0">Topics:</span>
            {corpusScope.topics.map((t, idx) => (
              <span 
                key={idx}
                className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 shrink-0 font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500 font-mono">
                {msg.sender === 'user' ? (
                  <><span>You</span> • <span>{msg.timestamp}</span></>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-teal-800 font-bold font-sans">Literature Assistant</span> • <span>{msg.timestamp}</span>
                  </>
                )}
              </div>

              <div
                className={`p-4 rounded-2xl max-w-[92%] text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-teal-600/15'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                }`}
              >
                {/* Message Text */}
                <div className="whitespace-pre-wrap font-normal leading-relaxed">
                  {msg.text}
                </div>

                {/* Grounded Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      Grounded Evidence Sources:
                    </div>
                    {msg.sources.map((src, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 line-clamp-1">
                            {src.title}
                          </span>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            {src.is_unpublished ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                <FileText className="w-2.5 h-2.5" />
                                Unpublished
                              </span>
                            ) : src.pmid && src.pmid !== 'Unpublished' && !src.pmid.startsWith('pdf_') ? (
                              <a
                                href={`https://pubmed.ncbi.nlm.nih.gov/${src.pmid}/`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-teal-700 hover:text-teal-900 font-semibold font-mono text-[10px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200"
                              >
                                PMID: {src.pmid}
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                Local PDF
                              </span>
                            )}
                          </div>
                        </div>

                        {src.section && (
                          <div className="flex items-center gap-1 text-[10px] text-indigo-700 font-medium">
                            <Layers className="w-3 h-3 text-indigo-500" />
                            <span>Section: {src.section}</span>
                          </div>
                        )}

                        <p className="italic text-slate-700 text-[10px] line-clamp-2">
                          "{src.snippet}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3.5 bg-white border border-slate-200 rounded-xl text-xs text-teal-800 w-fit shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              <span>Scanning FAISS vector chunks and synthesizing evidence...</span>
            </div>
          )}
        </div>

        {/* Suggested Quick Questions */}
        <div className="p-3 bg-white border-t border-slate-200">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3 h-3 text-teal-600" />
            Quick Prompts:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleSend(sq)}
                disabled={isLoading}
                className="text-[10px] px-2.5 py-1 rounded-md bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-200 transition-colors text-left font-medium"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={activeTitle ? `Ask questions related to "${shortTitle}"...` : (corpusScope.has_unpublished ? "Ask questions about the uploaded manuscript or literature..." : "Ask anything about the retrieved literature...")}
            disabled={isLoading}
            className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition-colors shadow-2xs"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputQuery.trim()}
            className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white transition-all shadow-sm shadow-teal-600/20"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
};
