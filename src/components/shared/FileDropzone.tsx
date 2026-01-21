import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { PDFFile } from '@/lib/pdf-utils';

interface FileDropzoneProps {
  files: PDFFile[];
  onFilesAdded: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  onReorder?: (files: PDFFile[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxFiles?: number;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  loadingFileSize?: number;
}

// Fungsi untuk memperkirakan waktu loading berdasarkan ukuran file
const getEstimatedTime = (fileSize: number): string => {
  const sizeMB = fileSize / (1024 * 1024);
  if (sizeMB < 1) return '~2 detik';
  if (sizeMB < 5) return '~5 detik';
  if (sizeMB < 10) return '~10 detik';
  if (sizeMB < 25) return '~20 detik';
  if (sizeMB < 50) return '~30 detik';
  return '~1 menit';
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function SortableFileRow({
  file,
  onRemove,
}: {
  file: PDFFile;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: file.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border group select-none',
        'cursor-grab active:cursor-grabbing',
        isDragging && 'shadow-md'
      )}
    >
      {file.thumbnail ? (
        <img
          src={file.thumbnail}
          alt={file.name}
          className="w-10 h-10 rounded-lg object-cover pointer-events-none"
          draggable={false}
          loading="lazy"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center pointer-events-none">
          <FileText className="w-5 h-5 text-primary" />
        </div>
      )}

      <div className="flex-1 min-w-0 pointer-events-none">
        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{file.pageCount} halaman</p>
      </div>

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(file.id);
        }}
        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        aria-label={`Hapus ${file.name}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  files,
  onFilesAdded,
  onFileRemove,
  onReorder,
  accept = { 'application/pdf': ['.pdf'] },
  multiple = true,
  maxFiles = 50,
  title = 'Seret file PDF ke sini',
  subtitle = 'atau klik untuk memilih file',
  isLoading = false,
  loadingFileSize,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesAdded(acceptedFiles);
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxFiles,
    noClick: true,
    noKeyboard: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onReorder) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = files.findIndex((f) => f.id === active.id);
    const newIndex = files.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(files, oldIndex, newIndex));
  };

  return (
    <div {...getRootProps({ className: 'space-y-6' })}>
      <input {...getInputProps()} />

      {/* Dropzone (klik untuk pilih), tapi area drop mencakup seluruh blok */}
      <div
        onClick={!isLoading ? open : undefined}
        className={cn(
          'dropzone text-center relative overflow-hidden',
          !isLoading && 'cursor-pointer',
          isDragActive && 'dropzone-active',
          isLoading && 'pointer-events-none'
        )}
        role="button"
        tabIndex={0}
      >
        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
              <p className="text-sm font-medium text-foreground">Memproses file...</p>
              {loadingFileSize && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-muted-foreground">
                    Ukuran: {formatFileSize(loadingFileSize)}
                  </p>
                  <p className="text-xs text-primary font-medium mt-1">
                    Estimasi: {getEstimatedTime(loadingFileSize)}
                  </p>
                </div>
              )}
              {!loadingFileSize && (
                <p className="text-xs text-muted-foreground mt-1">Mohon tunggu sebentar</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={{ scale: isDragActive ? 1.05 : 1, opacity: isLoading ? 0.3 : 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Upload className={cn('w-8 h-8 text-primary transition-transform', isDragActive && 'scale-110')} />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-muted-foreground">{subtitle}</p>
        </motion.div>
      </div>

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-foreground">{files.length} file dipilih</h4>
            </div>

            {onReorder && files.length > 1 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={files.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {files.map((file) => (
                      <SortableFileRow key={file.id} file={file} onRemove={onFileRemove} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border group"
                  >
                    {file.thumbnail ? (
                      <img
                        src={file.thumbnail}
                        alt={file.name}
                        className="w-10 h-10 rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.pageCount} halaman</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileRemove(file.id);
                      }}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      aria-label={`Hapus ${file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileDropzone;

