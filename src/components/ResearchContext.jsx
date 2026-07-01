/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const ResearchContext = createContext({});

export const useResearch = () => useContext(ResearchContext);

const PIPELINE_STAGES = [
  { label: 'Initializing law&tech', sublabel: 'Starting autonomous pipeline' },
  { label: 'Retrieving Statutory Data', sublabel: 'IPC, CrPC, Constitutional Statutes' },
  { label: 'Cross-Referencing Precedent', sublabel: 'Supreme Court & High Court Archives' },
  { label: 'Deep AI Synthesis', sublabel: 'Multi-Agent Logical Reasoning' },
  { label: 'Finalizing Intelligence Brief', sublabel: 'Generating Strategic Roadmap' },
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const navigate = useNavigate();

  const handleSearch = useCallback(async (searchQuery, token) => {
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setIsSearching(true);
    setHasSearched(true);
    setResults([]);
    setFullData(null);
    setError('');
    setPipelineStage(0);

    const safeToken = token || localStorage.getItem('legalforge_token');

    try {
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

      if (data.context_for_ai && !data.synthesis_ready) {
        setPipelineStage(2);
        setIsSynthesizing(true);
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
      setIsSearching(false);
      setIsSynthesizing(false);

      if (finalData) {
        navigate('/research/report', { state: { report: finalData, query: searchQuery } });
      }
    } catch (err) {
      setError(err.message);
      setResults([]);
      setIsSearching(false);
      setIsSynthesizing(false);
    }
  }, [navigate]);

  const handleFileUpload = useCallback(async (uploadFile, token) => {
    if (!uploadFile) return;
    setIsAnalyzing(true);
    setHasSearched(true);
    setError('');

    const safeToken = token || localStorage.getItem('legalforge_token');

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
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setHasSearched(false);
  }, []);

  const viewDeepAnalysis = useCallback((data, q) => {
    if (data) {
      navigate('/research/report', { state: { report: data, query: q } });
    }
  }, [navigate]);

  return (
    <ResearchContext.Provider value={{
      query, setQuery, isSearching, isSynthesizing, hasSearched,
      results, fullData, error, pipelineStage, handleSearch, viewDeepAnalysis,
      isAnalyzing, analysisResult, handleFileUpload, clearAnalysis
    }}>
      {children}
    </ResearchContext.Provider>
  );
}
