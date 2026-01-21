import React, { useState, useCallback } from 'react';
import { Image, Download, Loader2, Eye } from 'lucide-react';
import ToolLayout from '@/components/shared/ToolLayout';
import FileDropzone from '@/components/shared/FileDropzone';
import ProgressBar from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PDFFile, generateId, getPdfPageCount, generateThumbnail, pdfToImages } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

interface ImageResult {
  name: string;
  data: string; // dataURL from canvas
  preview: string;
}

const PdfToJpg: React.FC = () => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFileSize, setLoadingFileSize] = useState<number | undefined>();
  const [progress, setProgress] = useState(0);
  const [dpi, setDpi] = useState([150]);
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [quality, setQuality] = useState([0.9]);
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [selectedPreview, setSelectedPreview] = useState(0);

  // Cleanup preview URLs on unmount
  React.useEffect(() => {
    return () => {
      // No need to revoke dataURLs as they're not blob URLs
    };
  }, []);

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    const file = newFiles[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingFileSize(file.size);
    setImageResults([]);
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
    setImageResults([]);
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const images = await pdfToImages(
        files[0].file,
        { dpi: dpi[0], format, quality: quality[0] },
        (p) => setProgress(p)
      );
      
      // Images already have dataURL, use them directly for preview
      const results: ImageResult[] = images.map(img => ({
        ...img,
        preview: img.data, // dataURL can be used directly as src
      }));
      
      setImageResults(results);
      setSelectedPreview(0);
      
      toast({
        title: 'Berhasil!',
        description: `Berhasil mengkonversi ${images.length} halaman. Klik "Unduh" untuk menyimpan.`,
      });
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal mengkonversi PDF. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownloadAll = () => {
    if (imageResults.length === 0) return;
    
    imageResults.forEach((result, index) => {
      // Convert dataURL to blob and download
      const link = document.createElement('a');
      link.href = result.data;
      link.download = result.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Small delay between downloads to prevent browser blocking
      if (index < imageResults.length - 1) {
        setTimeout(() => {}, 100);
      }
    });
    
    toast({
      title: 'Berhasil!',
      description: `${imageResults.length} gambar telah diunduh.`,
    });
  };

  const handleDownloadSingle = (index: number) => {
    const result = imageResults[index];
    if (!result) return;
    
    const link = document.createElement('a');
    link.href = result.data;
    link.download = result.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ToolLayout
      title="PDF ke JPG"
      description="Konversi setiap halaman PDF Anda menjadi gambar berkualitas tinggi. Pilih resolusi dan format."
      icon={Image}
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
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Resolusi (DPI)</Label>
                    <span className="text-sm text-muted-foreground">{dpi[0]} DPI</span>
                  </div>
                  <Slider
                    value={dpi}
                    onValueChange={(v) => {
                      setDpi(v);
                      setImageResults([]);
                    }}
                    min={72}
                    max={300}
                    step={36}
                  />
                  <p className="text-xs text-muted-foreground">
                    DPI lebih tinggi = kualitas lebih baik, ukuran file lebih besar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select 
                    value={format} 
                    onValueChange={(v) => {
                      setFormat(v as 'jpeg' | 'png');
                      setImageResults([]);
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jpeg">JPEG (ukuran lebih kecil)</SelectItem>
                      <SelectItem value="png">PNG (tanpa kompresi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {format === 'jpeg' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Kualitas</Label>
                    <span className="text-sm text-muted-foreground">{Math.round(quality[0] * 100)}%</span>
                  </div>
                  <Slider
                    value={quality}
                    onValueChange={(v) => {
                      setQuality(v);
                      setImageResults([]);
                    }}
                    min={0.5}
                    max={1}
                    step={0.1}
                  />
                </div>
              )}

              {imageResults.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <Label className="text-sm font-medium">Gambar Hasil ({imageResults.length})</Label>
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                    {imageResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPreview(index)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedPreview === index
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <img
                          src={result.preview}
                          alt={result.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                          {index + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <div className="p-6 rounded-2xl bg-secondary/50 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview Hasil
                </Label>
                {imageResults.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadSingle(selectedPreview)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Unduh
                  </Button>
                )}
              </div>
              
              <div className="relative aspect-[3/4] bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center border border-border">
                {imageResults.length > 0 ? (
                  <img
                    src={imageResults[selectedPreview]?.preview}
                    alt={imageResults[selectedPreview]?.name}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      console.error('Image load error:', e);
                      toast({
                        title: 'Error',
                        description: 'Gagal memuat preview gambar',
                        variant: 'destructive',
                      });
                    }}
                  />
                ) : (
                  <div className="text-center text-muted-foreground p-4">
                    <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Preview muncul setelah konversi</p>
                  </div>
                )}
              </div>
              
              {imageResults.length > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  {imageResults[selectedPreview]?.name}
                </p>
              )}
            </div>
          </div>
        )}

        {isProcessing && (
          <ProgressBar progress={progress} />
        )}

        {files.length > 0 && !isProcessing && (
          <div className="flex gap-3">
            {imageResults.length === 0 ? (
              <Button
                onClick={handleConvert}
                className="flex-1 btn-primary h-14 text-lg"
                disabled={isProcessing}
              >
                <Eye className="w-5 h-5 mr-2" />
                Konversi & Preview
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleConvert}
                  variant="outline"
                  className="flex-1 h-14 text-lg"
                  disabled={isProcessing}
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Konversi Ulang
                </Button>
                <Button
                  onClick={handleDownloadAll}
                  className="flex-1 btn-primary h-14 text-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Unduh Semua ({imageResults.length})
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default PdfToJpg;