import React from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PageCanvas } from './PageCanvas';

interface SpreadProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  leftPage: number;
  rightPage: number;
  title: string;
}

export const Spread: React.FC<SpreadProps> = ({ pdfDoc, leftPage, rightPage, title }) => {
  return (
    <div className="flex flex-col items-center gap-3 p-5 bg-gray-50 rounded-xl border border-gray-200">
      <div className="text-sm font-semibold text-gray-700">{title}</div>
      <div className="flex items-center gap-1 bg-gray-200 p-1.5 rounded shadow-inner">
        <PageCanvas pdfDoc={pdfDoc} pageNumber={leftPage} label="Left" />
        <div className="w-px h-[226px] bg-gray-300 mx-1 shadow-sm"></div>
        <PageCanvas pdfDoc={pdfDoc} pageNumber={rightPage} label="Right" />
      </div>
    </div>
  );
};
