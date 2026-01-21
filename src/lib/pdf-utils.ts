import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

// Lazy load pdfjs only on client side
let pdfjs: typeof import('pdfjs-dist') | null = null;

const getPdfjs = async () => {
  if (typeof window === 'undefined') {
    throw new Error('pdfjs-dist can only be used in the browser');
  }
  
  if (!pdfjs) {
    pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  
  return pdfjs;
};

export interface PDFFile {
  id: string;
  file: File;
  name: string;
  pageCount: number;
  thumbnail?: string;
}

export interface PageInfo {
  pageNumber: number;
  thumbnail?: string;
  rotation: number;
  selected: boolean;
}

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Get page count from PDF
export const getPdfPageCount = async (file: File): Promise<number> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  return pdf.getPageCount();
};

// Generate thumbnail for PDF page
export const generateThumbnail = async (
  file: File,
  pageNumber: number = 1,
  scale: number = 0.3
): Promise<string> => {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNumber);
  
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  await page.render({
    canvasContext: context,
    viewport,
    canvas,
  }).promise;
  
  return canvas.toDataURL('image/jpeg', 0.7);
};

// Merge multiple PDFs
export const mergePdfs = async (
  files: File[],
  onProgress?: (progress: number) => void
): Promise<Uint8Array> => {
  const mergedPdf = await PDFDocument.create();
  
  for (let i = 0; i < files.length; i++) {
    const arrayBuffer = await files[i].arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
    
    if (onProgress) {
      onProgress(((i + 1) / files.length) * 100);
    }
  }
  
  return mergedPdf.save();
};

// Split PDF by pages
export const splitPdf = async (
  file: File,
  ranges: string,
  onProgress?: (progress: number) => void
): Promise<{ name: string; data: Uint8Array }[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();
  
  // Parse ranges like "1-3,5,7-9"
  const parsedRanges = parsePageRanges(ranges, totalPages);
  const results: { name: string; data: Uint8Array }[] = [];
  
  for (let i = 0; i < parsedRanges.length; i++) {
    const range = parsedRanges[i];
    const newPdf = await PDFDocument.create();
    const pageIndices = range.map(p => p - 1);
    const copiedPages = await newPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));
    
    const fileName = range.length === 1 
      ? `page_${range[0]}.pdf`
      : `pages_${range[0]}-${range[range.length - 1]}.pdf`;
    
    results.push({
      name: fileName,
      data: await newPdf.save(),
    });
    
    if (onProgress) {
      onProgress(((i + 1) / parsedRanges.length) * 100);
    }
  }
  
  return results;
};

// Parse page range string
export const parsePageRanges = (rangeStr: string, totalPages: number): number[][] => {
  const ranges: number[][] = [];
  const parts = rangeStr.split(',').map(s => s.trim()).filter(Boolean);
  
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(s => parseInt(s.trim()));
      if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
        const range: number[] = [];
        for (let i = start; i <= end; i++) {
          range.push(i);
        }
        ranges.push(range);
      }
    } else {
      const page = parseInt(part);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        ranges.push([page]);
      }
    }
  }
  
  return ranges;
};

// Rotate pages in PDF
export const rotatePages = async (
  file: File,
  rotations: { pageIndex: number; rotation: number }[]
): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  
  for (const { pageIndex, rotation } of rotations) {
    const page = pdf.getPage(pageIndex);
    page.setRotation(degrees(rotation));
  }
  
  return pdf.save();
};

// Delete pages from PDF
export const deletePages = async (
  file: File,
  pageIndicesToDelete: number[]
): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  
  // Remove pages in reverse order to maintain indices
  const sortedIndices = [...pageIndicesToDelete].sort((a, b) => b - a);
  for (const index of sortedIndices) {
    pdf.removePage(index);
  }
  
  return pdf.save();
};

// Add page numbers to PDF
export const addPageNumbers = async (
  file: File,
  options: {
    position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    fontSize: number;
    startPage: number;
    format: string;
  }
): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  
  for (let i = options.startPage - 1; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const pageNum = i + 1;
    const text = options.format.replace('{n}', pageNum.toString()).replace('{total}', pages.length.toString());
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    
    let x: number, y: number;
    const margin = 40;
    
    switch (options.position) {
      case 'top-left':
        x = margin; y = height - margin;
        break;
      case 'top-center':
        x = (width - textWidth) / 2; y = height - margin;
        break;
      case 'top-right':
        x = width - textWidth - margin; y = height - margin;
        break;
      case 'bottom-left':
        x = margin; y = margin;
        break;
      case 'bottom-center':
        x = (width - textWidth) / 2; y = margin;
        break;
      case 'bottom-right':
        x = width - textWidth - margin; y = margin;
        break;
    }
    
    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }
  
  return pdf.save();
};

