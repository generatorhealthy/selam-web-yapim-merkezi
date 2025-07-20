
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AdminBackButton from "@/components/AdminBackButton";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Save, FileText, Eye } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const PreInfoFormManagement = () => {
  const [formContent, setFormContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { userProfile, loading } = useUserRole();

  useEffect(() => {
    loadFormContent();
  }, []);

  // ReactQuill ayarları
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'color', 'background', 'align', 'link'
  ];

  const loadFormContent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('form_contents')
        .select('content')
        .eq('form_type', 'pre_info')
        .single();

      if (error) {
        console.error('Error loading form content:', error);
        toast({
          title: "Hata",
          description: "Form içeriği yüklenirken bir hata oluştu",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setFormContent(data.content);
      }
    } catch (error) {
      console.error('Error loading form content:', error);
      toast({
        title: "Hata",
        description: "Form içeriği yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveFormContent = async () => {
    setIsSaving(true);
    try {
    const { error } = await supabase
      .from('form_contents')
      .upsert({
        form_type: 'pre_info',
        content: formContent,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'form_type',
        ignoreDuplicates: false
      });

      if (error) {
        console.error('Error saving form content:', error);
        toast({
          title: "Hata",
          description: "Form kaydedilirken bir hata oluştu",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Başarılı",
        description: "Ön bilgilendirme formu başarıyla güncellendi",
      });
    } catch (error) {
      console.error('Error saving form content:', error);
      toast({
        title: "Hata",
        description: "Form kaydedilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const previewForm = () => {
    // Yeni sekmede önizleme açar
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Ön Bilgilendirme Formu - Önizleme</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
                color: #333;
              }
              h1, h2, h3 {
                color: #2563eb;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
              }
              h1 {
                border-bottom: 2px solid #2563eb;
                padding-bottom: 10px;
              }
              .content {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
              }
              strong {
                font-weight: bold;
              }
              em {
                font-style: italic;
              }
              ul, ol {
                margin: 1em 0;
                padding-left: 2em;
              }
              a {
                color: #2563eb;
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            <h1>Ön Bilgilendirme Formu - Önizleme</h1>
            <div class="content">${formContent}</div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || !['admin', 'staff'].includes(userProfile.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Erişim Reddedildi</h2>
          <p className="text-gray-600 text-lg">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <HorizontalNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <AdminBackButton />
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
            Ön Bilgilendirme Formu Yönetimi
          </h1>
          <p className="text-gray-600 text-lg">
            Müşterilere gösterilen ön bilgilendirme formunun içeriğini buradan düzenleyebilirsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Form İçeriği Düzenleme
              </CardTitle>
              <CardDescription>
                Aşağıdaki alandan ön bilgilendirme formunun içeriğini düzenleyebilirsiniz. 
                Değişiklikler tüm yeni sözleşmelerde geçerli olacaktır.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <ReactQuill
                  value={formContent}
                  onChange={setFormContent}
                  modules={modules}
                  formats={formats}
                  placeholder="Ön bilgilendirme formu içeriğini buraya yazın..."
                  className="min-h-[500px]"
                  readOnly={isLoading}
                  theme="snow"
                />
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={saveFormContent}
                  disabled={isSaving || isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
                
                <Button 
                  onClick={previewForm}
                  variant="outline"
                  disabled={isLoading}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Önizleme
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-blue-50/50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Kullanım Notları</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>• Form içeriğinde dinamik değişkenler kullanılabilir (örn: müşteri adı, paket bilgileri)</li>
                <li>• Değişiklikler kaydedildikten sonra yeni sözleşmelerde geçerli olur</li>
                <li>• Önizleme özelliği ile değişiklikleri kaydetmeden önce görüntüleyebilirsiniz</li>
                <li>• Form içeriği HTML formatında düzenlenebilir</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PreInfoFormManagement;
