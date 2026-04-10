import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface PageCanvasProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  pageNumber: number;
  label: string;
}

export const PageCanvas: React.FC<PageCanvasProps> = ({ pdfDoc, pageNumber, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!pdfDoc || !pageNumber || pageNumber > pdfDoc.numPages) return;
    
    let renderTask: any;
    let isMounted = true;
    
    pdfDoc.getPage(pageNumber).then(page => {
      if (!isMounted) return;
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const targetWidth = 160;
      const scale = targetWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });
      
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      
      const context = canvas.getContext('2d');
      if (context) {
        renderTask = page.render({ canvasContext: context, viewport: scaledViewport });
      }
    }).catch(err => console.error("Error rendering page", err));
    
    return () => {
      isMounted = false;
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDoc, pageNumber]);
  
  const isBlank = !pageNumber || !pdfDoc || pageNumber > pdfDoc.numPages;
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
      {isBlank ? (
        <div className="w-[160px] h-[226px] bg-white flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-300 shadow-sm">
          Blank Page
        </div>
      ) : (
        <canvas ref={canvasRef} className="border border-gray-300 shadow-sm bg-white" />
      )}
      <div className="text-xs text-gray-400 font-mono">Page {pageNumber}</div>
    </div>
  );
};
