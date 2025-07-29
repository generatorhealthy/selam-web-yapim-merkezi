
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Check, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Review {
  id: string;
  specialist_id: string;
  reviewer_name: string;
  reviewer_email: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
  specialists?: {
    name: string;
  };
}

const ReviewManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reviews from Supabase
  const { data: reviews = [], isLoading, error } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      console.log('Değerlendirmeler getiriliyor...');
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          specialists (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Değerlendirmeler getirilirken hata:', error);
        throw error;
      }

      console.log('Getirilen değerlendirmeler:', data);
      return data as Review[];
    },
  });

  // Approve review mutation
  const approveMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      console.log('Değerlendirme onaylanıyor:', reviewId);
      const { error } = await supabase
        .from('reviews')
        .update({ status: 'approved' })
        .eq('id', reviewId);

      if (error) {
        console.error('Onaylama hatası:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({
        title: "Başarılı",
        description: "Değerlendirme onaylandı.",
      });
    },
    onError: (error) => {
      console.error('Onaylama hatası:', error);
      toast({
        title: "Hata",
        description: "Değerlendirme onaylanırken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Reject review mutation
  const rejectMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      console.log('Değerlendirme reddediliyor:', reviewId);
      const { error } = await supabase
        .from('reviews')
        .update({ status: 'rejected' })
        .eq('id', reviewId);

      if (error) {
        console.error('Reddetme hatası:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({
        title: "Başarılı",
        description: "Değerlendirme reddedildi.",
      });
    },
    onError: (error) => {
      console.error('Reddetme hatası:', error);
      toast({
        title: "Hata",
        description: "Değerlendirme reddedilirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      console.log('Değerlendirme siliniyor:', reviewId);
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        console.error('Silme hatası:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({
        title: "Başarılı",
        description: "Değerlendirme silindi.",
      });
    },
    onError: (error) => {
      console.error('Silme hatası:', error);
      toast({
        title: "Hata",
        description: "Değerlendirme silinirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (reviewId: string) => {
    approveMutation.mutate(reviewId);
  };

  const handleReject = (reviewId: string) => {
    rejectMutation.mutate(reviewId);
  };

  const handleDelete = (reviewId: string) => {
    deleteMutation.mutate(reviewId);
  };

  const maskName = (name: string) => {
    if (!name || name.length <= 3) return name;
    const firstThree = name.substring(0, 3);
    return firstThree + '***';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Beklemede</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Onaylanmış</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Reddedilmiş</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <AdminBackButton />
            <h1 className="text-3xl font-bold text-gray-900">Değerlendirme Yönetimi</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <AdminBackButton />
            <h1 className="text-3xl font-bold text-gray-900">Değerlendirme Yönetimi</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">
            Değerlendirmeler yüklenirken bir hata oluştu.
          </div>
        </div>
      </div>
    );
  }

  const pendingReviews = reviews.filter(r => r.status === "pending");
  const approvedReviews = reviews.filter(r => r.status === "approved");
  const rejectedReviews = reviews.filter(r => r.status === "rejected");

  const ReviewTable = ({ reviewList, showActions = true }: { reviewList: Review[], showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Doktor</TableHead>
          <TableHead>Hasta</TableHead>
          <TableHead>E-posta</TableHead>
          <TableHead>Puan</TableHead>
          <TableHead>Yorum</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead>Durum</TableHead>
          {showActions && <TableHead>İşlemler</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviewList.map((review) => (
          <TableRow key={review.id}>
            <TableCell className="font-medium">
              {review.specialists?.name || 'Bilinmiyor'}
            </TableCell>
            <TableCell>{maskName(review.reviewer_name)}</TableCell>
            <TableCell className="text-sm text-gray-600">{review.reviewer_email}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {renderStars(review.rating)}
                <span className="ml-1 text-sm">{review.rating}</span>
              </div>
            </TableCell>
            <TableCell className="max-w-xs">
              <p className="truncate" title={review.comment}>
                {review.comment}
              </p>
            </TableCell>
            <TableCell className="text-sm text-gray-600">
              {formatDate(review.created_at)}
            </TableCell>
            <TableCell>
              {getStatusBadge(review.status)}
            </TableCell>
            {showActions && (
              <TableCell>
                <div className="flex items-center gap-2">
                  {review.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(review.id)}
                        className="text-green-600 hover:text-green-700"
                        disabled={approveMutation.isPending}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(review.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={rejectMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(review.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <AdminBackButton />
          <h1 className="text-3xl font-bold text-gray-900">Değerlendirme Yönetimi</h1>
          <p className="text-gray-600 mt-2">
            Hasta değerlendirmelerini onaylayın, reddedin veya silin.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingReviews.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Onaylanmış</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedReviews.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reddedilmiş</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedReviews.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Bekleyen ({pendingReviews.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Onaylanmış ({approvedReviews.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Reddedilmiş ({rejectedReviews.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              Tümü ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Onay Bekleyen Değerlendirmeler</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingReviews.length > 0 ? (
                  <ReviewTable reviewList={pendingReviews} />
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Onay bekleyen değerlendirme bulunmuyor.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Onaylanmış Değerlendirmeler</CardTitle>
              </CardHeader>
              <CardContent>
                {approvedReviews.length > 0 ? (
                  <ReviewTable reviewList={approvedReviews} showActions={false} />
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Onaylanmış değerlendirme bulunmuyor.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle>Reddedilmiş Değerlendirmeler</CardTitle>
              </CardHeader>
              <CardContent>
                {rejectedReviews.length > 0 ? (
                  <ReviewTable reviewList={rejectedReviews} showActions={false} />
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Reddedilmiş değerlendirme bulunmuyor.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Tüm Değerlendirmeler</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewTable reviewList={reviews} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReviewManagement;
