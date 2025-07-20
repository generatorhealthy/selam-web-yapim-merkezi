
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReviewFormProps {
  doctorId: string;
  doctorName: string;
  onReviewSubmitted?: () => void;
}

const ReviewForm = ({ doctorId, doctorName, onReviewSubmitted }: ReviewFormProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Hata",
        description: "Lütfen bir puan verin.",
        variant: "destructive",
      });
      return;
    }

    if (!doctorId) {
      toast({
        title: "Hata",
        description: "Uzman bilgisi bulunamadı.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Değerlendirme gönderiliyor:', {
        specialist_id: doctorId,
        reviewer_name: `${firstName} ${lastName}`,
        reviewer_email: email,
        comment,
        rating,
        status: 'pending'
      });

      const { error } = await supabase
        .from('reviews')
        .insert({
          specialist_id: doctorId,
          reviewer_name: `${firstName} ${lastName}`,
          reviewer_email: email,
          comment,
          rating,
          status: 'pending'
        });

      if (error) {
        console.error('Değerlendirme gönderilirken hata:', error);
        throw error;
      }

      console.log('Değerlendirme başarıyla gönderildi');

      // Form temizle
      setFirstName("");
      setLastName("");
      setEmail("");
      setComment("");
      setRating(0);

      toast({
        title: "Başarılı",
        description: "Değerlendirmeniz gönderildi. Admin onayından sonra yayınlanacaktır.",
      });

      // Parent component'e bildir
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      console.error('Değerlendirme gönderilirken hata:', error);
      toast({
        title: "Hata",
        description: "Değerlendirme gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isFilled = starValue <= (hoveredRating || rating);
      
      return (
        <Star
          key={i}
          className={`w-8 h-8 cursor-pointer transition-colors ${
            isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-400"
          }`}
          onClick={() => handleStarClick(starValue)}
          onMouseEnter={() => handleStarHover(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
        />
      );
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Değerlendirme Yap</CardTitle>
        <p className="text-sm text-gray-600">
          {doctorName} hakkında değerlendirmenizi paylaşın. 
          Değerlendirmeniz admin onayından sonra yayınlanacaktır.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                Ad *
              </label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Adınız"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                Soyad *
              </label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Soyadınız"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              E-posta Adresi *
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e-posta@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Puanınız *
            </label>
            <div className="flex items-center gap-1">
              {renderStars()}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {rating} / 5
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-2">
              Yorumunuz *
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Deneyiminizi paylaşın..."
              rows={4}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? "Gönderiliyor..." : "Değerlendirme Gönder"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
