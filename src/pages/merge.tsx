import React, { useState, useCallback } from 'react';
import { Layers, Download, Eye } from 'lucide-react';
import ToolLayout from '@/components/shared/ToolLayout';
import FileDropzone from '@/components/shared/FileDropzone';
import ProgressBar from '@/components/shared/ProgressBar';
import PdfViewer from '@/components/shared/PdfViewer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PDFFile, generateId, getPdfPageCount, generateThumbnail, mergePdfs, downloadFile } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

const MergePdf: React.FC = () => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFileSize, setLoadingFileSize] = useState<number | undefined>();
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState<Uint8Array | null>(null);

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    const totalSize = newFiles.reduce((acc, f) => acc + f.size, 0);
    setIsLoading(true);
    setLoadingFileSize(totalSize);
    setPreviewData(null);
    const pdfFiles: PDFFile[] = [];
    
    for (const file of newFiles) {
      try {
        const pageCount = await getPdfPageCount(file);
        const thumbnail = await generateThumbnail(file);
        
        pdfFiles.push({
          id: generateId(),
          file,
          name: file.name,
          pageCount,
          thumbnail,
        });
      } catch (error) {
        toast({
          title: 'Gagal memuat file',
          description: `Tidak dapat memuat ${file.name}. Pastikan file PDF valid.`,
          variant: 'destructive',
        });
      }
    }
    
    setFiles(prev => [...prev, ...pdfFiles]);
    setIsLoading(false);
    setLoadingFileSize(undefined);
  }, []);

  const handleFileRemove = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setPreviewData(null);
  }, []);

  const handleReorder = useCallback((reordered: PDFFile[]) => {
    setFiles(reordered);
    setPreviewData(null);
  }, []);

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({
        title: 'File tidak cukup',
        description: 'Tambahkan minimal 2 file PDF untuk digabung.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await mergePdfs(
        files.map(f => f.file),
        (p) => setProgress(p)
      );
      
      setPreviewData(result);
      
      toast({
        title: 'Berhasil!',
        description: 'PDF telah digabung. Klik "Unduh" untuk menyimpan.',
      });
    } catch (error) {
      toast({
        title: 'Gagal menggabung PDF',
        description: 'Terjadi kesalahan saat menggabung file. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!previewData) return;
    downloadFile(previewData, 'gabungan.pdf');
    toast({
      title: 'Berhasil!',
      description: 'File gabungan telah diunduh.',
    });
  };

  const totalPages = files.reduce((acc, f) => acc + f.pageCount, 0);

  return (
    <ToolLayout
      title="Gabung PDF"
      description="Gabungkan beberapa file PDF menjadi satu dokumen. Cukup seret dan lepas file Anda, lalu kami akan menggabungkannya sesuai urutan."
      icon={Layers}
    >
      <div className="space-y-6">
        <FileDropzone
          files={files}
          onFilesAdded={handleFilesAdded}
          onFileRemove={handleFileRemove}
          onReorder={handleReorder}
          title="Seret file PDF ke sini"
          subtitle="atau klik untuk memilih file"
          isLoading={isLoading}
          loadingFileSize={loadingFileSize}
        />

        {files.length >= 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* Info Panel - Compact */}
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-3">
              <Label className="text-sm">Ringkasan</Label>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded-lg bg-card border border-border text-sm">
                  <span className="text-muted-foreground">File</span>
                  <span className="font-semibold text-foreground">{files.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-card border border-border text-sm">
                  <span className="text-muted-foreground">Halaman</span>
                  <span className="font-semibold text-foreground">{totalPages}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Seret untuk mengatur urutan file.
              </p>
            </div>

            {/* Preview Panel - Larger */}
            <div className="p-6 rounded-2xl bg-secondary/50 border border-border space-y-4">
              <Label className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview Hasil
              </Label>
              
              <PdfViewer 
                pdfData={previewData}
                placeholder="Preview muncul setelah penggabungan"
                height="500px"
              />
              
              <p className="text-xs text-center text-muted-foreground">
                Gunakan scroll untuk melihat semua halaman
              </p>
            </div>
          </div>
        )}

        {isProcessing && (
          <ProgressBar progress={progress} />
        )}

        {files.length >= 2 && !isProcessing && (
          <div className="flex gap-3">
            {!previewData ? (
              <Button
                onClick={handleMerge}
                className="flex-1 btn-primary h-14 text-lg"
                disabled={isProcessing}
              >
                <Eye className="w-5 h-5 mr-2" />
                Gabung & Preview
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleMerge}
                  variant="outline"
                  className="flex-1 h-14 text-lg"
                  disabled={isProcessing}
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Gabung Ulang
                </Button>
                <Button
                  onClick={handleDownload}
                  className="flex-1 btn-primary h-14 text-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Unduh PDF
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default MergePdf;
