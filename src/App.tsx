/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// Use the Vite worker import
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { Upload, File as FileIcon, Settings, Download, BookOpen, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { imposePdf } from './lib/imposition';
import { SignaturePreview } from './components/SignaturePreview';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  
  const [sheetsPerSig, setSheetsPerSig] = useState(4);
  const [binding, setBinding] = useState<'left' | 'right'>('left');
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    const buffer = await selectedFile.arrayBuffer();
    
    try {
      // Pass a copy of the buffer to prevent PDF.js from detaching it
      const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
    } catch (err) {
      console.error("Error loading PDF for preview", err);
      alert("Failed to load PDF preview.");
    }
  };
  
  const handleGenerate = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const imposedBytes = await imposePdf(buffer, sheetsPerSig, binding);
      const blob = new Blob([imposedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `imposed_${file.name || 'booklet.pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating PDF", err);
      alert("Failed to generate imposed PDF.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center gap-3 pb-6 border-b border-gray-200">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booklet Imposition</h1>
            <p className="text-sm text-gray-500">Prepare your PDF for printing as a book in signatures.</p>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls - 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            {/* Upload Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileIcon className="w-5 h-5 text-gray-500" />
                Input PDF
              </h2>
              
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 truncate max-w-full">
                    {file ? <span className="font-semibold text-blue-600">{file.name}</span> : "Click to upload PDF"}
                  </p>
                  {pdfDoc && <p className="text-xs text-gray-500 mt-1">{pdfDoc.numPages} pages</p>}
                </div>
                <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
              </label>
            </div>
            
            {/* Settings Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                Imposition Settings
              </h2>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Sheets per Signature
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="50"
                  value={sheetsPerSig}
                  onChange={(e) => setSheetsPerSig(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 leading-relaxed">
                  Each sheet creates 4 pages in the final book. A signature of {sheetsPerSig} sheets will contain {sheetsPerSig * 4} pages.
                </p>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Binding Direction
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBinding('left')}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${binding === 'left' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                    Left to Right
                  </button>
                  <button
                    onClick={() => setBinding('right')}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${binding === 'right' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Right to Left
                  </button>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Left to Right is standard for English. Right to Left is used for Arabic, Hebrew, Japanese, etc.
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <button
              onClick={handleGenerate}
              disabled={!file || isProcessing}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Imposed PDF
                </>
              )}
            </button>
          </div>
          
          {/* Preview - 8 cols */}
          <div className="lg:col-span-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 min-h-[600px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gray-500" />
                  Signature Preview
                </h2>
                {pdfDoc && (
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Signature 1 of {Math.ceil(pdfDoc.numPages / (sheetsPerSig * 4))}
                  </span>
                )}
              </div>
              
              {!pdfDoc ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-32">
                  <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No PDF Uploaded</p>
                  <p className="text-sm mt-1">Upload a PDF to see the imposition preview</p>
                </div>
              ) : (
                <SignaturePreview 
                  pdfDoc={pdfDoc} 
                  sheetsPerSig={sheetsPerSig} 
                  binding={binding} 
                  totalPages={pdfDoc.numPages} 
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
