"use client";

import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Hexagon, Scale, Command, FileText, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

interface DocumentAnalyzerProps {
  className?: string;
  onUpload?: (file: File) => void;
  onAbort?: () => void;
}

export const PremiumDocumentAnalyzer = ({
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
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxSize: 10485760,
    multiple: false,
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
        "relative min-h-screen w-full bg-[#03040B] flex flex-col items-center font-sans overflow-hidden text-slate-200 selection:bg-indigo-500/30",
        className
      )}
    >
      {/* Background Effects */}
      <BackgroundEffects />

      {/* Main Hero Content */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-28 pb-12 flex flex-col items-center flex-1">

        {/* Premium Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] backdrop-blur-md mb-10 shadow-[0_0_20px_rgba(255,255,255,0.02)]"
        >
          <Hexagon className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[10px] tracking-[0.2em] font-mono text-slate-300 uppercase">
            Professional Document Analyzer
          </span>
          <span className="text-[9px] font-mono tracking-widest bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-sm">
            V2.0.1
          </span>
        </motion.div>

        {/* Hero Typography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-center mb-16 select-none"
        >
          <h1 className="text-6xl md:text-[5rem] font-bold tracking-tight leading-[1.1] mb-4">
            <span className="text-[#F8F9FA] block drop-shadow-sm">Document</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8BA1FF] via-[#E2D4F0] to-[#F1A7B1] drop-shadow-sm">
              Analyzer
            </span>
          </h1>
          <p className="mt-6 text-slate-400/80 text-sm md:text-base max-w-2xl mx-auto font-medium tracking-wide">
            Synthesizing legal intelligence through automated document analysis and
            structural compliance review.
          </p>
        </motion.div>

        {/* Glassmorphic Upload Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl rounded-[24px] bg-[#0A0D18]/60 border border-white/[0.05] p-6 shadow-2xl backdrop-blur-2xl ring-1 ring-white/[0.02]"
        >
          {/* Dropzone or File Preview */}
          <AnimatePresence mode="wait">
            {!selectedFile ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <div
                  {...getRootProps()}
                  className={cn(
                    "relative group cursor-pointer flex flex-col items-center justify-center w-full h-[220px] rounded-xl border border-dashed border-[#2A3454] bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 overflow-hidden",
                    isDragActive && "border-indigo-500/60 bg-indigo-500/[0.03]"
                  )}
                >
                  <input {...getInputProps()} />
                  {/* Subtle hover glow inside dropzone */}
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="flex flex-col items-center gap-4 text-slate-500 group-hover:text-slate-300 transition-colors z-10">
                    <div className={cn(
                      "p-3 rounded-full bg-white/[0.02] border border-white/[0.05] group-hover:scale-110 transition-transform duration-500",
                      isDragActive && "scale-110 border-indigo-500/30 bg-indigo-500/[0.05]"
                    )}>
                      <Upload className={cn("w-5 h-5", isDragActive && "text-indigo-400 animate-bounce")} />
                    </div>
                    <span className={cn(
                      "font-mono text-xs tracking-[0.2em] uppercase",
                      isDragActive && "text-indigo-300"
                    )}>
                      {isDragActive ? "Release To Analyze" : "Drop Document Or Click To Browse"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="file-preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative flex items-center justify-between w-full h-[220px] rounded-xl border border-[#2A3454] bg-white/[0.01] p-8"
              >
                <div className="flex items-center gap-5">
                  <div className="p-5 rounded-2xl bg-indigo-500/[0.08] border border-indigo-500/20 text-indigo-400">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-mono text-sm uppercase tracking-wider text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1.5 uppercase tracking-widest font-mono">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • READY FOR ANALYSIS
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="p-2.5 rounded-full hover:bg-white/[0.05] text-slate-500 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Specs & Actions */}
          <div className="flex flex-col md:flex-row items-center justify-between mt-6 px-2 gap-6">
            {/* Metadata / Limits */}
            <div className="flex w-full md:w-auto justify-between md:gap-12 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              <span>Size Limit: 10MB</span>
              <span>Accepted: PDF, DOCX, TXT, IMAGE</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleAbort}
                disabled={!selectedFile}
                className="px-6 py-2.5 rounded-lg text-[11px] font-mono tracking-[0.15em] text-slate-500 hover:text-slate-300 hover:bg-white/[0.02] transition-all uppercase disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Abort
              </button>
              <button
                onClick={handleUploadClick}
                disabled={!selectedFile}
                className={cn(
                  "relative px-8 py-2.5 rounded-lg text-[11px] font-mono tracking-[0.15em] transition-all border uppercase overflow-hidden",
                  selectedFile
                    ? "bg-[#272545] hover:bg-[#34315C] text-indigo-100 border-indigo-500/20 shadow-[0_0_20px_rgba(76,59,139,0.3)] hover:shadow-[0_0_30px_rgba(76,59,139,0.5)]"
                    : "bg-[#15132A] text-slate-600 border-white/[0.03] cursor-not-allowed shadow-none"
                )}
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                Upload
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

// --- Sub-Components ---

const BackgroundEffects = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    {/* High-end subtle dot grid */}
    <div
      className="absolute inset-0 opacity-[0.15]"
      style={{
        backgroundImage: `radial-gradient(circle at center, #64748b 1px, transparent 1px)`,
        backgroundSize: `28px 28px`,
      }}
    />
    {/* Massive smooth top halo */}
    <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[140%] h-[800px] bg-gradient-to-b from-[#2A236A] via-[#1A1844] to-transparent opacity-50 blur-[120px] rounded-[100%]" />
    {/* Deep corner shadows to focus the center */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#03040B_100%)] opacity-90" />
  </div>
);
