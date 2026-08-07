import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FileUpload from "@/components/FileUpload";
import AdminBackButton from "@/components/AdminBackButton";
import RichTextEditor from "@/components/RichTextEditor";
import { SafeHtmlContent } from "@/components/SafeHtmlContent";
import {
  Eye, CheckCircle, AlertCircle, Plus, Edit, Trash2, Copy, ExternalLink,
  Search, RefreshCw, Sparkles, Clock, FileText, History, Loader2, CalendarClock,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
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

const stripHtml = (s: string) => (s || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const countWords = (s: string) => (stripHtml(s) ? stripHtml(s).split(" ").length : 0);
const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const formatDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Yeni: filtre / arama / sıralama
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Yeni: günlük içerik tazeleme
  const [refreshing, setRefreshing] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);
  const [refreshedToday, setRefreshedToday] = useState(0);

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "", content: "", excerpt: "", featured_image: "",
      seo_title: "", seo_description: "", keywords: "", specialist_id: "",
    },
  });

  const editForm = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "", content: "", excerpt: "", featured_image: "",
      seo_title: "", seo_description: "", keywords: "", specialist_id: "",
    },
  });

  useEffect(() => {
    fetchBlogs(1);
    fetchSpecialists();
    fetchRecentUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchBlogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, sortBy]);

  const fetchSpecialists = async () => {
    try {
      const { data, error } = await supabase
        .from("specialists")
        .select("id, name, specialty")
        .eq("is_active", true)
        .order("name");
      if (error) return console.error("Uzmanlar çekilirken hata:", error);
      setSpecialists(data || []);
    } catch (error) {
      console.error("Beklenmeyen hata:", error);
    }
  };

  const fetchRecentUpdates = async () => {
    try {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, last_refreshed_at, refresh_count, refresh_note, word_count")
        .not("last_refreshed_at", "is", null)
        .order("last_refreshed_at", { ascending: false })
        .limit(10);
      setRecent(data || []);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .gte("last_refreshed_at", todayStart.toISOString());
      setRefreshedToday(count || 0);
    } catch (e) {
      console.error("Son güncellemeler alınamadı:", e);
    }
  };

  const fetchBlogs = async (page: number = 1) => {
    try {
      setLoading(true);
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let countQuery = supabase.from("blog_posts").select("id", { count: "exact", head: true });
      if (statusFilter !== "all") countQuery = countQuery.eq("status", statusFilter);
      if (search.trim()) countQuery = countQuery.ilike("title", `%${search.trim()}%`);
      const { count } = await countQuery;
      setTotalCount(count || 0);

      let query = supabase
        .from("blog_posts")
        .select(`
          id, title, excerpt, featured_image, status, created_at, published_at,
          word_count, author_name, author_type, slug, content, seo_title,
          seo_description, keywords, specialist_id, last_refreshed_at, refresh_count,
          specialists ( id, name, specialty )
        `);

      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (search.trim()) query = query.ilike("title", `%${search.trim()}%`);

      if (sortBy === "oldest") {
        query = query.order("published_at", { ascending: true, nullsFirst: true });
      } else if (sortBy === "least_refreshed") {
        query = query
          .order("refresh_count", { ascending: true, nullsFirst: true })
          .order("published_at", { ascending: true, nullsFirst: true });
      } else {
        query = query.order("published_at", { ascending: false, nullsFirst: false });
      }

      const { data, error } = await query.range(from, to);
      if (error) {
        console.error("Blog yazıları çekilirken hata:", error);
        toast({ title: "Hata", description: "Blog yazıları yüklenirken bir hata oluştu.", variant: "destructive" });
        return;
      }

      setBlogs(data || []);
      setCurrentPage(page);
    } catch (error) {
      console.error("Beklenmeyen hata:", error);
      toast({ title: "Hata", description: "Beklenmeyen bir hata oluştu.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const runRefresh = async (blogIds?: string[]) => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("refresh-old-blog-content", {
        body: blogIds ? { blogIds, limit: blogIds.length } : { limit: 3 },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const updated = (data as any)?.updated ?? 0;
      const failed = (data as any)?.failed ?? 0;
      toast({
        title: updated > 0 ? "İçerikler güncellendi" : "Güncelleme yapılmadı",
        description: `${updated} yazıya yeni bölüm eklendi ve tarihi bugüne çekildi.${failed ? ` ${failed} başarısız.` : ""}`,
        variant: updated > 0 ? "default" : "destructive",
      });

      await Promise.all([fetchBlogs(currentPage), fetchRecentUpdates()]);
    } catch (e: any) {
      toast({ title: "Hata", description: e?.message || "Güncelleme yapılamadı.", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const onSubmit = async (values: BlogFormValues) => {
    setIsProcessing(true);
    try {
      const slug = generateSlug(values.title);
      const wordCount = countWords(values.content);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Hata", description: "Oturum açmanız gerekiyor.", variant: "destructive" });
        return;
      }

      let authorType = userProfile?.role === "staff" ? "staff" : "admin";
      let authorName = userProfile?.role === "staff" ? "Staff Editörü" : "Editör";

      if (values.specialist_id && values.specialist_id !== "none") {
        const selectedSpecialist = specialists.find((s) => s.id === values.specialist_id);
        if (selectedSpecialist) {
          authorName = selectedSpecialist.name;
          authorType = "specialist";
        }
      }

      const { data: insertedBlogPost, error: blogPostError } = await supabase
        .from("blog_posts")
        .insert({
          title: values.title,
          content: values.content,
          excerpt: values.excerpt || null,
          featured_image: values.featured_image || null,
          slug,
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
        console.error("Blog oluşturma hatası:", blogPostError);
        toast({ title: "Hata", description: "Blog oluşturulurken bir hata oluştu.", variant: "destructive" });
        return;
      }

      const { error: blogsError } = await supabase.from("blogs").insert({
        title: values.title,
        content: values.content,
        excerpt: values.excerpt || null,
        featured_image: values.featured_image || null,
        slug,
        author_name: authorName,
        status: "published",
        meta_title: values.seo_title || null,
        meta_description: values.seo_description || null,
        tags: values.keywords ? values.keywords.split(",").map((tag) => tag.trim()) : null,
      });

      if (blogsError) {
        console.error("Blogs tablosuna ekleme hatası:", blogsError);
        await supabase.from("blog_posts").delete().eq("id", insertedBlogPost.id);
        toast({ title: "Hata", description: "Blog yayınlanırken bir hata oluştu.", variant: "destructive" });
        return;
      }

      toast({ title: "Blog Oluşturuldu", description: "Blog yazısı başarıyla yayınlandı." });
      form.reset();
      setIsCreateDialogOpen(false);
      fetchBlogs(1);
    } catch (error) {
      console.error("Blog oluşturma hatası:", error);
      toast({ title: "Hata", description: "Blog oluşturulurken bir hata oluştu.", variant: "destructive" });
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
      case "published": return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
      case "pending": return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case "revision_needed": return "bg-red-100 text-red-800 hover:bg-red-100";
      case "draft": return "bg-slate-100 text-slate-700 hover:bg-slate-100";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const handleApprove = async (blogId: string) => {
    setIsProcessing(true);
    try {
      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({ status: "published", published_at: new Date().toISOString(), admin_message: null })
        .eq("id", blogId);

      if (updateError) {
        console.error("Blog onaylama hatası:", updateError);
        toast({ title: "Hata", description: "Blog onaylanırken bir hata oluştu.", variant: "destructive" });
        return;
      }

      const { data: blogData, error: fetchError } = await supabase
        .from("blog_posts")
        .select("*, specialists(email, name)")
        .eq("id", blogId)
        .maybeSingle();

      if (fetchError || !blogData) {
        toast({ title: "Hata", description: "Blog verisi alınamadı.", variant: "destructive" });
        return;
      }

      await supabase.from("blogs").upsert({
        title: blogData.title,
        content: blogData.content,
        excerpt: blogData.excerpt,
        featured_image: blogData.featured_image,
        slug: blogData.slug,
        author_name: blogData.author_name,
        status: "published",
        meta_title: blogData.seo_title,
        meta_description: blogData.seo_description,
        tags: blogData.keywords ? blogData.keywords.split(",").map((tag: string) => tag.trim()) : null,
        created_at: blogData.published_at || blogData.created_at,
      }, { onConflict: "slug" });

      if (blogData.specialist_id && (blogData as any).specialists) {
        try {
          await supabase.functions.invoke("send-blog-notification", {
            body: {
              blogId: blogData.id,
              specialistEmail: (blogData as any).specialists.email,
              specialistName: (blogData as any).specialists.name,
              blogTitle: blogData.title,
              blogSlug: blogData.slug,
            },
          });
        } catch (notifError) {
          console.error("Blog notification error:", notifError);
        }
      }

      try {
        supabase.functions.invoke("scheduled-multi-share", {
          body: { blogId: blogData.id, platforms: ["twitter", "linkedin", "tumblr"] },
        });
      } catch (shareErr) {
        console.error("Social share trigger error:", shareErr);
      }

      toast({ title: "Blog Onaylandı", description: "Blog yazısı yayınlandı ve uzmana bildirim gönderildi." });
      fetchBlogs(currentPage);
    } catch (error) {
      console.error("Blog onaylama hatası:", error);
      toast({ title: "Hata", description: "Blog onaylanırken bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestRevision = async (blogId: string) => {
    if (!adminMessage.trim()) {
      toast({ title: "Hata", description: "Lütfen düzeltme mesajı yazın.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          status: "revision_needed",
          admin_message: adminMessage,
          revision_count: blogs.find((b) => b.id === blogId)?.revision_count + 1 || 1,
        })
        .eq("id", blogId);

      if (error) {
        toast({ title: "Hata", description: "Düzeltme talebi gönderilirken bir hata oluştu.", variant: "destructive" });
        return;
      }

      toast({ title: "Düzeltme Talebi Gönderildi", description: "Yazara düzeltme talebi iletildi." });
      setAdminMessage("");
      setSelectedBlog(null);
      fetchBlogs(currentPage);
    } catch (error) {
      toast({ title: "Hata", description: "Düzeltme talebi gönderilirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (blogId: string) => {
    if (!confirm("Bu blog yazısını silmek istediğinizden emin misiniz?")) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.from("blog_posts").delete().eq("id", blogId);
      if (error) {
        toast({ title: "Hata", description: "Blog silinirken bir hata oluştu.", variant: "destructive" });
        return;
      }
      toast({ title: "Blog Silindi", description: "Blog yazısı silindi." });
      fetchBlogs(currentPage);
    } catch (error) {
      toast({ title: "Hata", description: "Blog silinirken bir hata oluştu.", variant: "destructive" });
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
    setTimeout(() => editForm.setValue("featured_image", blog.featured_image || ""), 0);
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = async (values: BlogFormValues) => {
    if (!editingBlog) return;
    setIsProcessing(true);
    try {
      const slug = generateSlug(values.title);
      const wordCount = countWords(values.content);

      const { error } = await supabase
        .from("blog_posts")
        .update({
          title: values.title,
          content: values.content,
          excerpt: values.excerpt || null,
          featured_image: values.featured_image || null,
          slug,
          word_count: wordCount,
          seo_title: values.seo_title || null,
          seo_description: values.seo_description || null,
          keywords: values.keywords || null,
          specialist_id: values.specialist_id === "none" ? null : values.specialist_id || null,
        })
        .eq("id", editingBlog.id);

      if (error) {
        toast({ title: "Hata", description: "Blog güncellenirken bir hata oluştu.", variant: "destructive" });
        return;
      }

      toast({ title: "Blog Güncellendi", description: "Blog yazısı başarıyla güncellendi." });
      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingBlog(null);
      fetchBlogs(currentPage);
    } catch (error) {
      toast({ title: "Hata", description: "Blog güncellenirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = blogs.filter((blog) => blog.status === "pending").length;
  const isStaff = userProfile?.role === "staff";
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const toggleSelectAll = () => {
    if (selectedBlogs.length === blogs.length) setSelectedBlogs([]);
    else setSelectedBlogs(blogs.map((b) => b.id));
  };

  const toggleSelectBlog = (blogId: string) => {
    setSelectedBlogs((prev) => (prev.includes(blogId) ? prev.filter((id) => id !== blogId) : [...prev, blogId]));
  };

  const handleBulkDelete = async () => {
    if (selectedBlogs.length === 0) return;
    if (!confirm(`${selectedBlogs.length} blog yazısını silmek istediğinizden emin misiniz?`)) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.from("blog_posts").delete().in("id", selectedBlogs);
      if (error) throw error;
      toast({ title: "Toplu Silme Başarılı", description: `${selectedBlogs.length} blog yazısı silindi.` });
      setSelectedBlogs([]);
      fetchBlogs(currentPage);
    } catch (error) {
      toast({ title: "Hata", description: "Blog yazıları silinirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedBlogs.length === 0) return;
    setIsProcessing(true);
    try {
      for (const blogId of selectedBlogs) await handleApprove(blogId);
      toast({ title: "Toplu Onaylama Başarılı", description: `${selectedBlogs.length} blog yazısı onaylandı.` });
      setSelectedBlogs([]);
      fetchBlogs(currentPage);
    } catch (error) {
      toast({ title: "Hata", description: "Blog yazıları onaylanırken bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const blogFormFields = (f: typeof form, mode: "create" | "edit") => (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          control={f.control}
          name="title"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Başlık *</FormLabel>
              <FormControl><Input placeholder="Blog yazısı başlığı" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={f.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Özet</FormLabel>
              <FormControl><Textarea placeholder="Blog yazısının kısa özeti" rows={4} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={f.control}
          name="specialist_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hangi Uzman</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Uzman seçin (opsiyonel)" /></SelectTrigger>
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
      </div>

      <FormField
        control={f.control}
        name="featured_image"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Öne Çıkan Resim</FormLabel>
            <FormControl>
              <FileUpload onUpload={(url) => field.onChange(url)} currentImage={field.value} accept="image/*" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={f.control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <FormLabel>İçerik *</FormLabel>
            <FormControl>
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="Blog yazısının içeriği — başlık, kalın, renk, liste ve link ekleyebilirsiniz."
                minHeight={mode === "create" ? 320 : 380}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="text-base font-semibold mb-4">SEO Ayarları</h3>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={f.control}
            name="seo_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SEO Başlık</FormLabel>
                <FormControl><Input placeholder="Google'da görünecek başlık" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={f.control}
            name="seo_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SEO Açıklama</FormLabel>
                <FormControl><Textarea placeholder="Google'da görünecek açıklama" rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={f.control}
            name="keywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anahtar Kelimeler</FormLabel>
                <FormControl><Input placeholder="anahtar kelime1, anahtar kelime2, ..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/40 p-4">
      <div className="container mx-auto max-w-7xl">
        <AdminBackButton />

        {/* Başlık */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blog Yönetimi</h1>
            <p className="text-muted-foreground mt-1">
              Yazıları yönetin, günlük içerik tazeleme ile eski yazıları güncel tutun.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { fetchBlogs(currentPage); fetchRecentUpdates(); }} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Yenile
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2"><Plus className="w-4 h-4" /> Blog Ekle</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Yeni Blog Yazısı Oluştur</DialogTitle></DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {blogFormFields(form, "create")}
                    <div className="flex gap-2 justify-end sticky bottom-0 bg-background py-3 border-t">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>İptal</Button>
                      <Button type="submit" disabled={isProcessing}>{isProcessing ? "Oluşturuluyor..." : "Yayınla"}</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
              <div><p className="text-2xl font-bold">{totalCount}</p><p className="text-xs text-muted-foreground">Toplam Yazı</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
              <div><p className="text-2xl font-bold">{blogs.filter(b => b.status === "published").length}</p><p className="text-xs text-muted-foreground">Bu sayfada yayında</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
              <div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">Onay Bekliyor</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center"><Sparkles className="w-5 h-5 text-purple-600" /></div>
              <div><p className="text-2xl font-bold">{refreshedToday}</p><p className="text-xs text-muted-foreground">Bugün güncellenen</p></div>
            </div>
          </CardContent></Card>
        </div>

        {/* Günlük içerik tazeleme + son güncellenenler */}
        <div className="grid gap-4 lg:grid-cols-2 mb-6">
          <Card className="border-purple-200 bg-purple-50/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-purple-600" /> Günlük İçerik Tazeleme
              </CardTitle>
              <CardDescription>
                Her gün otomatik olarak en eski 3 yazıya konusuyla ilgili 100-200 kelimelik yeni bölüm eklenir ve
                yayın tarihi bugüne çekilir. Sıra en eski yazıdan başlar.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => runRefresh()}
                disabled={refreshing}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Şimdi 3 Eski Yazıyı Güncelle
              </Button>
              <span className="text-xs text-muted-foreground">Otomatik çalışma saati: her gün 09:00 (TR)</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><History className="w-5 h-5" /> Son Yapılan Güncellemeler</CardTitle>
              <CardDescription>İçeriğine yeni bölüm eklenen ve tarihi güncellenen son yazılar</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[240px] overflow-y-auto space-y-2">
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz güncelleme yapılmadı.</p>
              ) : (
                recent.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(r.last_refreshed_at)} · {r.refresh_count || 1}. güncelleme · {r.word_count || 0} kelime
                      </p>
                    </div>
                    {r.slug && (
                      <a
                        href={`https://doktorumol.com.tr/blog/${r.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline whitespace-nowrap inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Gör
                      </a>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Araç çubuğu */}
        <Card className="mb-4">
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <form
              className="relative flex-1 min-w-[240px]"
              onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }}
            >
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Başlıkta ara ve Enter'a bas..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </form>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="published">Yayınlandı</SelectItem>
                <SelectItem value="pending">Onay Bekliyor</SelectItem>
                <SelectItem value="revision_needed">Düzeltme Gerekli</SelectItem>
                <SelectItem value="draft">Taslak</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">En yeni yayınlananlar</SelectItem>
                <SelectItem value="oldest">En eski yayınlananlar</SelectItem>
                <SelectItem value="least_refreshed">Hiç güncellenmemişler</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedBlogs.length > 0 && (
          <Card className="mb-4 p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-medium">{selectedBlogs.length} blog seçildi</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => runRefresh(selectedBlogs)} disabled={refreshing}>
                  {refreshing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                  Seçilenleri Güncelle
                </Button>
                {!isStaff && (
                  <Button size="sm" onClick={handleBulkApprove} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700">
                    Toplu Onayla
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={isProcessing}>
                  <Trash2 className="w-4 h-4 mr-1" /> Toplu Sil
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card>
          {loading ? (
            <div className="p-10 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" /> Blog yazıları yükleniyor...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox checked={selectedBlogs.length === blogs.length && blogs.length > 0} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Yazar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Yayın Tarihi</TableHead>
                  <TableHead>Güncelleme</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Kayıt bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  blogs.map((blog) => (
                    <TableRow key={blog.id} className="hover:bg-muted/40">
                      <TableCell>
                        <Checkbox checked={selectedBlogs.includes(blog.id)} onCheckedChange={() => toggleSelectBlog(blog.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {blog.featured_image && (
                            <img src={blog.featured_image} alt={blog.title} className="w-16 h-12 object-cover rounded flex-shrink-0" />
                          )}
                          <div className="max-w-md min-w-0">
                            <p className="font-medium line-clamp-1">{blog.title}</p>
                            {blog.excerpt && <p className="text-sm text-muted-foreground line-clamp-1">{blog.excerpt}</p>}
                            {blog.slug && (
                              <div className="flex items-center gap-1 mt-1">
                                <a
                                  href={`https://doktorumol.com.tr/blog/${blog.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline truncate max-w-[260px] inline-flex items-center gap-1"
                                  title={`https://doktorumol.com.tr/blog/${blog.slug}`}
                                >
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" /> /blog/{blog.slug}
                                </a>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(`https://doktorumol.com.tr/blog/${blog.slug}`);
                                    toast({ title: "Link kopyalandı", description: "Blog linki panoya kopyalandı." });
                                  }}
                                  title="Linki kopyala"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{blog.author_type === "specialist" ? blog.author_name : "Editör"}</p>
                          {blog.specialists && <p className="text-xs text-muted-foreground">{blog.specialists.name}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(blog.status)}>{getStatusText(blog.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(blog.published_at || blog.created_at)}</p>
                          {blog.word_count && <p className="text-xs text-muted-foreground">{blog.word_count} kelime</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {blog.last_refreshed_at ? (
                          <div className="text-xs">
                            <Badge variant="secondary" className="mb-1">{blog.refresh_count || 1}x güncellendi</Badge>
                            <p className="text-muted-foreground">{formatDate(blog.last_refreshed_at)}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Bu yazıyı AI ile güncelle"
                            onClick={() => runRefresh([blog.id])}
                            disabled={refreshing}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <Sparkles className="w-4 h-4" />
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                              <DialogHeader><DialogTitle>{blog.title}</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                {blog.featured_image && (
                                  <img src={blog.featured_image} alt={blog.title} className="w-full max-h-64 object-cover rounded" />
                                )}
                                {blog.excerpt && <p className="text-muted-foreground">{blog.excerpt}</p>}
                                <SafeHtmlContent content={blog.content || ""} className="prose max-w-none text-sm" />
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

                          {(userProfile?.role === "admin" || userProfile?.role === "staff") && (
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(blog)} disabled={isProcessing}>
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
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedBlog(blog)}
                                    className="text-amber-600 hover:text-amber-700"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader><DialogTitle>Düzeltme Mesajı Gönder</DialogTitle></DialogHeader>
                                  <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                      <strong>{blog.title}</strong> için düzeltme mesajı yazın:
                                    </p>
                                    <Textarea
                                      value={adminMessage}
                                      onChange={(e) => setAdminMessage(e.target.value)}
                                      placeholder="Örnek: Bu kısımda kaynak belirtmeniz gerekiyor..."
                                      rows={4}
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <Button variant="outline" onClick={() => { setAdminMessage(""); setSelectedBlog(null); }}>
                                        İptal
                                      </Button>
                                      <Button onClick={() => handleRequestRevision(blog.id)} disabled={isProcessing || !adminMessage.trim()}>
                                        {isProcessing ? "Gönderiliyor..." : "Gönder"}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}

                          {(userProfile?.role === "admin" || userProfile?.role === "staff") && (
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
          )}

          {totalCount > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Toplam {totalCount} blog yazısı, sayfa {currentPage} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1 || loading} onClick={() => fetchBlogs(currentPage - 1)}>
                  Önceki
                </Button>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages || loading} onClick={() => fetchBlogs(currentPage + 1)}>
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Düzenleme Modalı */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Blog Yazısını Düzenle</DialogTitle></DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                {blogFormFields(editForm, "edit")}
                <div className="flex gap-2 justify-end sticky bottom-0 bg-background py-3 border-t">
                  <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingBlog(null); }}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={isProcessing}>{isProcessing ? "Güncelleniyor..." : "Güncelle"}</Button>
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
