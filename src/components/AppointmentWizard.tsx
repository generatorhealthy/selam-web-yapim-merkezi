import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, Users, Baby, Building2, Monitor, ArrowLeft, ArrowRight, 
  ChevronRight, Heart, Brain, Frown, Shield, HandHeart, Sparkles, HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCity?: string;
}

type WhoOption = "self" | "couple" | "child";
type FormatOption = "no-preference" | "face-to-face" | "online";

interface TopicOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const whoOptions = [
  { value: "self" as WhoOption, label: "Kendim için", icon: <User className="w-5 h-5" /> },
  { value: "couple" as WhoOption, label: "Kendim ve partnerim için", icon: <Users className="w-5 h-5" /> },
  { value: "child" as WhoOption, label: "Bir çocuk veya genç/ergen için.", icon: <Baby className="w-5 h-5" /> },
];

const topicOptions: TopicOption[] = [
  { 
    id: "behavior", 
    label: "Belirli davranışlarım ya da alışkanlıklarım konusunda zorlanıyorum", 
    description: "Bağımlılıklar, zorlayıcı davranışlar ya da beslenme problemleri",
    icon: <Shield className="w-5 h-5" />
  },
  { 
    id: "anxiety", 
    label: "Endişeli, bunalmış ya da mutsuz hissediyorum", 
    description: "Depresyon, tükenmişlik veya uykusuzluk",
    icon: <Frown className="w-5 h-5" />
  },
  { 
    id: "mood", 
    label: "Yoğun duygular ve ruh hali değişimleriyle zorlanıyorum", 
    description: "Aşırı iniş çıkışlar, kendini boşlukta veya kopuk hissetme",
    icon: <Brain className="w-5 h-5" />
  },
  { 
    id: "trauma", 
    label: "Zor bir deneyim yaşadım", 
    description: "Travma, yas, yaşamda büyük bir değişiklik",
    icon: <Heart className="w-5 h-5" />
  },
  { 
    id: "relationship", 
    label: "İlişkilerimde zorluklar yaşıyorum", 
    description: "Örneğin partner, çocuklar, aile ile",
    icon: <HandHeart className="w-5 h-5" />
  },
  { 
    id: "selfgrowth", 
    label: "Kendimi daha iyi anlamak/tanımak istiyorum", 
    description: "Özsaygı veya kişisel gelişim",
    icon: <Sparkles className="w-5 h-5" />
  },
  { 
    id: "other", 
    label: "Başka bir şey", 
    description: "",
    icon: <HelpCircle className="w-5 h-5" />
  },
];

const formatOptions = [
  { value: "no-preference" as FormatOption, label: "Tercihim yok", icon: null },
  { value: "face-to-face" as FormatOption, label: "Klinikte yüz yüze", icon: <Building2 className="w-5 h-5" /> },
  { value: "online" as FormatOption, label: "Online", icon: <Monitor className="w-5 h-5" /> },
];

export default function AppointmentWizard({ open, onOpenChange, initialCity }: AppointmentWizardProps) {
  const [step, setStep] = useState(1);
  const [who, setWho] = useState<WhoOption | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [format, setFormat] = useState<FormatOption | null>(null);
  const navigate = useNavigate();

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Navigate to results with filters
      const params = new URLSearchParams();
      if (format === "online") params.set("appointmentType", "online");
      else if (format === "face-to-face") params.set("appointmentType", "yüzyüze");
      if (initialCity) params.set("city", initialCity);
      if (who === "couple") params.set("specialty", "aile-danismani");
      if (who === "child") params.set("specialty", "cocuk-psikoloji");
      
      // Map topics to specialties for search
      const specialtyKeywords: string[] = [];
      if (who === "couple") {
        specialtyKeywords.push("Aile Danışmanı");
      }
      if (selectedTopics.length > 0) {
        params.set("topics", selectedTopics.join(","));
      }
      
      onOpenChange(false);
      resetWizard();
      navigate(`/uzmanlar?${params.toString()}`);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const resetWizard = () => {
    setStep(1);
    setWho(null);
    setSelectedTopics([]);
    setFormat(null);
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) ? prev.filter(t => t !== topicId) : [...prev, topicId]
    );
  };

  const canProceed = () => {
    if (step === 1) return who !== null;
    if (step === 2) return selectedTopics.length > 0;
    if (step === 3) return format !== null;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetWizard(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 rounded-2xl">
        {/* Progress bar */}
        <div className="px-6 pt-6">
          <div className="flex gap-2 mb-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  i < step ? "bg-teal-600" : "bg-gray-200"
                )} 
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-right">{step}/{totalSteps}</p>
        </div>

        <div className="px-6 pb-6 pt-2">
          {/* Step 1: Who */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center">
                Psikolojik desteği kimin için arıyorsunuz?
              </h2>
              <div className="space-y-3 mt-6">
                {whoOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setWho(option.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all duration-200 text-left",
                      who === option.value
                        ? "border-teal-600 bg-teal-50 shadow-sm"
                        : "border-transparent bg-teal-50/50 hover:bg-teal-50 hover:border-teal-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        who === option.value ? "border-teal-600" : "border-gray-300"
                      )}>
                        {who === option.value && <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />}
                      </div>
                      <span className="font-medium text-gray-800">{option.label}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center flex-shrink-0">
                      {option.icon}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Topics */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold">
                  Hangi konuda terapi desteği arıyorsunuz?
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Uygun olanları seçin</p>
              </div>
              <div className="space-y-3 mt-6">
                {topicOptions.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    className={cn(
                      "w-full flex items-start gap-3 px-5 py-4 rounded-xl border-2 transition-all duration-200 text-left",
                      selectedTopics.includes(topic.id)
                        ? "border-teal-600 bg-teal-50 shadow-sm"
                        : "border-transparent bg-teal-50/50 hover:bg-teal-50 hover:border-teal-200"
                    )}
                  >
                    <div className="mt-0.5">
                      <Checkbox 
                        checked={selectedTopics.includes(topic.id)} 
                        className="border-gray-300 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-800 block">{topic.label}</span>
                      {topic.description && (
                        <span className="text-sm text-muted-foreground">{topic.description}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Format */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center">
                Görüşmelerin yüz yüze mi yoksa online mı olmasını tercih edersiniz?
              </h2>
              <div className="space-y-3 mt-6">
                {formatOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormat(option.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all duration-200 text-left",
                      format === option.value
                        ? "border-teal-600 bg-teal-50 shadow-sm"
                        : "border-transparent bg-teal-50/50 hover:bg-teal-50 hover:border-teal-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        format === option.value ? "border-teal-600" : "border-gray-300"
                      )}>
                        {format === option.value && <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />}
                      </div>
                      <span className="font-medium text-gray-800">{option.label}</span>
                    </div>
                    {option.icon && (
                      <div className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center flex-shrink-0">
                        {option.icon}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className="text-gray-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-teal-600 hover:bg-teal-700 text-white px-8 rounded-xl"
            >
              {step === totalSteps ? "Uzmanları Göster" : "Devam Et"}
              {step === totalSteps ? <ChevronRight className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