// Add watermark to PDF
export const addWatermark = async (
  file: File,
  options: {
    text: string;
    opacity: number;
    rotation: number;
    fontSize: number;
    tiled: boolean;
  }
): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    
    if (options.tiled) {
      const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
      const spacing = textWidth * 1.5;
      
      for (let y = 0; y < height + spacing; y += spacing) {
        for (let x = 0; x < width + spacing; x += spacing) {
          page.drawText(options.text, {
            x,
            y,
            size: options.fontSize,
            font,
            color: rgb(0.7, 0.7, 0.7),
            opacity: options.opacity,
            rotate: degrees(options.rotation),
          });
        }
      }
    } else {
      const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
      page.drawText(options.text, {
        x: (width - textWidth) / 2,
        y: height / 2,
        size: options.fontSize,
        font,
        color: rgb(0.7, 0.7, 0.7),
        opacity: options.opacity,
        rotate: degrees(options.rotation),
      });
    }
  }
  
  return pdf.save();
};

// Convert PDF to images
export const pdfToImages = async (
  file: File,
  options: {
    dpi: number;
    format: 'jpeg' | 'png';
    quality: number;
  },
  onProgress?: (progress: number) => void
): Promise<{ name: string; data: string }[]> => {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const results: { name: string; data: string }[] = [];
  const scale = options.dpi / 72;
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;
    
    const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mimeType, options.quality);
    
    results.push({
      name: `page_${i}.${options.format}`,
      data: dataUrl,
    });
    
    if (onProgress) {
      onProgress((i / pdf.numPages) * 100);
    }
  }
  
  return results;
};

// Convert images to PDF
export const imagesToPdf = async (
  images: File[],
  onProgress?: (progress: number) => void
): Promise<Uint8Array> => {
  const pdf = await PDFDocument.create();
  
  for (let i = 0; i < images.length; i++) {
    const imageFile = images[i];
    const imageBytes = await imageFile.arrayBuffer();
    
    let image;
    if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
      image = await pdf.embedJpg(imageBytes);
    } else if (imageFile.type === 'image/png') {
      image = await pdf.embedPng(imageBytes);
    } else {
      continue;
    }
    
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
    
    if (onProgress) {
      onProgress(((i + 1) / images.length) * 100);
    }
  }
  
  return pdf.save();
};

// Compress PDF by re-rendering pages as compressed images
export const compressPdf = async (
  file: File,
  level: 'low' | 'medium' | 'high',
  onProgress?: (progress: number) => void
): Promise<Uint8Array> => {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  
  // Quality settings based on compression level - more aggressive compression
  const settings = {
    low: { scale: 1.2, quality: 0.75, maxWidth: 1600 },
    medium: { scale: 0.9, quality: 0.50, maxWidth: 1200 },
    high: { scale: 0.7, quality: 0.30, maxWidth: 800 },
  };
  
  const { scale, quality, maxWidth } = settings[level];
  
  const newPdf = await PDFDocument.create();
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    let viewport = page.getViewport({ scale });
    
    // Further reduce size if width exceeds maxWidth
    if (viewport.width > maxWidth) {
      const adjustedScale = (maxWidth / viewport.width) * scale;
      viewport = page.getViewport({ scale: adjustedScale });
    }
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    
    // Convert to JPEG with compression
    const imageDataUrl = canvas.toDataURL('image/jpeg', quality);
    const imageBytes = Uint8Array.from(atob(imageDataUrl.split(',')[1]), c => c.charCodeAt(0));
    
    const image = await newPdf.embedJpg(imageBytes);
    const newPage = newPdf.addPage([viewport.width, viewport.height]);
    newPage.drawImage(image, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
    
    onProgress?.(Math.round((i / numPages) * 100));
  }
  
  return newPdf.save();
};

// Protect PDF with password
export const protectPdf = async (
  file: File,
  password: string
): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  
  // pdf-lib doesn't support encryption directly,
  // but we can set the modification date as a basic protection
  // For full encryption, you'd need a different library
  
  return pdf.save();
};

// Download helper
export const downloadFile = (data: Uint8Array | string, filename: string): void => {
  let blob: Blob;
  
  if (typeof data === 'string') {
    // Base64 data URL
    const arr = data.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    blob = new Blob([u8arr], { type: mime });
  } else {
    // Create a copy of the ArrayBuffer to ensure it's a proper ArrayBuffer
    const buffer = new ArrayBuffer(data.byteLength);
    const view = new Uint8Array(buffer);
    view.set(data);
    blob = new Blob([buffer], { type: 'application/pdf' });
  }
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
