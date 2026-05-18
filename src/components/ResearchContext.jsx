/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

const ResearchContext = createContext({});

export const useResearch = () => useContext(ResearchContext);

const PIPELINE_STAGES = [
  { label: 'Initializing law&tech', sublabel: 'Starting autonomous pipeline' }, // 0
  { label: 'Retrieving Statutory Data', sublabel: 'IPC, CrPC, Constitutional Statutes' }, // 1
  { label: 'Cross-Referencing Precedent', sublabel: 'Supreme Court & High Court Archives' }, // 2
  { label: 'Deep AI Synthesis', sublabel: 'Multi-Agent Logical Reasoning' }, // 3
  { label: 'Finalizing Intelligence Brief', sublabel: 'Generating Strategic Roadmap' }, // 4
];

export function ResearchProvider({ children }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState([]);
  const [fullData, setFullData] = useState(null);
  const [error, setError] = useState('');
  const [pipelineStage, setPipelineStage] = useState(0);
  const [notification, setNotification] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const navigate = useNavigate();

  const handleSearch = async (searchQuery, token) => {
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    setIsSearching(true);
    setHasSearched(true);
    setResults([]);
    setFullData(null);
    setError('');
    setPipelineStage(0);

    const safeToken = token || localStorage.getItem('jurisai_token');

    try {
      // 1. Retrieval
      setPipelineStage(1);
      const res = await fetch('/api/legal-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(safeToken ? { Authorization: `Bearer ${safeToken}` } : {})
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!res.ok) throw new Error(`Query failed: ${res.statusText}`);
      const data = await res.json();
      
      let finalData = { ...data };

      // 2. Deep Synthesis only when the initial response does not already include a finished report.
      if (data.context_for_ai && !data.synthesis_ready) {
        setPipelineStage(2);
        setIsSynthesizing(true);
        
        // Pseudo-delay to show Agent Verification if it returns too fast
        // Making it feel "Proper" as requested
        await new Promise(r => setTimeout(r, 1500));
        setPipelineStage(3);

        const synRes = await fetch('/api/research/synthesize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(safeToken ? { Authorization: `Bearer ${safeToken}` } : {})
          },
          body: JSON.stringify({ query: searchQuery, context: data.context_for_ai })
        });
        if (synRes.ok) {
          const synData = await synRes.json();
          finalData = { ...finalData, ...synData, synthesis_ready: true };
        }
      }

      setPipelineStage(4);
      setResults(finalData.results || []);
      setFullData(finalData);

      // Complete
      setTimeout(() => {
        setIsSearching(false);
        setIsSynthesizing(false);
        showNotification("Intelligence Brief Ready", "**law&tech** has finished the deep multi-agent analysis.", finalData, searchQuery, false, "deep_report");
      }, 1200);

    } catch (err) {
      setError(err.message);
      setResults([]);
      setIsSearching(false);
      setIsSynthesizing(false);
    }
  };

  const handleFileUpload = async (uploadFile, token) => {
    if (!uploadFile) return;
    setIsAnalyzing(true);
    setHasSearched(true);
    setError('');
    
    const safeToken = token || localStorage.getItem('jurisai_token');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: safeToken ? { Authorization: `Bearer ${safeToken}` } : {},
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Analysis failed');
      }

      const data = await res.json();
      setAnalysisResult(data);
      // Keep analysis flow clean; no deep-report style popup card here.
      setNotification(null);
    } catch (err) {
      setError(err.message);
      showNotification("Analysis Failed", err.message, null, null, true, "none");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
    setHasSearched(false);
  };

  const showNotification = (title, message, data, q, isError = false, actionType = "deep_report") => {
    setNotification({ title, message, data, q, isError, actionType });
    if (isError) {
      setTimeout(() => setNotification(null), 5000);
    } // Success notifications stay until dismissed or clicked
  };

  const viewDeepAnalysis = (data, q) => {
    if (data) {
      setNotification(null);
      navigate('/research/report', { state: { report: data, query: q } });
    }
  };

  return (
    <ResearchContext.Provider value={{
      query, setQuery, isSearching, isSynthesizing, hasSearched,
      results, fullData, error, pipelineStage, handleSearch, viewDeepAnalysis,
      isAnalyzing, analysisResult, handleFileUpload, clearAnalysis
    }}>
      {children}

      {/* Global Notification Overlay for Background Tasks */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-8 right-8 z-[100] w-96 p-6 rounded-2xl bg-background/90 border-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            style={{ borderColor: notification.isError ? 'rgba(255,50,100,0.3)' : 'rgba(0,240,255,0.3)' }}
          >
            <div className="flex gap-4">
              <div className="shrink-0 mt-1">
                {notification.isError ? (
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-foreground font-bold mb-1">{notification.title}</h4>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{notification.message}</p>
                
                <div className="flex gap-3">
                  {!notification.isError && notification.actionType === "deep_report" && (
                    <button 
                      onClick={() => viewDeepAnalysis(notification.data, notification.q)}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px] rounded-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2"
                    >
                      View Report <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  <button 
                    onClick={() => setNotification(null)}
                    className="px-4 py-2 bg-primary/5 text-foreground font-bold uppercase tracking-widest text-[10px] rounded-lg border border-border hover:bg-primary/10 transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ResearchContext.Provider>
  );
}
