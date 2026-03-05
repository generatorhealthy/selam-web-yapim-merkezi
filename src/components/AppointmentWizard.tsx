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
  { value: "self" as WhoOption, label: "Bireysel destek almak istiyorum", icon: <User className="w-5 h-5" /> },
  { value: "couple" as WhoOption, label: "Partnerimle birlikte destek almak istiyorum", icon: <Users className="w-5 h-5" /> },
  { value: "child" as WhoOption, label: "Çocuğum veya gencim için destek arıyorum", icon: <Baby className="w-5 h-5" /> },
];

const topicOptions: TopicOption[] = [
  { 
    id: "behavior", 
    label: "Alışkanlıklarımı değiştirmekte güçlük çekiyorum", 
    description: "Bağımlılık eğilimleri, dürtüsel davranışlar veya yeme problemleri",
    icon: <Shield className="w-5 h-5" />
  },
  { 
    id: "anxiety", 
    label: "Kaygı, stres veya mutsuzlukla mücadele ediyorum", 
    description: "Depresif belirtiler, yorgunluk hissi veya uyku sorunları",
    icon: <Frown className="w-5 h-5" />
  },
  { 
    id: "mood", 
    label: "Duygusal dalgalanmalar yaşıyorum", 
    description: "Ani ruh hali değişimleri, içsel boşluk veya kendinden uzaklaşma hissi",
    icon: <Brain className="w-5 h-5" />
  },
  { 
    id: "trauma", 
    label: "Ağır bir süreçten geçtim", 
    description: "Kayıp, travmatik olay veya hayatımda büyük bir dönüm noktası",
    icon: <Heart className="w-5 h-5" />
  },
  { 
    id: "relationship", 
    label: "İlişkilerimde sorunlar yaşıyorum", 
    description: "Eş, çocuk veya aile bireyleriyle yaşanan zorluklar",
    icon: <HandHeart className="w-5 h-5" />
  },
  { 
    id: "selfgrowth", 
    label: "Kişisel gelişimime yatırım yapmak istiyorum", 
    description: "Kendini keşfetme, özgüven geliştirme veya potansiyelini açığa çıkarma",
    icon: <Sparkles className="w-5 h-5" />
  },
  { 
    id: "other", 
    label: "Farklı bir konu hakkında destek almak istiyorum", 
    description: "",
    icon: <HelpCircle className="w-5 h-5" />
  },
];

const formatOptions = [
  { value: "no-preference" as FormatOption, label: "Fark etmez", icon: null },
  { value: "face-to-face" as FormatOption, label: "Klinikte yüz yüze görüşme", icon: <Building2 className="w-5 h-5" /> },
  { value: "online" as FormatOption, label: "Online görüşme", icon: <Monitor className="w-5 h-5" /> },
];

export default function AppointmentWizard({ open, onOpenChange, initialCity }: AppointmentWizardProps) {
  const [step, setStep] = useState(1);
  const [who, setWho] = useState<WhoOption | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [format, setFormat] = useState<FormatOption | null>(null);
  const navigate = useNavigate();

  const totalSteps = 3;

  const finishWizard = () => {
    const params = new URLSearchParams();
    if (format === "online") params.set("appointmentType", "online");
    else if (format === "face-to-face") params.set("appointmentType", "yüzyüze");
    if (initialCity) params.set("city", initialCity);
    if (who === "couple") params.set("specialty", "aile-danismani");
    if (who === "child") params.set("specialty", "cocuk-psikoloji");
    if (selectedTopics.length > 0) {
      params.set("topics", selectedTopics.join(","));
    }
    
    onOpenChange(false);
    resetWizard();
    navigate(`/uzmanlar?${params.toString()}`);
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      finishWizard();
    }
  };

  const handleSelectWho = (value: WhoOption) => {
    setWho(value);
    setTimeout(() => setStep(2), 300);
  };

  const handleSelectFormat = (value: FormatOption) => {
    setFormat(value);
    setTimeout(() => {
      const params = new URLSearchParams();
      if (value === "online") params.set("appointmentType", "online");
      else if (value === "face-to-face") params.set("appointmentType", "yüzyüze");
      if (initialCity) params.set("city", initialCity);
      if (who === "couple") params.set("specialty", "aile-danismani");
      if (who === "child") params.set("specialty", "cocuk-psikoloji");
      if (selectedTopics.length > 0) {
        params.set("topics", selectedTopics.join(","));
      }
      onOpenChange(false);
      resetWizard();
      navigate(`/uzmanlar?${params.toString()}`);
    }, 300);
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
                  i < step ? "bg-primary" : "bg-muted"
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
              <h2 className="text-xl font-bold text-center text-foreground">
                Bu desteğe kim ihtiyaç duyuyor?
              </h2>
              <div className="space-y-3 mt-6">
                {whoOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setWho(option.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all duration-200 text-left",
                      who === option.value
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-transparent bg-primary/5 hover:bg-primary/10 hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        who === option.value ? "border-primary" : "border-muted-foreground/40"
                      )}>
                        {who === option.value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <span className="font-medium text-foreground">{option.label}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
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
                <h2 className="text-xl font-bold text-foreground">
                  Hangi alanda profesyonel destek arıyorsunuz?
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Sizin için geçerli olanları işaretleyin</p>
              </div>
              <div className="space-y-3 mt-6">
                {topicOptions.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    className={cn(
                      "w-full flex items-start gap-3 px-5 py-4 rounded-xl border-2 transition-all duration-200 text-left",
                      selectedTopics.includes(topic.id)
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-transparent bg-primary/5 hover:bg-primary/10 hover:border-primary/30"
                    )}
                  >
                    <div className="mt-0.5">
                      <Checkbox 
                        checked={selectedTopics.includes(topic.id)} 
                        className="border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-foreground block">{topic.label}</span>
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
              <h2 className="text-xl font-bold text-center text-foreground">
                Görüşme şeklinizi nasıl tercih edersiniz?
              </h2>
              <div className="space-y-3 mt-6">
                {formatOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormat(option.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all duration-200 text-left",
                      format === option.value
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-transparent bg-primary/5 hover:bg-primary/10 hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        format === option.value ? "border-primary" : "border-muted-foreground/40"
                      )}>
                        {format === option.value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <span className="font-medium text-foreground">{option.label}</span>
                    </div>
                    {option.icon && (
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
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
              className="text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 rounded-xl"
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
