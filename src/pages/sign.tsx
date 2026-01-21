import { useState } from 'react';
import { useRouter } from 'next/router';
import ToolLayout from '@/components/shared/ToolLayout';
import FileDropzone from '@/components/shared/FileDropzone';
import { Button } from '@/components/ui/button';
import { PenTool } from 'lucide-react';
import { PDFFile } from '@/lib/pdf-utils';

export default function SignPage() {
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
    // TODO: Implement signature functionality
    setTimeout(() => {
      setIsProcessing(false);
      alert('Fitur tanda tangan akan segera hadir!');
    }, 1000);
  };

  return (
    <ToolLayout
      title="Tanda Tangan PDF"
      description="Tambahkan tanda tangan digital ke dokumen PDF Anda"
      icon={PenTool}
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
              {isProcessing ? 'Memproses...' : 'Tambah Tanda Tangan'}
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
