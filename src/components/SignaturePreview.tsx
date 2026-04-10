import React from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Spread } from './Spread';
import { getSignaturePages } from '../lib/imposition';

interface SignaturePreviewProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  sheetsPerSig: number;
  binding: 'left' | 'right';
  totalPages: number;
}

export const SignaturePreview: React.FC<SignaturePreviewProps> = ({ pdfDoc, sheetsPerSig, binding, totalPages }) => {
  const sheets = getSignaturePages(0, sheetsPerSig, binding, totalPages);
  
  return (
    <div className="flex flex-col gap-10">
      {sheets.map((sheet, idx) => (
        <div key={idx} className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
              {sheet.sheetIndex}
            </div>
            <h3 className="text-lg font-bold text-gray-800">Sheet {sheet.sheetIndex}</h3>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Spread 
              pdfDoc={pdfDoc} 
              leftPage={sheet.front[0]} 
              rightPage={sheet.front[1]} 
              title="Front Side" 
            />
            <Spread 
              pdfDoc={pdfDoc} 
              leftPage={sheet.back[0]} 
              rightPage={sheet.back[1]} 
              title="Back Side" 
            />
          </div>
        </div>
      ))}
    </div>
  );
};
