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
import FileUpload from "@/components/FileUpload";
import AdminBackButton from "@/components/AdminBackButton";
import { Eye, CheckCircle, XCircle, AlertCircle, MessageSquare, Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserRole } from "@/hooks/useUserRole";

const blogSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur"),
  content: z.string().min(1, "İçerik zorunludur"),
  excerpt: z.string().optional(),
  featured_image: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  keywords: z.string().optional(),
  specialist_id: z.string().optional(),
});

type BlogFormValues = z.infer<typeof blogSchema>;

const BlogManagement = () => {
  const { toast } = useToast();
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const { userProfile } = useUserRole();
  const [selectedBlogs, setSelectedBlogs] = useState<string[]>([]);

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      featured_image: "",
      seo_title: "",
      seo_description: "",
      keywords: "",
      specialist_id: "",
    },
  });

  const editForm = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      featured_image: "",
      seo_title: "",
      seo_description: "",
      keywords: "",
      specialist_id: "",
    },
  });

  useEffect(() => {
    fetchBlogs();
    fetchSpecialists();
  }, []);

  const fetchSpecialists = async () => {
    try {
      const { data, error } = await supabase
        .from('specialists')
        .select('id, name, specialty')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Uzmanlar çekilirken hata:', error);
        return;
      }

      setSpecialists(data || []);
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
    }
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          specialists (
            id,
            name,
            specialty
          )
        `)
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
      const slug = generateSlug(values.title);
      const wordCount = values.content.split(/\s+/).length;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Hata",
          description: "Oturum açmanız gerekiyor.",
          variant: "destructive"
        });
        return;
      }

      // Determine author type and name based on specialist selection
      let authorType = userProfile?.role === 'staff' ? 'staff' : 'admin';
      let authorName = userProfile?.role === 'staff' ? 'Staff Editörü' : 'Editör';
      
      // If a specialist is selected, use their name as author
      if (values.specialist_id && values.specialist_id !== "none") {
        const selectedSpecialist = specialists.find(s => s.id === values.specialist_id);
        if (selectedSpecialist) {
          authorName = selectedSpecialist.name;
          authorType = 'specialist';
        }
      }

      // İlk olarak blog_posts tablosuna ekle
      const { data: insertedBlogPost, error: blogPostError } = await supabase
        .from('blog_posts')
        .insert({
          title: values.title,
          content: values.content,
          excerpt: values.excerpt || null,
          featured_image: values.featured_image || null,
          slug: slug,
          author_id: user.id,
          author_name: authorName,
          author_type: authorType,
          status: "published",
          published_at: new Date().toISOString(),
          word_count: wordCount,
          seo_title: values.seo_title || null,
          seo_description: values.seo_description || null,
          keywords: values.keywords || null,
          specialist_id: values.specialist_id === "none" ? null : values.specialist_id || null,
        })
        .select()
        .single();

      if (blogPostError) {
        console.error('Blog oluşturma hatası:', blogPostError);
        toast({
          title: "Hata",
          description: "Blog oluşturulurken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      // Sonra blogs tablosuna da ekle (public görünüm için)
      const { error: blogsError } = await supabase
        .from('blogs')
        .insert({
          title: values.title,
          content: values.content,
          excerpt: values.excerpt || null,
          featured_image: values.featured_image || null,
          slug: slug,
          author_name: authorName,
          status: "published",
          meta_title: values.seo_title || null,
          meta_description: values.seo_description || null,
          tags: values.keywords ? values.keywords.split(',').map(tag => tag.trim()) : null,
        });

      if (blogsError) {
        console.error('Blogs tablosuna ekleme hatası:', blogsError);
        // blogs tablosuna ekleme başarısız olursa blog_posts'tan da sil
        await supabase.from('blog_posts').delete().eq('id', insertedBlogPost.id);
        toast({
          title: "Hata",
          description: "Blog yayınlanırken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Blog Oluşturuldu",
        description: "Blog yazısı başarıyla yayınlandı.",
      });

      form.reset();
      setIsCreateDialogOpen(false);
      fetchBlogs();
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

  const handleApprove = async (blogId: string) => {
    setIsProcessing(true);
    try {
      // İlk olarak blog_posts tablosunu güncelle
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
          admin_message: null
        })
        .eq('id', blogId);

      if (updateError) {
        console.error('Blog onaylama hatası:', updateError);
        toast({
          title: "Hata",
          description: "Blog onaylanırken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      // Blog bilgilerini al
      const { data: blogData, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*, specialists(email, name)')
        .eq('id', blogId)
        .single();

      if (fetchError || !blogData) {
        console.error('Blog verisi alınamadı:', fetchError);
        toast({
          title: "Hata",
          description: "Blog verisi alınamadı.",
          variant: "destructive"
        });
        return;
      }

      // blogs tablosuna da ekle (eğer yoksa)
      const { error: insertError } = await supabase
        .from('blogs')
        .upsert({
          title: blogData.title,
          content: blogData.content,
          excerpt: blogData.excerpt,
          featured_image: blogData.featured_image,
          slug: blogData.slug,
          author_name: blogData.author_name,
          status: "published",
          meta_title: blogData.seo_title,
          meta_description: blogData.seo_description,
          tags: blogData.keywords ? blogData.keywords.split(',').map((tag: string) => tag.trim()) : null,
          created_at: blogData.published_at || blogData.created_at,
        }, {
          onConflict: 'slug'
        });

      if (insertError) {
        console.error('Blogs tablosuna ekleme hatası:', insertError);
      }

      // Eğer blog bir uzmana aitse, bildirim gönder
      if (blogData.specialist_id && blogData.specialists) {
        try {
          await supabase.functions.invoke('send-blog-notification', {
            body: {
              blogId: blogData.id,
              specialistEmail: blogData.specialists.email,
              specialistName: blogData.specialists.name,
              blogTitle: blogData.title,
              blogSlug: blogData.slug
            }
          });
          console.log('Blog notification sent to specialist');
        } catch (notifError) {
          console.error('Blog notification error:', notifError);
          // Bildirim hatası blog onaylamasını engellemez
        }
      }

      toast({
        title: "Blog Onaylandı",
        description: "Blog yazısı yayınlandı ve uzmana bildirim gönderildi.",
      });

      fetchBlogs();
    } catch (error) {
      console.error('Blog onaylama hatası:', error);
      toast({
        title: "Hata",
        description: "Blog onaylanırken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestRevision = async (blogId: string) => {
    if (!adminMessage.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen düzeltme mesajı yazın.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          status: 'revision_needed',
          admin_message: adminMessage,
          revision_count: blogs.find(b => b.id === blogId)?.revision_count + 1 || 1
        })
        .eq('id', blogId);

      if (error) {
        console.error('Düzeltme talebi gönderme hatası:', error);
        toast({
          title: "Hata",
          description: "Düzeltme talebi gönderilirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Düzeltme Talebi Gönderildi",
        description: "Yazara düzeltme talebi iletildi.",
      });

      setAdminMessage("");
      setSelectedBlog(null);
      fetchBlogs();
    } catch (error) {
      console.error('Düzeltme talebi gönderme hatası:', error);
      toast({
        title: "Hata",
        description: "Düzeltme talebi gönderilirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
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

      fetchBlogs();
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

  const handleEdit = (blog: any) => {
    setEditingBlog(blog);
    editForm.reset({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt || "",
      featured_image: blog.featured_image || "",
      seo_title: blog.seo_title || "",
      seo_description: blog.seo_description || "",
      keywords: blog.keywords || "",
      specialist_id: blog.specialist_id || "",
    });
    
    // Force trigger form field updates
    setTimeout(() => {
      editForm.setValue('featured_image', blog.featured_image || '');
    }, 0);
    
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = async (values: BlogFormValues) => {
    if (!editingBlog) return;
    
    setIsProcessing(true);
    try {
      const slug = generateSlug(values.title);
      const wordCount = values.content.split(/\s+/).length;

      const { error } = await supabase
        .from('blog_posts')
        .update({
          title: values.title,
          content: values.content,
          excerpt: values.excerpt || null,
          featured_image: values.featured_image || null,
          slug: slug,
          word_count: wordCount,
          seo_title: values.seo_title || null,
          seo_description: values.seo_description || null,
          keywords: values.keywords || null,
          specialist_id: values.specialist_id === "none" ? null : values.specialist_id || null
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
        description: "Blog yazısı başarıyla güncellendi.",
      });

      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingBlog(null);
      fetchBlogs();
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

  const pendingCount = blogs.filter(blog => blog.status === "pending").length;
  const publishedCount = blogs.filter(blog => blog.status === "published").length;
  const isStaff = userProfile?.role === 'staff';

  const toggleSelectAll = () => {
    if (selectedBlogs.length === blogs.length) {
      setSelectedBlogs([]);
    } else {
      setSelectedBlogs(blogs.map(b => b.id));
    }
  };

  const toggleSelectBlog = (blogId: string) => {
    setSelectedBlogs(prev => 
      prev.includes(blogId) 
        ? prev.filter(id => id !== blogId)
        : [...prev, blogId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedBlogs.length === 0) return;
    if (!confirm(`${selectedBlogs.length} blog yazısını silmek istediğinizden emin misiniz?`)) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .in('id', selectedBlogs);

      if (error) throw error;

      toast({
        title: "Toplu Silme Başarılı",
        description: `${selectedBlogs.length} blog yazısı silindi.`,
      });

      setSelectedBlogs([]);
      fetchBlogs();
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      toast({
        title: "Hata",
        description: "Blog yazıları silinirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedBlogs.length === 0) return;
    
    setIsProcessing(true);
    try {
      for (const blogId of selectedBlogs) {
        await handleApprove(blogId);
      }

      toast({
        title: "Toplu Onaylama Başarılı",
        description: `${selectedBlogs.length} blog yazısı onaylandı.`,
      });

      setSelectedBlogs([]);
      fetchBlogs();
    } catch (error) {
      console.error('Toplu onaylama hatası:', error);
      toast({
        title: "Hata",
        description: "Blog yazıları onaylanırken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Blog yazıları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-6xl">
        <AdminBackButton />
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Blog Yönetimi</h2>
            <p className="text-gray-600">Blog yazılarını yönetin ve yeni blog yazısı oluşturun</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Card className="px-4 py-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
                  <p className="text-xs text-muted-foreground">Yayınlandı</p>
                </div>
              </Card>
              {pendingCount > 0 && (
                <Card className="px-4 py-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                    <p className="text-xs text-muted-foreground">Onay Bekliyor</p>
                  </div>
                </Card>
              )}
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Blog Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Yeni Blog Yazısı Oluştur</DialogTitle>
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
                      name="excerpt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Özet</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Blog yazısının kısa özeti" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialist_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hangi Uzman</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Uzman seçin (opsiyonel)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                               <SelectItem value="none">Uzman seçilmedi</SelectItem>
                              {specialists.map((specialist) => (
                                <SelectItem key={specialist.id} value={specialist.id}>
                                  {specialist.name} - {specialist.specialty}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="featured_image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Öne Çıkan Resim</FormLabel>
                          <FormControl>
                            <FileUpload
                              onUpload={(url) => field.onChange(url)}
                              currentImage={field.value}
                              accept="image/*"
                            />
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

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">SEO Ayarları</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="seo_title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SEO Başlık</FormLabel>
                              <FormControl>
                                <Input placeholder="Google'da görünecek başlık" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="seo_description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SEO Açıklama</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Google'da görünecek açıklama" rows={3} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="keywords"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Anahtar Kelimeler</FormLabel>
                              <FormControl>
                                <Input placeholder="anahtar kelime1, anahtar kelime2, ..." {...field} />
                              </FormControl>
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
                        {isProcessing ? "Oluşturuluyor..." : "Yayınla"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {selectedBlogs.length > 0 && (
          <Card className="mb-4 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedBlogs.length} blog seçildi
              </p>
              <div className="flex gap-2">
                {!isStaff && (
                  <Button 
                    size="sm" 
                    onClick={handleBulkApprove}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Toplu Onayla
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={isProcessing}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Toplu Sil
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedBlogs.length === blogs.length && blogs.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Başlık</TableHead>
                <TableHead>Yazar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Henüz blog yazısı bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                blogs.map((blog) => (
                  <TableRow key={blog.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedBlogs.includes(blog.id)}
                        onCheckedChange={() => toggleSelectBlog(blog.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {blog.featured_image && (
                          <img
                            src={blog.featured_image}
                            alt={blog.title}
                            className="w-16 h-12 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="max-w-md">
                          <p className="font-medium line-clamp-1">{blog.title}</p>
                          {blog.excerpt && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{blog.excerpt}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {blog.author_type === 'specialist' ? blog.author_name : 'Editör'}
                        </p>
                        {blog.specialists && (
                          <p className="text-xs text-muted-foreground">
                            {blog.specialists.name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(blog.status)}>
                        {getStatusText(blog.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(blog.created_at).toLocaleDateString('tr-TR')}</p>
                        {blog.word_count && (
                          <p className="text-xs text-muted-foreground">{blog.word_count} kelime</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{blog.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {blog.featured_image && (
                                <img src={blog.featured_image} alt={blog.title} className="w-full max-h-64 object-cover rounded" />
                              )}
                              {blog.excerpt && <div className="prose max-w-none">{blog.excerpt}</div>}
                              <div className="bg-gray-50 p-4 rounded">
                                <p className="text-sm text-gray-600">İçerik Önizleme:</p>
                                <div className="text-sm mt-2 whitespace-pre-wrap">{blog.content}</div>
                              </div>
                              {(blog.seo_title || blog.seo_description || blog.keywords) && (
                                <div className="bg-blue-50 p-4 rounded">
                                  <p className="text-sm font-medium text-blue-800 mb-2">SEO Bilgileri:</p>
                                  {blog.seo_title && <p className="text-sm text-blue-700 mb-1"><strong>SEO Başlık:</strong> {blog.seo_title}</p>}
                                  {blog.seo_description && <p className="text-sm text-blue-700 mb-1"><strong>SEO Açıklama:</strong> {blog.seo_description}</p>}
                                  {blog.keywords && <p className="text-sm text-blue-700"><strong>Anahtar Kelimeler:</strong> {blog.keywords}</p>}
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {(userProfile?.role === 'admin' || userProfile?.role === 'staff') && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(blog)}
                            disabled={isProcessing}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}

                        {blog.status === "pending" && !isStaff && (
                          <>
                            <Button 
                              variant="ghost"
                              size="sm" 
                              onClick={() => handleApprove(blog.id)}
                              disabled={isProcessing}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedBlog(blog)}
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Düzeltme Mesajı Gönder</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p className="text-sm text-gray-600">
                                    <strong>{blog.title}</strong> için düzeltme mesajı yazın:
                                  </p>
                                  <Textarea
                                    value={adminMessage}
                                    onChange={(e) => setAdminMessage(e.target.value)}
                                    placeholder="Örnek: Bu kısımda kaynak belirtmeniz gerekiyor, lütfen güncel tıbbi kaynakları ekleyip tekrar gönderin."
                                    rows={4}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => {
                                        setAdminMessage("");
                                        setSelectedBlog(null);
                                      }}
                                    >
                                      İptal
                                    </Button>
                                  <Button 
                                    onClick={() => handleRequestRevision(blog.id)}
                                    disabled={isProcessing || !adminMessage.trim()}
                                  >
                                    {isProcessing ? "Gönderiliyor..." : "Gönder"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                      {(userProfile?.role === 'admin' || userProfile?.role === 'staff') && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(blog.id)}
                          disabled={isProcessing}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

        {/* Düzenleme Modalı */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Blog Yazısını Düzenle</DialogTitle>
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
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Özet</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Blog yazısının kısa özeti" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="specialist_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hangi Uzman</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Uzman seçin (opsiyonel)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Uzman seçilmedi</SelectItem>
                          {specialists.map((specialist) => (
                            <SelectItem key={specialist.id} value={specialist.id}>
                              {specialist.name} - {specialist.specialty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="featured_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Öne Çıkan Resim</FormLabel>
                      <FormControl>
                        <FileUpload
                          onUpload={(url) => field.onChange(url)}
                          currentImage={field.value}
                          accept="image/*"
                        />
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

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">SEO Ayarları</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={editForm.control}
                      name="seo_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SEO Başlık</FormLabel>
                          <FormControl>
                            <Input placeholder="Google'da görünecek başlık" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="seo_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SEO Açıklama</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Google'da görünecek açıklama" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="keywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anahtar Kelimeler</FormLabel>
                          <FormControl>
                            <Input placeholder="anahtar kelime1, anahtar kelime2, ..." {...field} />
                          </FormControl>
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
                    }}
                  >
                    İptal
                  </Button>
                  <Button type="submit" disabled={isProcessing}>
                    {isProcessing ? "Güncelleniyor..." : "Güncelle"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BlogManagement;
