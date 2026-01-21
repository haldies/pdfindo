/**
 * TOOL PAGE: Organize PDF
 * Reorder, rotate, or delete PDF pages
 */

import React, { useState, useCallback } from 'react';
import { FileStack, Download, Loader2, RotateCw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { degrees } from 'pdf-lib';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ToolLayout from '@/components/shared/ToolLayout';
import FileDropzone from '@/components/shared/FileDropzone';
import ProgressBar from '@/components/shared/ProgressBar';
import PageSkeleton from '@/components/shared/PageSkeleton';
import { Button } from '@/components/ui/button';
import { PDFFile, generateId, getPdfPageCount, generateThumbnail, downloadFile } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';
import { PDFDocument } from 'pdf-lib';

interface PageInfo {
  id: string;
  pageNumber: number;
  thumbnail: string;
  rotation: number;
}

interface SortablePageProps {
  page: PageInfo;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

const SortablePage: React.FC<SortablePageProps> = ({ page, onRotate, onDelete, canDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group cursor-grab active:cursor-grabbing ${isDragging ? 'scale-105' : ''}`}
    >
      <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-border bg-card hover:border-primary/50 transition-colors">
        <img
          src={page.thumbnail}
          alt={`Halaman ${page.pageNumber}`}
          className="w-full h-full object-cover transition-transform pointer-events-none"
          style={{ transform: `rotate(${page.rotation}deg)` }}
          draggable={false}
        />
      </div>
      
      {/* Page Number Badge */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-foreground/80 text-background text-xs font-medium">
        {page.pageNumber}
      </div>
      
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onRotate(page.id)}
          className="p-1.5 rounded-lg bg-background/90 hover:bg-background shadow-sm"
        >
          <RotateCw className="w-4 h-4 text-foreground" />
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(page.id)}
            className="p-1.5 rounded-lg bg-background/90 hover:bg-destructive hover:text-destructive-foreground shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const OrganizePdf: React.FC = () => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadPages = async (file: File) => {
    setIsLoadingPages(true);
    const pdfjs = await import('pdfjs-dist');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const pageInfos: PageInfo[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: context,
        viewport,
        canvas,
      }).promise;
      
      pageInfos.push({
        id: `page-${i}-${generateId()}`,
        pageNumber: i,
        thumbnail: canvas.toDataURL('image/jpeg', 0.7),
        rotation: 0,
      });
    }

    setPages(pageInfos);
    setIsLoadingPages(false);
  };

  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [loadingFileSize, setLoadingFileSize] = useState<number | undefined>();

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    const file = newFiles[0];
    if (!file) return;

    setIsLoadingFile(true);
    setLoadingFileSize(file.size);
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
      
      await loadPages(file);
    } catch (error) {
      toast({
        title: 'Gagal memuat file',
        description: `Tidak dapat memuat ${file.name}. Pastikan file PDF valid.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFile(false);
      setLoadingFileSize(undefined);
    }
  }, []);

  const handleFileRemove = useCallback(() => {
    setFiles([]);
    setPages([]);
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRotatePage = (id: string) => {
    setPages(prev => prev.map(p => 
      p.id === id 
        ? { ...p, rotation: (p.rotation + 90) % 360 }
        : p
    ));
  };

  const handleDeletePage = (id: string) => {
    if (pages.length <= 1) {
      toast({
        title: 'Tidak dapat menghapus',
        description: 'Minimal harus ada satu halaman.',
        variant: 'destructive',
      });
      return;
    }
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await files[0].file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      
      for (let i = 0; i < pages.length; i++) {
        const pageInfo = pages[i];
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageInfo.pageNumber - 1]);
        
        if (pageInfo.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRotation + pageInfo.rotation));
        }
        
        newPdf.addPage(copiedPage);
        setProgress(((i + 1) / pages.length) * 100);
      }
      
      const result = await newPdf.save();
      downloadFile(result, `teratur_${files[0].name}`);
      
      toast({
        title: 'Berhasil!',
        description: 'PDF Anda telah disimpan.',
      });
    } catch (error) {
      toast({
        title: 'Gagal menyimpan PDF',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <ToolLayout
      title="Atur Halaman PDF"
      description="Susun ulang, putar, atau hapus halaman dari PDF Anda. Seret halaman untuk mengatur ulang."
      icon={FileStack}
    >
      <div className="space-y-6">
        {files.length === 0 ? (
          <FileDropzone
            files={files}
            onFilesAdded={handleFilesAdded}
            onFileRemove={() => handleFileRemove()}
            multiple={false}
            maxFiles={1}
            title="Seret file PDF ke sini"
            subtitle="atau klik untuk memilih file"
            isLoading={isLoadingFile}
            loadingFileSize={loadingFileSize}
          />
        ) : (
          <>
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileStack className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{files[0].name}</p>
                  <p className="text-sm text-muted-foreground">{pages.length} halaman</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleFileRemove}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {isLoadingPages ? (
              <PageSkeleton count={files[0]?.pageCount || 8} variant="grid" />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {pages.map((page) => (
                      <SortablePage
                        key={page.id}
                        page={page}
                        onRotate={handleRotatePage}
                        onDelete={handleDeletePage}
                        canDelete={pages.length > 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {isProcessing && (
              <ProgressBar progress={progress} />
            )}

            {!isProcessing && pages.length > 0 && (
              <Button
                onClick={handleSave}
                className="w-full btn-primary h-14 text-lg"
                disabled={isProcessing}
              >
                <Download className="w-5 h-5 mr-2" />
                Simpan & Unduh
              </Button>
            )}
          </>
        )}
      </div>
    </ToolLayout>
  );
};

export default OrganizePdf;
