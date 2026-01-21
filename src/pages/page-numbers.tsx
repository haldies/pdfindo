import React, { useState, useCallback, useEffect } from 'react';
import { Hash, Download, Loader2, Eye } from 'lucide-react';
import ToolLayout from '@/components/shared/ToolLayout';
import FileDropzone from '@/components/shared/FileDropzone';
import ProgressBar from '@/components/shared/ProgressBar';
import PdfViewer from '@/components/shared/PdfViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PDFFile, generateId, getPdfPageCount, generateThumbnail, addPageNumbers, downloadFile } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

const PageNumbers: React.FC = () => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFileSize, setLoadingFileSize] = useState<number | undefined>();
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [fontSize, setFontSize] = useState('12');
  const [startPage, setStartPage] = useState('1');
  const [format, setFormat] = useState('{n}');
  const [previewData, setPreviewData] = useState<Uint8Array | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    const file = newFiles[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingFileSize(file.size);
    setPreviewData(null);
    try {
      const pageCount = await getPdfPageCount(file);
      const thumbnail = await generateThumbnail(file);
      
      setFiles([{
        id: generateId(),
        file,
        name: file.name,
        pageCount,
        thumbnail,
      }]);
    } catch (error) {
      toast({
        title: 'Gagal memuat file',
        description: `Tidak dapat memuat ${file.name}. Pastikan file PDF valid.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingFileSize(undefined);
    }
  }, []);

  const handleFileRemove = useCallback(() => {
    setFiles([]);
    setPreviewData(null);
  }, []);

  // Generate preview
  const generatePreview = useCallback(async () => {
    if (files.length === 0) return;
    
    setIsGeneratingPreview(true);
    try {
      const result = await addPageNumbers(files[0].file, {
        position,
        fontSize: parseInt(fontSize) || 12,
        startPage: parseInt(startPage) || 1,
        format,
      });
      setPreviewData(result);
    } catch (error) {
      console.error('Preview generation failed:', error);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [files, position, fontSize, startPage, format]);

  // Debounced preview generation
  useEffect(() => {
    if (files.length === 0) {
      setPreviewData(null);
      return;
    }
    
    const timer = setTimeout(() => {
      generatePreview();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [files, position, fontSize, startPage, format, generatePreview]);

  const handleDownload = () => {
    if (!previewData) return;
    downloadFile(previewData, `bernomor_${files[0].name}`);
    toast({
      title: 'Berhasil!',
      description: 'File dengan nomor halaman telah diunduh.',
    });
  };

  const handleAddPageNumbers = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(50);

    try {
      const result = await addPageNumbers(files[0].file, {
        position,
        fontSize: parseInt(fontSize) || 12,
        startPage: parseInt(startPage) || 1,
        format,
      });
      
      setProgress(100);
      setPreviewData(result);
      
      toast({
        title: 'Berhasil!',
        description: 'Preview nomor halaman siap. Klik "Unduh" untuk menyimpan.',
      });
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Gagal menambahkan nomor halaman. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <ToolLayout
      title="Tambah Nomor Halaman"
      description="Sisipkan nomor halaman ke PDF Anda dengan opsi posisi dan format kustom."
      icon={Hash}
    >
      <div className="space-y-6">
        <FileDropzone
          files={files}
          onFilesAdded={handleFilesAdded}
          onFileRemove={() => handleFileRemove()}
          multiple={false}
          maxFiles={1}
          title="Seret file PDF ke sini"
          subtitle="atau klik untuk memilih file"
          isLoading={isLoading}
          loadingFileSize={loadingFileSize}
        />

        {files.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settings Panel */}
            <div className="p-6 rounded-2xl bg-secondary/50 border border-border space-y-6">
              <div className="space-y-2">
                <Label>Posisi</Label>
                <Select value={position} onValueChange={(v) => setPosition(v as Position)}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Atas Kiri</SelectItem>
                    <SelectItem value="top-center">Atas Tengah</SelectItem>
                    <SelectItem value="top-right">Atas Kanan</SelectItem>
                    <SelectItem value="bottom-left">Bawah Kiri</SelectItem>
                    <SelectItem value="bottom-center">Bawah Tengah</SelectItem>
                    <SelectItem value="bottom-right">Bawah Kanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontSize">Ukuran Font</Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="rounded-xl h-12"
                  min={8}
                  max={72}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startPage">Mulai dari halaman</Label>
                <Input
                  id="startPage"
                  type="number"
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  className="rounded-xl h-12"
                  min={1}
                  max={files[0]?.pageCount || 1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="{n}">{`{n}`} (contoh: 1, 2, 3)</SelectItem>
                    <SelectItem value="Halaman {n}">Halaman {`{n}`} (contoh: Halaman 1)</SelectItem>
                    <SelectItem value="{n} dari {total}">{`{n} dari {total}`} (contoh: 1 dari 10)</SelectItem>
                    <SelectItem value="- {n} -">- {`{n}`} - (contoh: - 1 -)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="p-6 rounded-2xl bg-secondary/50 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </Label>
                {isGeneratingPreview && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Memuat...
                  </span>
                )}
              </div>
              
              <PdfViewer 
                pdfData={previewData}
                isLoading={isGeneratingPreview}
                placeholder="Preview akan muncul otomatis"
                height="450px"
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

        {files.length > 0 && !isProcessing && (
          <div className="flex gap-3">
            {!previewData ? (
              <Button
                onClick={handleAddPageNumbers}
                className="flex-1 btn-primary h-14 text-lg"
                disabled={isProcessing}
              >
                <Eye className="w-5 h-5 mr-2" />
                Buat Preview
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleAddPageNumbers}
                  variant="outline"
                  className="flex-1 h-14 text-lg"
                  disabled={isProcessing}
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Perbarui Preview
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

export default PageNumbers;
