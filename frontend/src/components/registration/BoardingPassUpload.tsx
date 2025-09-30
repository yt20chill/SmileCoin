'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Upload, FileImage, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isValidImageFile } from '@/lib/utils/validation';

interface BoardingPassUploadProps {
  onUpload: (file: File) => void;
  error?: string | null;
}

export function BoardingPassUpload({ onUpload, error }: BoardingPassUploadProps) {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    setValidationError(null);
    
    // Validate file
    if (!isValidImageFile(file)) {
      if (file.size > 5 * 1024 * 1024) {
        setValidationError(tErrors('fileTooLarge'));
      } else {
        setValidationError(tErrors('invalidFile'));
      }
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [tErrors]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <motion.div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            "cursor-pointer"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleBrowseFiles}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className={cn(
              "mx-auto w-12 h-12 rounded-full flex items-center justify-center",
              isDragOver ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <Upload className="h-6 w-6" />
            </div>
            
            <div>
              <p className="text-sm font-medium">
                {isDragOver ? 'Drop your boarding pass here' : t('uploadBoardingPass')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WEBP up to 5MB
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* File Preview */}
          <div className="relative border rounded-lg p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              {preview && (
                <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                  <img
                    src={preview}
                    alt="Boarding pass preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Check className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Valid file
                  </span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            className="w-full"
            size="lg"
          >
            <FileImage className="h-4 w-4 mr-2" />
            Process Boarding Pass
          </Button>
        </motion.div>
      )}

      {/* Error Display */}
      {(validationError || error) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-md bg-destructive/10 border border-destructive/20"
        >
          <p className="text-sm text-destructive">
            {validationError || error}
          </p>
        </motion.div>
      )}
    </div>
  );
}