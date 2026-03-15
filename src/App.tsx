import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LZString from 'lz-string';
import { 
  Search, 
  ShieldCheck, 
  AlertCircle, 
  Info, 
  Copy, 
  Trash2, 
  Loader2, 
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Share2,
  ExternalLink
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { detectAIText, type DetectionResult, type DetectionSegment } from './services/aiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  const resultRef = useRef<HTMLDivElement>(null);

  // Handle shared URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('share');
    if (sharedData) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(sharedData);
        if (decompressed) {
          const { text, result: sharedResult } = JSON.parse(decompressed);
          setInputText(text);
          setResult(sharedResult);
          // Clear the URL parameter without refreshing
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error('Failed to decode shared data:', err);
        setError('The shared link appears to be invalid or corrupted.');
      }
    }
  }, []);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    
    try {
      const data = await detectAIText(inputText);
      setResult(data);
      // Scroll to result after a short delay to allow rendering
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
    setError(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inputText);
  };

  const handleShare = async () => {
    if (!result || !inputText) return;
    
    setIsSharing(true);
    try {
      const dataToShare = JSON.stringify({ text: inputText, result });
      const compressed = LZString.compressToEncodedURIComponent(dataToShare);
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${compressed}`;
      
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to share:', err);
      setError('Failed to generate share link.');
    } finally {
      setIsSharing(false);
    }
  };

  const getConfidenceColor = (confidence: number, isAI: boolean) => {
    if (!isAI) return 'bg-transparent border-transparent';
    
    // High Confidence (> 80%)
    if (confidence > 0.8) {
      return 'bg-linear-to-br from-red-200/80 via-red-100/60 to-red-50/40 border-b-3 border-red-500 shadow-[0_2px_8px_-2px_rgba(239,68,68,0.2)]';
    }
    
    // Medium Confidence (> 50%)
    if (confidence > 0.5) {
      return 'bg-linear-to-br from-orange-200/70 via-orange-100/50 to-orange-50/30 border-b-2 border-orange-400 shadow-[0_1px_4px_-1px_rgba(249,115,22,0.15)]';
    }
    
    // Low Confidence
    return 'bg-linear-to-br from-yellow-100/60 via-yellow-50/40 to-transparent border-b-2 border-yellow-300';
  };

  const getScoreColor = (score: number) => {
    if (score < 20) return 'text-emerald-600';
    if (score < 50) return 'text-yellow-600';
    if (score < 80) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <ShieldCheck size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">AI Sentinel</h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <span className="hidden sm:inline">Advanced AI Detection</span>
            <div className="h-4 w-px bg-slate-200" />
            <a href="#" className="hover:text-indigo-600 transition-colors">How it works</a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Is it written by <span className="text-indigo-600">AI</span>?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Paste your text below to analyze its origin. Our AI identifies patterns, 
              syntax, and structures typical of large language models.
            </p>
          </motion.div>
        </section>

        {/* Input Section */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Sparkles size={16} className="text-indigo-500" />
                Input Text
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCopy}
                  disabled={!inputText}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all disabled:opacity-50"
                  title="Copy text"
                >
                  <Copy size={18} />
                </button>
                <button 
                  onClick={handleClear}
                  disabled={!inputText}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all disabled:opacity-50"
                  title="Clear text"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste the text you want to analyze here (minimum 50 words recommended for better accuracy)..."
              className="w-full h-64 p-6 text-lg text-slate-700 bg-transparent border-none focus:ring-0 resize-none placeholder:text-slate-300"
            />
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                {inputText.split(/\s+/).filter(Boolean).length} words | {inputText.length} characters
              </span>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !inputText.trim()}
                className={cn(
                  "px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none",
                  isAnalyzing && "cursor-not-allowed"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Check for AI
                  </>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700"
            >
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </section>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.section
              ref={resultRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="space-y-8 pb-24"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">AI Probability</span>
                  <div className={cn("text-6xl font-black mb-2", getScoreColor(result.overallScore))}>
                    {result.overallScore}%
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                    {result.overallScore > 70 ? <AlertCircle size={14} className="text-red-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                    {result.overallScore > 70 ? 'Likely AI' : result.overallScore > 30 ? 'Mixed Content' : 'Likely Human'}
                  </div>
                </div>

                {/* Summary Card */}
                <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <button
                      onClick={handleShare}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        shareSuccess 
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                          : "bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100"
                      )}
                    >
                      {shareSuccess ? (
                        <>
                          <CheckCircle2 size={16} />
                          Link Copied!
                        </>
                      ) : (
                        <>
                          <Share2 size={16} />
                          Share Analysis
                        </>
                      )}
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Info size={20} className="text-indigo-500" />
                    Analysis Summary
                  </h3>
                  <p className="text-slate-600 leading-relaxed italic">
                    "{result.summary}"
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Segments</div>
                      <div className="text-xl font-bold text-slate-800">{result.segments.length}</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">AI Flags</div>
                      <div className="text-xl font-bold text-slate-800">
                        {result.segments.filter(s => s.isAI).length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlighted Text */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <Search size={16} className="text-indigo-500" />
                    Highlighted Analysis
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-tighter">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-200 border border-red-400 rounded-sm" />
                      <span>High Confidence</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-orange-200 border border-orange-400 rounded-sm" />
                      <span>Medium</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded-sm" />
                      <span>Low</span>
                    </div>
                  </div>
                </div>
                <div className="p-8 text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {result.segments.map((segment, idx) => (
                    <motion.span
                      key={idx}
                      onMouseEnter={() => setHoveredSegment(idx)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      initial={false}
                      animate={{
                        scale: hoveredSegment === idx && segment.isAI ? 1.02 : 1,
                        zIndex: hoveredSegment === idx ? 10 : 0
                      }}
                      className={cn(
                        "inline-block transition-all duration-300 px-1 py-0.5 rounded-sm cursor-help relative",
                        getConfidenceColor(segment.confidence, segment.isAI),
                        hoveredSegment === idx && segment.isAI && "ring-2 ring-indigo-500/30 ring-offset-1 shadow-lg"
                      )}
                    >
                      {segment.text}
                      {segment.isAI && (
                        <span className={cn(
                          "absolute -top-1 -right-1 w-2 h-2 rounded-full",
                          segment.confidence > 0.8 ? "bg-red-500" : segment.confidence > 0.5 ? "bg-orange-500" : "bg-yellow-400"
                        )} />
                      )}
                    </motion.span>
                  ))}
                </div>
                
                {/* Reasoning Tooltip-like area */}
                <div className="p-4 bg-indigo-50 border-t border-indigo-100 min-h-[80px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {hoveredSegment !== null && result.segments[hoveredSegment].isAI ? (
                      <motion.div
                        key={hoveredSegment}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-start gap-3 text-indigo-900"
                      >
                        <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold mb-0.5">
                            AI Detected ({(result.segments[hoveredSegment].confidence * 100).toFixed(0)}% confidence)
                          </p>
                          <p className="text-xs opacity-80 leading-tight">
                            {result.segments[hoveredSegment].reasoning || "Detected patterns typical of AI language models."}
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <p className="text-xs text-indigo-400 font-medium italic">
                        Hover over highlighted segments to see detailed reasoning
                      </p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Tips Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    Human Indicators
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="mt-1 flex-shrink-0 text-slate-300" />
                      Varied sentence structure and length (burstiness)
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="mt-1 flex-shrink-0 text-slate-300" />
                      Specific personal anecdotes or unique perspectives
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="mt-1 flex-shrink-0 text-slate-300" />
                      Occasional stylistic imperfections or colloquialisms
                    </li>
                  </ul>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <AlertCircle size={18} className="text-red-500" />
                    AI Indicators
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="mt-1 flex-shrink-0 text-slate-300" />
                      Highly consistent and repetitive sentence patterns
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="mt-1 flex-shrink-0 text-slate-300" />
                      Overuse of transition words (e.g., "Furthermore", "In conclusion")
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="mt-1 flex-shrink-0 text-slate-300" />
                      Neutral, objective tone with lack of personal voice
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-24">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white">
              <ShieldCheck size={14} />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">AI Sentinel</span>
          </div>
          <p className="text-sm max-w-md mx-auto mb-8">
            Empowering users to distinguish between human creativity and machine-generated content.
          </p>
          <div className="flex justify-center gap-8 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-[10px]">
            © 2026 AI Sentinel. Powered by Google Gemini.
          </div>
        </div>
      </footer>
    </div>
  );
}
