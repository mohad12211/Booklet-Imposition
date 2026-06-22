import { PDFDocument, PageSizes, PDFName } from 'pdf-lib';

export async function imposePdf(fileBuffer: ArrayBuffer, sheetsPerSig: number, binding: 'left' | 'right') {
  const srcDoc = await PDFDocument.load(fileBuffer);
  const srcPages = srcDoc.getPages();
  const totalSrcPages = srcPages.length;
  
  // Fix pages with missing Contents
  for (let i = 0; i < srcPages.length; i++) {
    const page = srcPages[i];
    if (!page.node.has(PDFName.of('Contents'))) {
      const emptyStream = srcDoc.context.flateStream('');
      const streamRef = srcDoc.context.register(emptyStream);
      page.node.set(PDFName.of('Contents'), streamRef);
    }
  }
  
  const pagesPerSig = sheetsPerSig * 4;
  const numSigs = Math.ceil(totalSrcPages / pagesPerSig);
  
  const outDoc = await PDFDocument.create();
  
  // A4 Landscape: 841.89 x 595.28
  const outWidth = PageSizes.A4[1]; 
  const outHeight = PageSizes.A4[0];
  const halfWidth = outWidth / 2;
  
  const embeddedPages: any[] = [];
  for (let i = 0; i < srcPages.length; i++) {
    try {
      // Use the CropBox as the embedding bounding box so that pages cropped
      // via CropBox (from any tool) are treated as their visible region.
      // getCropBox() falls back to MediaBox when no CropBox is set, so this
      // is always safe for non-cropped PDFs.
      const crop = srcPages[i].getCropBox();
      const embeddedPage = await outDoc.embedPage(srcPages[i], {
        left:   crop.x,
        bottom: crop.y,
        right:  crop.x + crop.width,
        top:    crop.y + crop.height,
      });
      embeddedPages.push(embeddedPage);
    } catch (e) {
      console.warn(`Could not embed page ${i + 1}:`, e);
      embeddedPages.push(null);
    }
  }
  
  for (let sig = 0; sig < numSigs; sig++) {
    const sigStart = sig * pagesPerSig;
    
    for (let sheet = 0; sheet < sheetsPerSig; sheet++) {
      const frontPage = outDoc.addPage([outWidth, outHeight]);
      const backPage = outDoc.addPage([outWidth, outHeight]);
      
      const i = sheet + 1;
      let frontLeftIdx, frontRightIdx, backLeftIdx, backRightIdx;
      
      if (binding === 'left') {
        frontLeftIdx = pagesPerSig - 2 * (i - 1);
        frontRightIdx = 2 * i - 1;
        backLeftIdx = 2 * i;
        backRightIdx = pagesPerSig - 2 * (i - 1) - 1;
      } else {
        frontLeftIdx = 2 * i - 1;
        frontRightIdx = pagesPerSig - 2 * (i - 1);
        backLeftIdx = pagesPerSig - 2 * (i - 1) - 1;
        backRightIdx = 2 * i;
      }
      
      const drawPage = (outPage: any, srcIdx0: number, isLeft: boolean) => {
         const actualIdx = sigStart + srcIdx0;
         if (actualIdx < totalSrcPages) {
           const embeddedPage = embeddedPages[actualIdx];
           if (embeddedPage) {
             const scale = Math.min(halfWidth / embeddedPage.width, outHeight / embeddedPage.height);
             const scaledWidth = embeddedPage.width * scale;
             const scaledHeight = embeddedPage.height * scale;
             
             const xOffset = isLeft ? (halfWidth - scaledWidth) / 2 : halfWidth + (halfWidth - scaledWidth) / 2;
             const yOffset = (outHeight - scaledHeight) / 2;
             
             outPage.drawPage(embeddedPage, {
               x: xOffset,
               y: yOffset,
               width: scaledWidth,
               height: scaledHeight,
             });
           }
         }
      };
      
      drawPage(frontPage, frontLeftIdx - 1, true);
      drawPage(frontPage, frontRightIdx - 1, false);
      
      drawPage(backPage, backLeftIdx - 1, true);
      drawPage(backPage, backRightIdx - 1, false);
    }
  }
  
  return await outDoc.save();
}

export const getSignaturePages = (sigIndex: number, sheetsPerSig: number, binding: 'left' | 'right', totalPages: number) => {
  const pagesPerSig = sheetsPerSig * 4;
  const sigStart = sigIndex * pagesPerSig;
  
  const sheets = [];
  for (let sheet = 0; sheet < sheetsPerSig; sheet++) {
    const i = sheet + 1;
    let frontLeft, frontRight, backLeft, backRight;
    
    if (binding === 'left') {
      frontLeft = pagesPerSig - 2 * (i - 1);
      frontRight = 2 * i - 1;
      backLeft = 2 * i;
      backRight = pagesPerSig - 2 * (i - 1) - 1;
    } else {
      frontLeft = 2 * i - 1;
      frontRight = pagesPerSig - 2 * (i - 1);
      backLeft = pagesPerSig - 2 * (i - 1) - 1;
      backRight = 2 * i;
    }
    
    sheets.push({
      sheetIndex: i,
      front: [sigStart + frontLeft, sigStart + frontRight],
      back: [sigStart + backLeft, sigStart + backRight]
    });
  }
  return sheets;
};
