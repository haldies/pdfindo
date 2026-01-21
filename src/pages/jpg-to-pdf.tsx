import { useState } from 'react';
import { useRouter } from 'next/router';
import ToolLayout from '@/components/shared/ToolLayout';
import FileDropzone from '@/components/shared/FileDropzone';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';
import { PDFFile } from '@/lib/pdf-utils';

export default function JpgToPdfPage() {
  const router = useRouter();
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesAdded = (newFiles: File[]) => {
    // TODO: Convert files to PDFFile format
    console.log('Files added:', newFiles);
  };

  const handleFileRemove = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    // TODO: Implement JPG to PDF conversion
    setTimeout(() => {
      setIsProcessing(false);
      alert('Fitur konversi JPG ke PDF akan segera hadir!');
    }, 1000);
  };

  return (
    <ToolLayout
      title="JPG ke PDF"
      description="Konversi gambar JPG menjadi dokumen PDF"
      icon={ImagePlus}
    >
      <div className="space-y-6">
        <FileDropzone
          files={files}
          onFilesAdded={handleFilesAdded}
          onFileRemove={handleFileRemove}
          accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
          maxFiles={10}
          title="Seret gambar ke sini"
          subtitle="atau klik untuk memilih gambar"
        />

        {files.length > 0 && (
          <div className="flex justify-center">
            <Button
              onClick={handleProcess}
              disabled={isProcessing}
              size="lg"
            >
              {isProcessing ? 'Memproses...' : 'Konversi ke PDF'}
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
