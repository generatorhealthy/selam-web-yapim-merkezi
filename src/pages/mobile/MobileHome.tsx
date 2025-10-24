import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { Search, Calendar, TestTube2, Star, Heart, Brain, Sparkles, Users, UserPlus, Quote, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Test {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  specialty_area: string;
}

interface Review {
  id: string;
  reviewer_name: string;
  comment: string;
  rating: number;
  created_at: string;
  specialist_id: string;
  specialists: {
    name: string;
    specialty: string;
  };
}

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  profile_picture: string;
  rating: number;
  reviews_count: number;
  experience: number;
  city: string;
}

export default function MobileHome() {
  const navigate = useNavigate();
  const { userProfile } = useUserRole();
  const [tests, setTests] = useState<Test[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch tests
      const { data: testsData } = await supabase
        .from('tests')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'approved')
        .limit(6);

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          specialists (
            name,
            specialty
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch specialists - randomize on every load
      const { data: specialistsData } = await supabase
        .from('specialists')
        .select('*')
        .eq('is_active', true)
        .limit(20);

      if (testsData) setTests(testsData);
      if (reviewsData) setReviews(reviewsData as any);
      if (specialistsData) {
        // Randomize specialists
        const shuffled = [...specialistsData].sort(() => Math.random() - 0.5);
        setSpecialists(shuffled.slice(0, 6));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Uzman Ara",
      icon: Search,
      description: "Size en uygun uzmanı bulun",
      action: () => navigate("/mobile/search"),
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Randevu Al",
      icon: Calendar,
      description: "Hemen randevu oluşturun",
      action: () => navigate("/mobile/search"),
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Test Yap",
      icon: TestTube2,
      description: "Psikolojik değerlendirme testleri",
      action: () => navigate("/mobile/tests"),
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  const popularCategories = [
    { 
      name: "Psikolog", 
      icon: Brain, 
      count: "45+ Uzman",
      gradient: "from-blue-500 to-indigo-600"
    },
    { 
      name: "Aile Danışmanı", 
      icon: Heart, 
      count: "30+ Uzman",
      gradient: "from-pink-500 to-rose-600"
    },
    { 
      name: "Psikolojik Danışman", 
      icon: Star, 
      count: "25+ Uzman",
      gradient: "from-amber-500 to-orange-600"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 rounded-b-[2rem] mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary">Hoş Geldiniz</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">
          Merhaba {userProfile?.name || 'Kullanıcı'}! 👋
        </h1>
        <p className="text-muted-foreground">Size nasıl yardımcı olabiliriz?</p>
      </div>

      <div className="px-4 pb-20 space-y-6">
        {/* Uzman Olarak Kayıt Ol - Fixed Button */}
        <Card 
          className="cursor-pointer bg-gradient-to-r from-amber-500 to-orange-500 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          onClick={() => navigate("/packages")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-white">Uzman Olarak Kayıt Ol</h3>
              <p className="text-sm text-white/90">Platformumuza katılın</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white" />
          </CardContent>
        </Card>

        {/* Psikolojik Testler */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Psikolojik Testler</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={() => navigate("/mobile/search")}
            >
              Tümünü Gör
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-48 animate-pulse bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {tests.map((test) => (
                <Card
                  key={test.id}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-md overflow-hidden"
                  onClick={() => navigate(`/test/${test.id}`)}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                    {test.image_url ? (
                      <img 
                        src={test.image_url} 
                        alt={test.title}
                        className="w-20 h-20 object-contain"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                        <TestTube2 className="w-10 h-10 text-primary" />
                      </div>
                    )}
                    <div className="space-y-2 flex-1">
                      <h3 className="font-bold text-sm line-clamp-2">{test.title}</h3>
                      {test.category && (
                        <Badge variant="secondary" className="text-xs">
                          {test.category}
                        </Badge>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full bg-white text-primary border border-primary hover:bg-primary hover:text-white"
                    >
                      Teste Başlayın
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Danışan Yorumları */}
        {reviews.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Danışan Yorumları</h2>
            </div>
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card key={review.id} className="shadow-md border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Quote className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{review.reviewer_name}</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {review.comment}
                        </p>
                        {review.specialists && (
                          <p className="text-xs text-primary font-medium">
                            {review.specialists.name} - {review.specialists.specialty}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Uzmanlarımız */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Uzmanlarımız</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={() => {
                fetchData(); // Refresh to randomize
              }}
            >
              Yenile
            </Button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-24 animate-pulse bg-muted" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {specialists.map((specialist) => (
                <Card
                  key={specialist.id}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-md"
                  onClick={() => navigate(`/mobile/specialist/${specialist.id}`)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-14 h-14 border-2 border-primary/20">
                        <AvatarImage src={specialist.profile_picture} alt={specialist.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                          {specialist.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{specialist.name}</h3>
                      <p className="text-sm text-muted-foreground">{specialist.specialty}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-medium">{specialist.rating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {specialist.experience} yıl deneyim
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions - Moved to bottom */}
        <div className="space-y-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.title}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-md overflow-hidden"
                onClick={action.action}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-5`} />
                <CardContent className="p-4 flex items-center gap-4 relative">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${action.gradient} shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Popular Categories */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Popüler Kategoriler</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={() => navigate("/mobile/search")}
            >
              Tümü
            </Button>
          </div>
          <div className="space-y-3">
            {popularCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.name}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-md overflow-hidden"
                  onClick={() => navigate(`/mobile/search?specialty=${category.name}`)}
                >
                  <CardContent className="p-4 flex items-center justify-between relative">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 bg-gradient-to-br ${category.gradient} rounded-2xl shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {category.count}
                        </p>
                      </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${category.gradient} text-white text-sm font-medium`}>
                      Gör
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}