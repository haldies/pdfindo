import React, { useMemo } from 'react';
import { Loader2, Eye } from 'lucide-react';

interface PdfViewerProps {
  pdfData: Uint8Array | null;
  isLoading?: boolean;
  placeholder?: string;
  placeholderIcon?: React.ReactNode;
  className?: string;
  height?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ 
  pdfData, 
  isLoading = false,
  placeholder = 'Preview akan muncul otomatis',
  placeholderIcon,
  className = '',
  height = '400px'
}) => {
  const pdfUrl = useMemo(() => {
    if (!pdfData) return null;
    const buffer = new ArrayBuffer(pdfData.byteLength);
    new Uint8Array(buffer).set(pdfData);
    const blob = new Blob([buffer], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }, [pdfData]);

  // Cleanup URL when component unmounts or pdfData changes
  React.useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (isLoading) {
    return (
      <div 
        className={`relative bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center border border-border ${className}`}
        style={{ height }}
      >
        <div className="text-center text-muted-foreground p-4">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p className="text-sm">Memuat preview...</p>
        </div>
      </div>
    );
  }

  if (!pdfData || !pdfUrl) {
    return (
      <div 
        className={`relative bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center border border-border ${className}`}
        style={{ height }}
      >
        <div className="text-center text-muted-foreground p-4">
          {placeholderIcon || <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />}
          <p className="text-sm">{placeholder}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative rounded-xl overflow-hidden border border-border ${className}`}
      style={{ height }}
    >
      <iframe
        src={pdfUrl}
        className="w-full h-full"
        title="PDF Preview"
      />
    </div>
  );
};

export default PdfViewer;
