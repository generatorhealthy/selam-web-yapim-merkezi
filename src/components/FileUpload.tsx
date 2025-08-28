
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
  accept?: string;
  maxSize?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onUpload, 
  currentImage, 
  accept = 'image/*', 
  maxSize = 5 * 1024 * 1024 // 5MB
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>(currentImage || '');
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Determine bucket based on file type
      const isPdf = file.type === 'application/pdf' || fileExt?.toLowerCase() === 'pdf';
      const bucketName = isPdf ? 'legal-documents' : 'profile-pictures';

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // For legal documents, create a signed URL; for profile pictures, use public URL
      let fileUrl: string;
      if (isPdf) {
        const { data: signedData, error: signedError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (signedError) throw signedError;
        fileUrl = signedData.signedUrl;
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        fileUrl = publicUrl;
      }

      setUploadedUrl(fileUrl);
      onUpload(fileUrl);
      
      toast({
        title: "Başarılı",
        description: isPdf ? "PDF başarıyla yüklendi." : "Fotoğraf başarıyla yüklendi.",
      });
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      toast({
        title: "Hata",
        description: "Dosya yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [onUpload, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    maxSize,
    multiple: false
  });

  const removeImage = () => {
    setUploadedUrl('');
    onUpload('');
  };

  const isPdf = accept.includes('pdf') || accept === '.pdf';
  const maxSizeMB = Math.round(maxSize / (1024 * 1024));
  
  return (
    <div className="space-y-4">
      {uploadedUrl ? (
        <div className="relative">
          {isPdf ? (
            <div className="flex items-center gap-2 p-4 border rounded-lg bg-gray-50">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">PDF Dosyası Yüklendi</p>
                <p className="text-xs text-gray-500">Başarıyla yüklendi</p>
              </div>
            </div>
          ) : (
            <img
              src={uploadedUrl}
              alt="Yüklenen fotoğraf"
              className="w-32 h-32 object-cover rounded-lg border"
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={removeImage}
          >
            <X className="h-3 w-3" />
          </Button>
          <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          {isPdf ? (
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          ) : (
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          )}
          {uploading ? (
            <p className="text-gray-600">Yükleniyor...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                {isDragActive
                  ? 'Dosyayı buraya bırakın'
                  : 'Dosyayı sürükleyin veya tıklayın'}
              </p>
              <p className="text-sm text-gray-500">
                {isPdf 
                  ? `PDF formatı desteklenir (Maks. ${maxSizeMB}MB)`
                  : `PNG, JPG, JPEG formatları desteklenir (Maks. ${maxSizeMB}MB)`
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
