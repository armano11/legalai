
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Scale, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import FileUpload, { DropZone, FileError, FileList, FileInfo } from "@/components/ui/file-upload";
import TextThree from "@/components/ui/text-three";

interface LegalAnalyzerV3Props {
  className?: string;
  onUpload?: (file: File) => void;
  onAbort?: () => void;
}

export const LegalAnalyzerV3 = ({
  className,
  onUpload,
  onAbort,
}: LegalAnalyzerV3Props) => {
  const [uploadFiles, setUploadFiles] = useState<FileInfo[]>([]);

  const onFileSelectChange = (files: FileInfo[]) => {
    setUploadFiles(files);
  };

  const onRemove = (fileId: string) => {
    setUploadFiles(uploadFiles.filter(file => file.id !== fileId));
  };

  const handleUploadClick = () => {
    if (uploadFiles.length > 0 && onUpload) {
      onUpload(uploadFiles[0].file);
    }
  };

  const handleAbort = () => {
    setUploadFiles([]);
    if (onAbort) {
      onAbort();
    }
  };

  return (
    <div className={cn(
      "relative min-h-screen w-full bg-[#020308] text-slate-300 selection:bg-indigo-500/30 font-sans overflow-hidden",
      className
    )}>
      
      {/* ─── LAYER 0: THE ATMOSPHERE ─── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
        <div className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[140%] h-[700px] bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent blur-[120px] rounded-[100%]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020308_80%)] opacity-80" />
      </div>

      {/* ─── LAYER 2: HERO SECTION ─── */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-28 flex flex-col items-center">
        
        {/* Status Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-white/5 bg-white/[0.02] mb-10 backdrop-blur-md"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_#6366f1]" />
          <span className="text-[9px] font-mono tracking-[0.3em] text-slate-400 uppercase">Professional Document Analyzer v2.0.1</span>
        </motion.div>

        {/* Master Heading */}
        <div className="text-center mb-8">
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] text-white">
            Document
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-rose-300">
              Analyzer
            </span>
          </h1>
        </div>

        {/* Typewriter Subtitle */}
        <TextThree 
          text="Synthesizing legal intelligence through automated document analysis..." 
          speed={35}
          className="flex justify-center items-center mb-12"
        />

        {/* ─── LAYER 3: THE ANALYZER CONSOLE ─── */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full relative mb-16"
        >
          {/* Outer Glass Frame */}
          <div className="rounded-[40px] border border-white/[0.08] bg-[#0A0D18]/40 backdrop-blur-3xl p-4 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            
            {/* The Inner "Recessed" Tray */}
            <div className="relative rounded-[32px] border border-black/60 bg-[#04060E] p-10 overflow-hidden shadow-inner">
              
              {/* Scanline Animation */}
              <motion.div 
                animate={{ translateY: ["-100%", "300%"] }} 
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent w-full h-[150px] pointer-events-none"
              />

              {/* File Upload System */}
              <div className="relative z-10">
                <FileUpload
                  files={uploadFiles}
                  onFileSelectChange={onFileSelectChange}
                  multiple={false}
                  accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                  maxSize={10}
                  maxCount={1}
                  disabled={false}
                >
                  <div className="space-y-4">
                    <DropZone 
                      prompt="Drop your legal document or click to browse" 
                      className="border-white/10 hover:border-indigo-500/40 bg-transparent py-20 rounded-2xl transition-all duration-500 text-slate-500 hover:text-slate-300 [&_svg]:text-slate-600 hover:[&_svg]:text-indigo-400"
                    />
                    <FileError />
                    <FileList 
                      onClear={() => setUploadFiles([])} 
                      onRemove={onRemove} 
                      canResume={false}
                      className="[&_h3]:text-slate-400 [&_button]:text-slate-400"
                    />
                  </div>
                </FileUpload>
              </div>

              {/* Console Footer */}
              <div className="mt-10 flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-10">
                <div className="flex gap-10 text-[9px] font-mono tracking-[0.2em] text-slate-600 uppercase">
                  <span className="flex items-center gap-2"><div className="h-1 w-1 bg-slate-800 rounded-full"/> Limit: 10MB</span>
                  <span className="flex items-center gap-2"><div className="h-1 w-1 bg-slate-800 rounded-full"/> Accepted: PDF, DOCX, TXT, IMAGE</span>
                </div>

                <div className="flex items-center gap-6 mt-6 md:mt-0">
                  <button 
                    onClick={handleAbort}
                    disabled={uploadFiles.length === 0}
                    className="text-[10px] font-mono tracking-widest text-slate-500 hover:text-rose-400 transition-colors uppercase disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={handleUploadClick}
                    disabled={uploadFiles.length === 0}
                    className={cn(
                      "px-12 py-3.5 rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase transition-all",
                      uploadFiles.length > 0
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-indigo-500/60"
                        : "bg-indigo-900/30 text-slate-600 cursor-not-allowed shadow-none"
                    )}
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Side Accents */}
      <div className="absolute top-1/4 left-10 w-32 h-1 bg-gradient-to-r from-indigo-500/20 to-transparent blur-sm rotate-45 opacity-40" />
      <div className="absolute bottom-1/4 right-10 w-48 h-1 bg-gradient-to-l from-rose-500/10 to-transparent blur-sm -rotate-12 opacity-30" />
    </div>
  );
};
