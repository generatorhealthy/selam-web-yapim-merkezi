import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Eye, Edit, Trash2, Sparkles, FileText, Clock, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
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
  doctorSpecialty?: string;
}

const DoctorBlogManagement = ({ doctorId, doctorName, doctorSpecialty }: DoctorBlogManagementProps) => {
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGenerated, setAiGenerated] = useState<BlogFormValues | null>(null);

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: { title: "", content: "", seo_title: "", seo_description: "", keywords: "", featured_image: "" },
  });

  const editForm = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: { title: "", content: "", seo_title: "", seo_description: "", keywords: "", featured_image: "" },
  });

  useEffect(() => { fetchMyBlogs(); }, [doctorId]);

  const fetchMyBlogs = async () => {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .or(`author_id.eq.${user.data.user?.id},specialist_id.eq.${doctorId}`)
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: "Hata", description: "Blog yazıları yüklenirken bir hata oluştu.", variant: "destructive" });
        return;
      }
      setBlogs(data || []);
    } catch {
      toast({ title: "Hata", description: "Beklenmeyen bir hata oluştu.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  };

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      toast({ title: "Hata", description: "Lütfen bir konu girin.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { topic: aiTopic, specialty: doctorSpecialty || 'Psikolog', doctorName }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAiGenerated({
        title: data.title,
        content: data.content,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
        keywords: data.keywords,
        featured_image: "",
      });

      toast({ title: "Blog İçeriği Oluşturuldu", description: "Yapay zeka blog içeriğinizi hazırladı. İnceleyip gönderebilirsiniz." });
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "Blog içeriği oluşturulurken bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAISubmit = async () => {
    if (!aiGenerated) return;
    setIsProcessing(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) { toast({ title: "Hata", description: "Oturum açmanız gerekiyor.", variant: "destructive" }); return; }

      const slug = generateSlug(aiGenerated.title);
      const wordCount = aiGenerated.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
      const keywordsArray = aiGenerated.keywords ? aiGenerated.keywords.split(',').map(k => k.trim()).slice(0, 3) : [];

      const { error } = await supabase.from('blog_posts').insert({
        title: aiGenerated.title, content: aiGenerated.content, slug,
        author_id: user.data.user.id, author_name: doctorName, author_type: "specialist",
        status: "pending", word_count: wordCount,
        seo_title: aiGenerated.seo_title || null, seo_description: aiGenerated.seo_description || null,
        keywords: keywordsArray.join(', ') || null, featured_image: aiGenerated.featured_image || null,
      });

      if (error) throw error;

      toast({ title: "Blog Gönderildi", description: "Blog yazınız onay için gönderildi." });
      setAiGenerated(null);
      setAiTopic("");
      setIsAIDialogOpen(false);
      fetchMyBlogs();
    } catch {
      toast({ title: "Hata", description: "Blog oluşturulurken bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmit = async (values: BlogFormValues) => {
    setIsProcessing(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) { toast({ title: "Hata", description: "Oturum açmanız gerekiyor.", variant: "destructive" }); return; }

      const slug = generateSlug(values.title);
      const wordCount = values.content.split(/\s+/).length;
      const keywordsArray = values.keywords ? values.keywords.split(',').map(k => k.trim()).slice(0, 3) : [];

      const { error } = await supabase.from('blog_posts').insert({
        title: values.title, content: values.content, slug,
        author_id: user.data.user.id, author_name: doctorName, author_type: "specialist",
        status: "pending", word_count: wordCount,
        seo_title: values.seo_title || null, seo_description: values.seo_description || null,
        keywords: keywordsArray.join(', ') || null, featured_image: values.featured_image || null,
      });

      if (error) throw error;
      toast({ title: "Blog Gönderildi", description: "Blog yazınız onay için gönderildi." });
      form.reset();
      setIsCreateDialogOpen(false);
      fetchMyBlogs();
    } catch {
      toast({ title: "Hata", description: "Blog oluşturulurken bir hata oluştu.", variant: "destructive" });
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
      const keywordsArray = values.keywords ? values.keywords.split(',').map(k => k.trim()).slice(0, 3) : [];

      const { error } = await supabase.from('blog_posts').update({
        title: values.title, content: values.content, slug,
        status: "pending", word_count: wordCount,
        seo_title: values.seo_title || null, seo_description: values.seo_description || null,
        keywords: keywordsArray.join(', ') || null, featured_image: values.featured_image || null,
        admin_message: null,
      }).eq('id', editingBlog.id);

      if (error) throw error;
      toast({ title: "Blog Güncellendi", description: "Blog yazınız düzeltildi ve tekrar onaya gönderildi." });
      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingBlog(null);
      fetchMyBlogs();
    } catch {
      toast({ title: "Hata", description: "Blog güncellenirken bir hata oluştu.", variant: "destructive" });
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

  const handleDelete = async (blogId: string) => {
    if (!confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', blogId);
      if (error) throw error;
      toast({ title: "Blog Silindi", description: "Blog yazısı silindi." });
      fetchMyBlogs();
    } catch {
      toast({ title: "Hata", description: "Blog silinirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "revision_needed": return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
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

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "published": return "default";
      case "pending": return "secondary";
      case "revision_needed": return "destructive";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Blog yazıları yükleniyor...</p>
        </div>
      </div>
    );
  }

  const BlogFormFields = ({ formInstance, onImageUpload, isAI = false }: { formInstance: any; onImageUpload: (url: string) => void; isAI?: boolean }) => (
    <div className="space-y-5">
      <FormField control={formInstance.control} name="title" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-semibold">Başlık *</FormLabel>
          <FormControl>
            <Input placeholder="Blog yazısı başlığı" className="h-11 rounded-xl" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={formInstance.control} name="content" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-semibold">İçerik *</FormLabel>
          <FormControl>
            <Textarea placeholder="Blog yazısının içeriği" rows={12} className="rounded-xl resize-none" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={formInstance.control} name="featured_image" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-semibold">Blog Görseli</FormLabel>
          <FormControl>
            <FileUpload onUpload={onImageUpload} currentImage={field.value} accept="image/jpeg,image/jpg,image/png" maxSize={5 * 1024 * 1024} />
          </FormControl>
          <p className="text-xs text-muted-foreground">JPEG, JPG ve PNG formatları (Maks. 5MB)</p>
          <FormMessage />
        </FormItem>
      )} />

      {!isAI && (
        <div className="border-t pt-5">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-primary" />
            </span>
            SEO ve Google Ayarları
          </h4>
          <div className="space-y-4">
            <FormField control={formInstance.control} name="seo_title" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Google Başlık (Max 65)</FormLabel>
                <FormControl>
                  <Input placeholder="Google'da görünecek başlık" maxLength={65} className="h-10 rounded-xl text-sm" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground">{field.value?.length || 0}/65</p>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={formInstance.control} name="seo_description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Google Açıklama (Max 140)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Google'da görünecek açıklama" rows={2} maxLength={140} className="rounded-xl text-sm resize-none" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground">{field.value?.length || 0}/140</p>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={formInstance.control} name="keywords" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Anahtar Kelimeler (3 adet, virgülle)</FormLabel>
                <FormControl>
                  <Input placeholder="kelime1, kelime2, kelime3" className="h-10 rounded-xl text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Blog Yönetimi</h2>
          <p className="text-sm text-muted-foreground mt-1">Blog yazılarınızı yönetin ve yeni içerik oluşturun</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-2">
                <Plus className="w-4 h-4" />
                Blog Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Blog Yazısı</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <BlogFormFields formInstance={form} onImageUpload={(url) => form.setValue('featured_image', url)} />
                  <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsCreateDialogOpen(false)}>İptal</Button>
                    <Button type="submit" className="rounded-xl" disabled={isProcessing}>
                      {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Gönderiliyor...</> : "Onaya Gönder"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAIDialogOpen} onOpenChange={(open) => { setIsAIDialogOpen(open); if (!open) { setAiGenerated(null); setAiTopic(""); } }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md">
                <Sparkles className="w-4 h-4" />
                Yapay Zeka ile Blog Oluştur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  Yapay Zeka ile Blog Oluştur
                </DialogTitle>
              </DialogHeader>

              {!aiGenerated ? (
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-2xl p-5 border border-violet-100 dark:border-violet-900/50">
                    <p className="text-sm text-muted-foreground mb-1">Uzmanlık Alanınız</p>
                    <p className="font-semibold text-foreground">{doctorSpecialty || 'Psikolog'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Blog Konusu *</label>
                    <Input
                      placeholder="Örn: Çocuklarda kaygı bozukluğu belirtileri"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="h-12 rounded-xl text-base"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {doctorSpecialty || 'Psikolog'} alanınızla ilgili bir konu girin. Yapay zeka minimum 300 kelimelik profesyonel bir blog yazısı, SEO başlığı, açıklama ve anahtar kelimeler oluşturacaktır.
                    </p>
                  </div>

                  <Button
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !aiTopic.trim()}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-base gap-2"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />Blog İçeriği Oluşturuluyor...</>
                    ) : (
                      <><Sparkles className="w-5 h-5" />İçerik Oluştur</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Blog içeriği başarıyla oluşturuldu! İnceleyip gönderin.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Başlık</label>
                    <Input value={aiGenerated.title} onChange={(e) => setAiGenerated({ ...aiGenerated, title: e.target.value })} className="h-11 rounded-xl" />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">İçerik</label>
                    <div className="border rounded-xl p-4 max-h-64 overflow-y-auto bg-muted/30 text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aiGenerated.content }} />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Blog Görseli</label>
                    <FileUpload
                      onUpload={(url) => setAiGenerated({ ...aiGenerated, featured_image: url })}
                      currentImage={aiGenerated.featured_image}
                      accept="image/jpeg,image/jpg,image/png"
                      maxSize={5 * 1024 * 1024}
                    />
                  </div>

                  <div className="bg-muted/40 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Otomatik SEO Ayarları
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Google Başlığı</p>
                        <p className="text-sm font-medium">{aiGenerated.seo_title}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Google Açıklaması</p>
                        <p className="text-sm">{aiGenerated.seo_description}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Anahtar Kelimeler</p>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          {aiGenerated.keywords?.split(',').map((kw, i) => (
                            <Badge key={i} variant="secondary" className="rounded-lg text-xs">{kw.trim()}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" className="rounded-xl" onClick={() => { setAiGenerated(null); setAiTopic(""); }}>
                      Yeniden Oluştur
                    </Button>
                    <Button onClick={handleAISubmit} disabled={isProcessing} className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-2">
                      {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" />Gönderiliyor...</> : "Onaya Gönder"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Blog Yazısını Düzenle</DialogTitle>
            {editingBlog?.admin_message && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mt-2">
                <p className="text-sm font-medium text-destructive mb-1">Admin Mesajı:</p>
                <p className="text-sm text-destructive/80">{editingBlog.admin_message}</p>
              </div>
            )}
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-5">
              <BlogFormFields formInstance={editForm} onImageUpload={(url) => editForm.setValue('featured_image', url)} />
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setIsEditDialogOpen(false); setEditingBlog(null); editForm.reset(); }}>İptal</Button>
                <Button type="submit" className="rounded-xl" disabled={isProcessing}>
                  {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Güncelleniyor...</> : "Düzeltmeleri Kaydet"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Blog List */}
      {blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-1">Henüz blog yazınız bulunmuyor.</p>
          <p className="text-sm text-muted-foreground">Yukarıdaki butonları kullanarak yeni bir blog yazısı oluşturun.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {blogs.map((blog) => (
            <div key={blog.id} className="group rounded-2xl border bg-background hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                {blog.featured_image && (
                  <div className="md:w-48 h-40 md:h-auto flex-shrink-0">
                    <img src={blog.featured_image} alt={blog.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground line-clamp-1">{blog.title}</h3>
                        {blog.specialist_id === doctorId && blog.author_type !== 'specialist' && (
                          <Badge variant="outline" className="text-xs shrink-0">Admin</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{new Date(blog.created_at).toLocaleDateString('tr-TR')}</span>
                        {blog.word_count && <span>·</span>}
                        {blog.word_count && <span>{blog.word_count} kelime</span>}
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(blog.status)} className="rounded-lg gap-1 shrink-0">
                      {getStatusIcon(blog.status)}
                      {getStatusText(blog.status)}
                    </Badge>
                  </div>

                  {blog.admin_message && (
                    <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-2.5 mb-3">
                      <p className="text-xs text-destructive"><strong>Admin:</strong> {blog.admin_message}</p>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {blog.content.replace(/<[^>]*>/g, '').substring(0, 180)}...
                  </p>

                  {/* SEO Info */}
                  {(blog.seo_title || blog.keywords) && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {blog.keywords?.split(',').map((kw: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs rounded-md">{kw.trim()}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="rounded-lg gap-1.5 text-xs">
                          <Eye className="w-3.5 h-3.5" /> İncele
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>{blog.title}</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          {blog.featured_image && (
                            <img src={blog.featured_image} alt={blog.title} className="w-full h-64 object-cover rounded-xl" />
                          )}
                          <div className="bg-muted/30 p-5 rounded-xl">
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />
                          </div>
                          {(blog.seo_title || blog.seo_description || blog.keywords) && (
                            <div className="bg-primary/5 p-4 rounded-xl space-y-2">
                              <p className="text-xs font-semibold text-primary uppercase tracking-wider">SEO Bilgileri</p>
                              {blog.seo_title && <p className="text-sm"><strong>Başlık:</strong> {blog.seo_title}</p>}
                              {blog.seo_description && <p className="text-sm"><strong>Açıklama:</strong> {blog.seo_description}</p>}
                              {blog.keywords && <p className="text-sm"><strong>Kelimeler:</strong> {blog.keywords}</p>}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {((blog.specialist_id === doctorId && blog.author_type !== 'specialist' && blog.status === 'published') ||
                      (blog.author_type === 'specialist' && blog.status === 'revision_needed')) && (
                      <Button variant="ghost" size="sm" className="rounded-lg gap-1.5 text-xs" onClick={() => handleEdit(blog)}>
                        <Edit className="w-3.5 h-3.5" /> Düzenle
                      </Button>
                    )}

                    {blog.author_type === 'specialist' && (
                      <Button variant="ghost" size="sm" className="rounded-lg gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(blog.id)} disabled={isProcessing}>
                        <Trash2 className="w-3.5 h-3.5" /> Sil
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorBlogManagement;
