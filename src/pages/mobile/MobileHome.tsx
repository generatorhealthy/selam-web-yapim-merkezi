import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { Search, Calendar, TestTube2, Star, Heart, Brain } from "lucide-react";

export default function MobileHome() {
  const navigate = useNavigate();
  const { userProfile } = useUserRole();

  const quickActions = [
    {
      title: "Uzman Ara",
      icon: Search,
      description: "Size en uygun uzmanı bulun",
      action: () => navigate("/mobile/search"),
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      title: "Randevu Al",
      icon: Calendar,
      description: "Hemen randevu oluşturun",
      action: () => navigate("/mobile/search"),
      color: "bg-green-500/10 text-green-600"
    },
    {
      title: "Test Yap",
      icon: TestTube2,
      description: "Psikolojik değerlendirme testleri",
      action: () => navigate("/mobile/tests"),
      color: "bg-purple-500/10 text-purple-600"
    }
  ];

  const popularCategories = [
    { name: "Psikolog", icon: Brain, count: "45+ Uzman" },
    { name: "Aile Danışmanı", icon: Heart, count: "30+ Uzman" },
    { name: "Psikolojik Danışman", icon: Star, count: "25+ Uzman" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 pb-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Merhaba {userProfile?.name || 'Kullanıcı'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Size nasıl yardımcı olabiliriz?
          </p>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-6 pb-6">
        {/* Quick Actions */}
        <div className="grid gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.title}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={action.action}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${action.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Popular Categories */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground px-1">
            Popüler Kategoriler
          </h2>
          <div className="grid gap-3">
            {popularCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.name}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/mobile/search?specialty=${category.name}`)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.count}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Gör
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-5 space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Profesyonel Destek
            </h3>
            <p className="text-sm text-muted-foreground">
              Uzman psikologlar ve danışmanlarla güvenli bir şekilde görüşebilir, 
              online veya yüz yüze seanslar alabilirsiniz.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
