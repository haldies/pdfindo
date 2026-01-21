import React, { useState, useCallback, useMemo } from 'react';
import { Minimize2, Download, ArrowRight, Check, Eye } from 'lucide-react';
import ToolLayout from '@/components/shared/ToolLayout';
import FileDropzone from '@/components/shared/FileDropzone';
import ProgressBar from '@/components/shared/ProgressBar';
import PdfViewer from '@/components/shared/PdfViewer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PDFFile, generateId, getPdfPageCount, generateThumbnail, downloadFile, compressPdf } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  reduction: number;
  data: Uint8Array;
}

const CompressPdf: React.FC = () => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFileSize, setLoadingFileSize] = useState<number | undefined>();
  const [progress, setProgress] = useState(0);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // Estimated compression based on level - more realistic for image-based compression
  const estimatedSize = useMemo(() => {
    if (files.length === 0) return null;
    const originalSize = files[0].file.size;
    const reductionRates = { low: 0.25, medium: 0.50, high: 0.70 };
    const estimated = originalSize * (1 - reductionRates[compressionLevel]);
    return {
      size: estimated,
      reduction: Math.round(reductionRates[compressionLevel] * 100),
    };
  }, [files, compressionLevel]);

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    const file = newFiles[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingFileSize(file.size);
    setCompressionResult(null);
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
    setCompressionResult(null);
  }, []);

  const handleCompress = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      const originalSize = files[0].file.size;
      
      setProgress(20);

      // Use client-side compression with image re-rendering
      const compressedData = await compressPdf(
        files[0].file,
        compressionLevel,
        (p) => setProgress(20 + (p * 0.7)) // 20% to 90%
      );

      const compressedSize = compressedData.length;
      const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);

      setCompressionResult({
        originalSize,
        compressedSize,
        reduction: reduction > 0 ? reduction : 0,
        data: compressedData,
      });

      setProgress(100);
      
      toast({
        title: 'Berhasil!',
        description: `File berhasil dikompres ${reduction > 0 ? reduction : 0}%. Klik "Unduh" untuk menyimpan.`,
      });
    } catch (error) {
      console.error('Compression error:', error);
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Gagal mengkompres PDF. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!compressionResult?.data) return;
    downloadFile(compressionResult.data, `terkompres_${files[0].name}`);
    toast({
      title: 'Berhasil!',
      description: 'File terkompres telah diunduh.',
    });
  };

  return (
    <ToolLayout
      title="Kompres PDF"
      description="Perkecil ukuran file PDF dengan mengkonversi halaman menjadi gambar JPEG berkualitas. Cocok untuk PDF yang berisi banyak gambar."
      icon={Minimize2}
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
            <div className="p-6 rounded-2xl bg-secondary/50 border border-border space-y-4">
              <Label className="text-base">Tingkat Kompresi</Label>
              <RadioGroup
                value={compressionLevel}
                onValueChange={(v) => {
                  setCompressionLevel(v as 'low' | 'medium' | 'high');
                  setCompressionResult(null);
                }}
                className="space-y-3"
              >
                {[
                  { value: 'low', label: 'Rendah', desc: 'Kualitas terbaik', reduction: '~25%' },
                  { value: 'medium', label: 'Sedang', desc: 'Seimbang', reduction: '~50%' },
                  { value: 'high', label: 'Tinggi', desc: 'Ukuran terkecil', reduction: '~70%' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      compressionLevel === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={option.value} />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.desc}</p>
                    </div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {option.reduction}
                    </span>
                  </label>
                ))}
              </RadioGroup>
              
              {/* Size Comparison */}
              <div className="p-4 rounded-xl bg-card border border-border">
                {compressionResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4" />
                      Kompresi Berhasil!
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Sebelum</p>
                        <p className="text-lg font-semibold text-foreground">
                          {formatSize(compressionResult.originalSize)}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-primary shrink-0" />
                      <div className="flex-1 text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-xs text-muted-foreground mb-1">Sesudah</p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {formatSize(compressionResult.compressedSize)}
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                        Berkurang {compressionResult.reduction}%
                      </span>
                    </div>
                  </div>
                ) : estimatedSize ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">Perkiraan Hasil</p>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Sebelum</p>
                        <p className="text-lg font-semibold text-foreground">
                          {formatSize(files[0].file.size)}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 text-center p-3 rounded-lg bg-muted/50 border border-dashed border-primary/30">
                        <p className="text-xs text-muted-foreground mb-1">Perkiraan</p>
                        <p className="text-lg font-semibold text-primary">
                          ~{formatSize(estimatedSize.size)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      *Hasil aktual dapat bervariasi
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Preview Panel */}
            <div className="p-6 rounded-2xl bg-secondary/50 border border-border space-y-4">
              <Label className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview Hasil
              </Label>
              
              <PdfViewer 
                pdfData={compressionResult?.data || null}
                placeholder="Preview muncul setelah kompresi"
                height="400px"
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
            {!compressionResult ? (
              <Button
                onClick={handleCompress}
                className="flex-1 btn-primary h-14 text-lg"
                disabled={isProcessing}
              >
                <Eye className="w-5 h-5 mr-2" />
                Kompres & Preview
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleCompress}
                  variant="outline"
                  className="flex-1 h-14 text-lg"
                  disabled={isProcessing}
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Kompres Ulang
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

export default CompressPdf;
