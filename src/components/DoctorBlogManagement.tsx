
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import FileUpload from "@/components/FileUpload";

const blogSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur"),
  content: z.string().min(1, "İçerik zorunludur"),
  seo_title: z.string().max(65, "Google başlık maksimum 65 karakter olmalıdır").optional(),
  seo_description: z.string().max(140, "Google açıklama maksimum 140 karakter olmalıdır").optional(),
  keywords: z.string().optional(),
  featured_image: z.string().optional(),
});

type BlogFormValues = z.infer<typeof blogSchema>;

interface DoctorBlogManagementProps {
  doctorId: string;
  doctorName: string;
}

const DoctorBlogManagement = ({ doctorId, doctorName }: DoctorBlogManagementProps) => {
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      content: "",
      seo_title: "",
      seo_description: "",
      keywords: "",
      featured_image: "",
    },
  });

  const editForm = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      content: "",
      seo_title: "",
      seo_description: "",
      keywords: "",
      featured_image: "",
    },
  });

  useEffect(() => {
    fetchMyBlogs();
  }, [doctorId]);

  const fetchMyBlogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('author_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Blog yazıları çekilirken hata:', error);
        toast({
          title: "Hata",
          description: "Blog yazıları yüklenirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      setBlogs(data || []);
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const onSubmit = async (values: BlogFormValues) => {
    setIsProcessing(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        toast({
          title: "Hata",
          description: "Oturum açmanız gerekiyor.",
          variant: "destructive"
        });
        return;
      }

      const slug = generateSlug(values.title);
      const wordCount = values.content.split(/\s+/).length;
      
      // Anahtar kelimeleri virgülle ayır ve maksimum 3 tane al
      const keywordsArray = values.keywords ? values.keywords.split(',').map(k => k.trim()).slice(0, 3) : [];
      const keywordsString = keywordsArray.join(', ');

      const { error } = await supabase
        .from('blog_posts')
        .insert({
          title: values.title,
          content: values.content,
          slug: slug,
          author_id: user.data.user.id,
          author_name: doctorName,
          author_type: "specialist",
          status: "pending",
          word_count: wordCount,
          seo_title: values.seo_title || null,
          seo_description: values.seo_description || null,
          keywords: keywordsString || null,
          featured_image: values.featured_image || null,
        });

      if (error) {
        console.error('Blog oluşturma hatası:', error);
        toast({
          title: "Hata",
          description: "Blog oluşturulurken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Blog Gönderildi",
        description: "Blog yazınız onay için gönderildi.",
      });

      form.reset();
      setIsCreateDialogOpen(false);
      fetchMyBlogs();
    } catch (error) {
      console.error('Blog oluşturma hatası:', error);
      toast({
        title: "Hata",
        description: "Blog oluşturulurken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onEditSubmit = async (values: BlogFormValues) => {
    if (!editingBlog) return;
    
    setIsProcessing(true);
    try {
      const slug = generateSlug(values.title);
      const wordCount = values.content.split(/\s+/).length;
      
      // Anahtar kelimeleri virgülle ayır ve maksimum 3 tane al
      const keywordsArray = values.keywords ? values.keywords.split(',').map(k => k.trim()).slice(0, 3) : [];
      const keywordsString = keywordsArray.join(', ');

      const { error } = await supabase
        .from('blog_posts')
        .update({
          title: values.title,
          content: values.content,
          slug: slug,
          status: "pending", // Düzeltme sonrası tekrar onay bekleyen duruma geçir
          word_count: wordCount,
          seo_title: values.seo_title || null,
          seo_description: values.seo_description || null,
          keywords: keywordsString || null,
          featured_image: values.featured_image || null,
          admin_message: null, // Admin mesajını temizle
        })
        .eq('id', editingBlog.id);

      if (error) {
        console.error('Blog güncelleme hatası:', error);
        toast({
          title: "Hata",
          description: "Blog güncellenirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Blog Güncellendi",
        description: "Blog yazınız düzeltildi ve tekrar onaya gönderildi.",
      });

      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingBlog(null);
      fetchMyBlogs();
    } catch (error) {
      console.error('Blog güncelleme hatası:', error);
      toast({
        title: "Hata",
        description: "Blog güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (blog: any) => {
    setEditingBlog(blog);
    editForm.setValue('title', blog.title);
    editForm.setValue('content', blog.content);
    editForm.setValue('seo_title', blog.seo_title || '');
    editForm.setValue('seo_description', blog.seo_description || '');
    editForm.setValue('keywords', blog.keywords || '');
    editForm.setValue('featured_image', blog.featured_image || '');
    setIsEditDialogOpen(true);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "published": return "Yayınlandı";
      case "pending": return "Onay Bekliyor";
      case "revision_needed": return "Düzeltme Gerekli";
      case "draft": return "Taslak";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "revision_needed": return "bg-red-100 text-red-800";
      case "draft": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = async (blogId: string) => {
    if (!confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', blogId);

      if (error) {
        console.error('Blog silme hatası:', error);
        toast({
          title: "Hata",
          description: "Blog silinirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Blog Silindi",
        description: "Blog yazısı silindi.",
      });

      fetchMyBlogs();
    } catch (error) {
      console.error('Blog silme hatası:', error);
      toast({
        title: "Hata",
        description: "Blog silinirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (url: string) => {
    form.setValue('featured_image', url);
  };

  const handleEditImageUpload = (url: string) => {
    editForm.setValue('featured_image', url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Blog yazıları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Blog Yönetimi</h3>
          <p className="text-sm text-gray-600">Blog yazılarınızı yönetin ve yeni yazı oluşturun</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Blog Yazarım
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Blog Yazısı</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Başlık *</FormLabel>
                      <FormControl>
                        <Input placeholder="Blog yazısı başlığı" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İçerik *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Blog yazısının içeriği" rows={10} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blog Görseli</FormLabel>
                      <FormControl>
                        <FileUpload
                          onUpload={handleImageUpload}
                          currentImage={field.value}
                          accept="image/jpeg,image/jpg,image/png"
                          maxSize={5 * 1024 * 1024}
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        JPEG, JPG ve PNG formatları desteklenir (Maksimum 5MB)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">SEO ve Google Ayarları</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="seo_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Google'da Çıkacak Başlık (Max 65 Karakter)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Google'da görünecek başlık" 
                              maxLength={65}
                              {...field} 
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">
                            {field.value?.length || 0}/65 karakter
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="seo_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Google Açıklama (Max 140 Karakter)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Google'da görünecek açıklama" 
                              rows={3}
                              maxLength={140}
                              {...field} 
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">
                            {field.value?.length || 0}/140 karakter
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="keywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anahtar Kelimeler (3 Adet, virgülle ayırın)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="anahtar kelime1, anahtar kelime2, anahtar kelime3" 
                              {...field} 
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">
                            Maksimum 3 anahtar kelime girin, virgülle ayırın
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button type="submit" disabled={isProcessing}>
                    {isProcessing ? "Gönderiliyor..." : "Onaya Gönder"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Düzenleme Dialog'u */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Blog Yazısını Düzenle</DialogTitle>
            {editingBlog?.admin_message && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                <p className="text-sm font-medium text-red-800 mb-1">Admin Mesajı:</p>
                <p className="text-sm text-red-700">{editingBlog.admin_message}</p>
              </div>
            )}
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlık *</FormLabel>
                    <FormControl>
                      <Input placeholder="Blog yazısı başlığı" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İçerik *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Blog yazısının içeriği" rows={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="featured_image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blog Görseli</FormLabel>
                    <FormControl>
                      <FileUpload
                        onUpload={handleEditImageUpload}
                        currentImage={field.value}
                        accept="image/jpeg,image/jpg,image/png"
                        maxSize={5 * 1024 * 1024}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      JPEG, JPG ve PNG formatları desteklenir (Maksimum 5MB)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">SEO ve Google Ayarları</h3>
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={editForm.control}
                    name="seo_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google'da Çıkacak Başlık (Max 65 Karakter)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Google'da görünecek başlık" 
                            maxLength={65}
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          {field.value?.length || 0}/65 karakter
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="seo_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Açıklama (Max 140 Karakter)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Google'da görünecek açıklama" 
                            rows={3}
                            maxLength={140}
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          {field.value?.length || 0}/140 karakter
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anahtar Kelimeler (3 Adet, virgülle ayırın)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="anahtar kelime1, anahtar kelime2, anahtar kelime3" 
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          Maksimum 3 anahtar kelime girin, virgülle ayırın
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingBlog(null);
                    editForm.reset();
                  }}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? "Güncelleniyor..." : "Düzeltmeleri Kaydet ve Onaya Gönder"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {blogs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-gray-600 text-center">
                Henüz blog yazınız bulunmuyor.
                <br />
                İlk blog yazınızı oluşturmak için yukarıdaki butonu kullanın.
              </p>
            </CardContent>
          </Card>
        ) : (
          blogs.map((blog) => (
            <Card key={blog.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{blog.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Oluşturulma: {new Date(blog.created_at).toLocaleDateString('tr-TR')}
                    </p>
                    {blog.word_count && (
                      <p className="text-xs text-gray-500">Kelime sayısı: {blog.word_count}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(blog.status)}>
                    {getStatusText(blog.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {blog.admin_message && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                    <p className="text-sm font-medium text-red-800 mb-1">Admin Mesajı:</p>
                    <p className="text-sm text-red-700">{blog.admin_message}</p>
                  </div>
                )}
                
                {blog.featured_image && (
                  <div className="mb-4">
                    <img 
                      src={blog.featured_image} 
                      alt={blog.title}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}
                
                <div className="text-sm text-gray-700 mb-4">
                  {blog.content.substring(0, 200)}...
                </div>
                
                {(blog.seo_title || blog.seo_description || blog.keywords) && (
                  <div className="bg-blue-50 p-3 rounded mb-4">
                    <p className="text-sm font-medium text-blue-800 mb-2">SEO Bilgileri:</p>
                    {blog.seo_title && <p className="text-xs text-blue-700 mb-1"><strong>Google Başlık:</strong> {blog.seo_title}</p>}
                    {blog.seo_description && <p className="text-xs text-blue-700 mb-1"><strong>Google Açıklama:</strong> {blog.seo_description}</p>}
                    {blog.keywords && <p className="text-xs text-blue-700"><strong>Anahtar Kelimeler:</strong> {blog.keywords}</p>}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        İncele
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{blog.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {blog.featured_image && (
                          <div className="mb-4">
                            <img 
                              src={blog.featured_image} 
                              alt={blog.title}
                              className="w-full h-64 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                        <div className="bg-gray-50 p-4 rounded">
                          <div className="text-sm whitespace-pre-wrap">{blog.content}</div>
                        </div>
                        {(blog.seo_title || blog.seo_description || blog.keywords) && (
                          <div className="bg-blue-50 p-4 rounded">
                            <p className="text-sm font-medium text-blue-800 mb-2">SEO Bilgileri:</p>
                            {blog.seo_title && <p className="text-sm text-blue-700 mb-1"><strong>Google Başlık:</strong> {blog.seo_title}</p>}
                            {blog.seo_description && <p className="text-sm text-blue-700 mb-1"><strong>Google Açıklama:</strong> {blog.seo_description}</p>}
                            {blog.keywords && <p className="text-sm text-blue-700"><strong>Anahtar Kelimeler:</strong> {blog.keywords}</p>}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Düzeltme gerekli durumundaki bloglar için düzenleme butonu */}
                  {blog.status === 'revision_needed' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(blog)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Düzenle
                    </Button>
                  )}
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(blog.id)}
                    disabled={isProcessing}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorBlogManagement;
