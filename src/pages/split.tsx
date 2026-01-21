import React, { useState, useCallback } from 'react';
import { Scissors, Download, Eye, FileText } from 'lucide-react';
import ToolLayout from '@/components/shared/ToolLayout';
import FileDropzone from '@/components/shared/FileDropzone';
import ProgressBar from '@/components/shared/ProgressBar';
import PdfViewer from '@/components/shared/PdfViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PDFFile, generateId, getPdfPageCount, generateThumbnail, splitPdf, downloadFile } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

interface SplitResult {
  name: string;
  data: Uint8Array;
  pageCount: number;
}

const SplitPdf: React.FC = () => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFileSize, setLoadingFileSize] = useState<number | undefined>();
  const [progress, setProgress] = useState(0);
  const [pageRange, setPageRange] = useState('');
  const [splitResults, setSplitResults] = useState<SplitResult[]>([]);
  const [selectedPreview, setSelectedPreview] = useState(0);

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    const file = newFiles[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingFileSize(file.size);
    setSplitResults([]);
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
      
      setPageRange(`1-${pageCount}`);
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
    setPageRange('');
    setSplitResults([]);
  }, []);

  const handleSplit = async () => {
    if (files.length === 0) {
      toast({
        title: 'Tidak ada file',
        description: 'Tambahkan file PDF untuk dipisah.',
        variant: 'destructive',
      });
      return;
    }

    if (!pageRange.trim()) {
      toast({
        title: 'Rentang tidak valid',
        description: 'Masukkan rentang halaman yang valid.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const results = await splitPdf(
        files[0].file,
        pageRange,
        (p) => setProgress(p)
      );
      
      // Get page count for each result - dynamically import pdfjs
      const pdfjs = await import('pdfjs-dist');
      const resultsWithCount: SplitResult[] = [];
      for (const result of results) {
        const buffer = new ArrayBuffer(result.data.byteLength);
        new Uint8Array(buffer).set(result.data);
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        resultsWithCount.push({
          ...result,
          pageCount: pdf.numPages,
        });
      }
      
      setSplitResults(resultsWithCount);
      setSelectedPreview(0);
      
      toast({
        title: 'Berhasil!',
        description: `Berhasil membuat ${results.length} file PDF. Klik "Unduh" untuk menyimpan.`,
      });
    } catch (error) {
      toast({
        title: 'Gagal memisah PDF',
        description: 'Terjadi kesalahan saat memisah file. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownloadAll = () => {
    if (splitResults.length === 0) return;
    for (const result of splitResults) {
      downloadFile(result.data, result.name);
    }
    toast({
      title: 'Berhasil!',
      description: `${splitResults.length} file telah diunduh.`,
    });
  };

  const handleDownloadSingle = (index: number) => {
    const result = splitResults[index];
    if (!result) return;
    downloadFile(result.data, result.name);
  };

  return (
    <ToolLayout
      title="Pisah PDF"
      description="Ekstrak halaman dari PDF dengan menentukan rentang halaman. Buat beberapa dokumen dari satu PDF."
      icon={Scissors}
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
              <div className="space-y-2">
                <Label htmlFor="pageRange" className="text-sm font-medium">
                  Rentang Halaman
                </Label>
                <Input
                  id="pageRange"
                  value={pageRange}
                  onChange={(e) => {
                    setPageRange(e.target.value);
                    setSplitResults([]);
                  }}
                  placeholder="contoh: 1-3, 5, 7-9"
                  className="rounded-xl h-12"
                />
                <p className="text-xs text-muted-foreground">
                  Masukkan nomor halaman dipisahkan koma. Gunakan tanda hubung untuk rentang.
                  <br />
                  Contoh: <span className="font-medium">1-3, 5, 7-9</span> akan membuat 3 PDF terpisah.
                </p>
              </div>

              {splitResults.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <Label className="text-sm font-medium">File Hasil ({splitResults.length})</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {splitResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedPreview(index)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedPreview === index
                            ? 'bg-primary/10 border border-primary/30'
                            : 'bg-card border border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{result.name}</p>
                            <p className="text-xs text-muted-foreground">{result.pageCount} halaman</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadSingle(index);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <div className="p-6 rounded-2xl bg-secondary/50 border border-border space-y-4">
              <Label className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview Hasil
              </Label>
              
              <PdfViewer 
                pdfData={splitResults[selectedPreview]?.data || null}
                placeholder="Preview muncul setelah pemisahan"
                height="400px"
              />
              
              {splitResults.length > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Preview: {splitResults[selectedPreview]?.name}
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
            {splitResults.length === 0 ? (
              <Button
                onClick={handleSplit}
                className="flex-1 btn-primary h-14 text-lg"
                disabled={isProcessing}
              >
                <Eye className="w-5 h-5 mr-2" />
                Pisah & Preview
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSplit}
                  variant="outline"
                  className="flex-1 h-14 text-lg"
                  disabled={isProcessing}
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Pisah Ulang
                </Button>
                <Button
                  onClick={handleDownloadAll}
                  className="flex-1 btn-primary h-14 text-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Unduh Semua ({splitResults.length})
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default SplitPdf;
