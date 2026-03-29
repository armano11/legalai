"use client";

import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Hexagon, FileText, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { GradientText } from "@/components/ui/gradient-text";

interface DocumentAnalyzerProps {
  className?: string;
  onUpload?: (file: File) => void;
  onAbort?: () => void;
}

export const DocumentAnalyzerHero = ({
  className,
  onUpload,
  onAbort,
}: DocumentAnalyzerProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 10485760, // 10MB
    multiple: false
  });

  const handleUploadClick = () => {
    if (selectedFile && onUpload) {
      onUpload(selectedFile);
    }
  };

  const handleAbort = () => {
    setSelectedFile(null);
    if (onAbort) {
      onAbort();
    }
  };

  return (
    <div
      className={cn(
        "relative min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center font-sans overflow-hidden text-slate-200",
        className
      )}
    >
      {/* Background Effects */}
      <BackgroundGrid />
      <AmbientBlobs />

      {/* Main Content Wrapper */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 flex flex-col items-center mt-[-5vh]">
        
        {/* Top Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-slate-950/50 mb-8 backdrop-blur-sm">
          <Hexagon className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] tracking-[0.2em] font-mono text-slate-400 uppercase">
            Professional Document Analyzer
          </span>
          <span className="ml-2 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[8px] font-bold">V2.0.1</span>
        </div>

        {/* Hero Typography */}
        <div className="text-center mb-16 select-none">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-2">
            <span className="text-white block">Document</span>
            <GradientText as="span" className="font-bold tracking-tight pb-3">
              Analyzer
            </GradientText>
          </h1>
          <p className="mt-6 text-slate-500 text-sm md:text-base max-w-xl mx-auto font-medium">
            Synthesizing legal intelligence through automated document analysis and
            structural compliance review.
          </p>
        </div>

        {/* Upload Interface Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-3xl rounded-2xl bg-[#0B1021]/80 border border-[#1E2540] p-6 md:p-10 shadow-2xl backdrop-blur-md"
        >
          {/* Dropzone */}
          {!selectedFile ? (
            <div 
              {...getRootProps()}
              className={cn(
                "relative group cursor-pointer flex flex-col items-center justify-center w-full h-40 rounded-lg border border-dashed border-[#2A3454] bg-[#070B16] hover:bg-[#0A0F1D] transition-colors duration-300",
                isDragActive && "border-[#8BA1FF] bg-[#0A0F1D]"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-300 transition-colors">
                <Upload className={cn("w-4 h-4", isDragActive && "animate-bounce text-[#8BA1FF]")} />
                <span className={cn("font-mono text-[11px] tracking-widest uppercase", isDragActive && "text-[#8BA1FF]")}>
                  {isDragActive ? "Release to Analyze" : "Drop Document or click to Browse"}
                </span>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative flex items-center justify-between w-full h-40 rounded-lg border border-[#2A3454] bg-[#070B16] p-6"
            >
               <div className="flex items-center gap-4">
                 <div className="p-4 rounded-xl bg-[#8BA1FF]/10 text-[#8BA1FF]">
                   <FileText className="w-8 h-8" />
                 </div>
                 <div>
                   <p className="font-mono text-sm uppercase tracking-wider text-slate-200 truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</p>
                   <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{(selectedFile.size / (1024*1024)).toFixed(2)} MB • READY FOR ANALYSIS</p>
                 </div>
               </div>
               
               <button 
                 onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                 className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
            </motion.div>
          )}

          {/* Footer Info & Actions */}
          <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-6">
            
            {/* Specs */}
            <div className="flex w-full md:w-auto justify-between md:gap-12 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              <span>Size Limit: 10MB</span>
              <span>Accepted: PDF, DOCX, TXT, IMAGE</span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
              <button 
                onClick={handleAbort}
                disabled={!selectedFile}
                className="px-6 py-2.5 rounded text-[11px] font-mono tracking-widest text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Abort
              </button>
              <button 
                onClick={handleUploadClick}
                disabled={!selectedFile}
                className={cn(
                  "px-8 py-2.5 rounded text-[11px] font-mono tracking-widest text-white transition-colors shadow-[0_0_15px_rgba(76,59,139,0.4)] uppercase",
                  selectedFile 
                    ? "bg-[#4C3B8B] hover:bg-[#5C4B9B]" 
                    : "bg-[#2A2346] opacity-50 cursor-not-allowed shadow-none"
                )}
              >
                Upload
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

// Sub-components for background visual accuracy
const BackgroundGrid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div 
      className="absolute inset-0" 
      style={{
        backgroundImage: `radial-gradient(circle at center, #ffffff11 1px, transparent 1px)`,
        backgroundSize: `24px 24px`,
      }}
    />
    {/* Fade out grid at the edges */}
    <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-transparent to-[#030712] opacity-80" />
    <div className="absolute inset-0 bg-gradient-to-r from-[#030712] via-transparent to-[#030712] opacity-80" />
  </div>
);

const AmbientBlobs = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <motion.div 
      animate={{ rotate: [0, 5, 0], scale: [1, 1.05, 1] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[10%] left-[15%] w-[300px] h-[80px] bg-cyan-900/40 rounded-full blur-[80px] -rotate-45" 
    />
    <motion.div 
      animate={{ rotate: [0, -5, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[15%] right-[10%] w-[400px] h-[100px] bg-amber-900/20 rounded-full blur-[80px] rotate-12" 
    />
    <motion.div 
      animate={{ rotate: [0, 3, 0], scale: [1, 1.02, 1] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[200px] bg-rose-900/20 rounded-full blur-[100px] -rotate-12" 
    />
  </div>
);
