import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { Search, Calendar, TestTube2, Star, Heart, Brain, Sparkles, Users } from "lucide-react";

export default function MobileHome() {
  const navigate = useNavigate();
  const { userProfile } = useUserRole();

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
        {/* Quick Actions */}
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

        {/* Featured Info Cards */}
        <div className="space-y-3">
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-md overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-primary/20 rounded-xl">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Profesyonel Destek</h3>
                  <p className="text-sm text-muted-foreground">
                    Alanında uzman psikolog ve danışmanlardan profesyonel destek alın.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20 shadow-md overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-purple-500/20 rounded-xl">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Güvenli & Gizli</h3>
                  <p className="text-sm text-muted-foreground">
                    Tüm görüşmeleriniz tamamen gizli ve güvenli ortamda gerçekleşir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}