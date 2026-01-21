import { useState } from 'react';
import { useRouter } from 'next/router';
import ToolLayout from '@/components/shared/ToolLayout';
import FileDropzone from '@/components/shared/FileDropzone';
import { Button } from '@/components/ui/button';
import { Droplets } from 'lucide-react';
import { PDFFile } from '@/lib/pdf-utils';

export default function WatermarkPage() {
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
    // TODO: Implement watermark functionality
    setTimeout(() => {
      setIsProcessing(false);
      alert('Fitur watermark akan segera hadir!');
    }, 1000);
  };

  return (
    <ToolLayout
      title="Watermark PDF"
      description="Tambahkan watermark teks atau gambar ke PDF Anda"
      icon={Droplets}
    >
      <div className="space-y-6">
        <FileDropzone
          files={files}
          onFilesAdded={handleFilesAdded}
          onFileRemove={handleFileRemove}
          accept={{ 'application/pdf': ['.pdf'] }}
          maxFiles={1}
        />

        {files.length > 0 && (
          <div className="flex justify-center">
            <Button
              onClick={handleProcess}
              disabled={isProcessing}
              size="lg"
            >
              {isProcessing ? 'Memproses...' : 'Tambah Watermark'}
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
