import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Check } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  step_number: number;
  is_required: boolean;
}

export default function MobileTestTaker() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [step, setStep] = useState(0); // 0 = info, 1..N = questions, N+1 = patient info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: qs }] = await Promise.all([
        supabase.from("tests").select("*").eq("id", testId).maybeSingle(),
        supabase.from("test_questions").select("*").eq("test_id", testId).order("step_number"),
      ]);
      setTest(t);
      setQuestions((qs as Question[]) || []);
      setLoading(false);
    })();
  }, [testId]);

  const totalSteps = questions.length + 1; // +1 for patient info at end
  const isPatientStep = step === questions.length;
  const currentQ = !isPatientStep && step >= 0 && step < questions.length ? questions[step] : null;

  const setAnswer = (qId: string, value: any) => setAnswers((a) => ({ ...a, [qId]: value }));

  const next = () => {
    if (currentQ?.is_required && !answers[currentQ.id]) {
      toast({ title: "Cevap gerekli", variant: "destructive" });
      return;
    }
    setStep((s) => s + 1);
  };

  const submit = async () => {
    if (!name || !email) {
      toast({ title: "Bilgileriniz gerekli", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("test_results").insert([{
      test_id: testId!,
      specialist_id: test?.specialist_id || "00000000-0000-0000-0000-000000000000",
      patient_name: name,
      patient_email: email,
      answers,
      specialty_area: test?.specialty_area,
      status: "pending",
    }]);
    setSubmitting(false);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Test gönderildi", description: "Sonuçlar e-postanıza gelecek" });
      navigate("/mobile/home");
    }
  };

  if (loading) {
    return (
      <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }}>
        <MobileHeader showBack title="Test" />
        <div className="px-5 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "hsl(var(--m-surface-muted))" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
      <MobileHeader showBack title={test?.title || "Test"} />

      {/* Progress */}
      <div className="px-5 mb-4">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--m-divider))" }}>
          <div
            className="h-full transition-all"
            style={{
              width: `${((step + 1) / (totalSteps + 1)) * 100}%`,
              background: "hsl(var(--m-accent))",
            }}
          />
        </div>
        <div className="text-[12px] mt-2" style={{ color: "hsl(var(--m-text-secondary))" }}>
          {isPatientStep ? "Son adım" : `Soru ${step + 1} / ${questions.length}`}
        </div>
      </div>

      <div className="px-5">
        {currentQ && (
          <div className="m-card p-5">
            <h2 className="text-[18px] font-semibold mb-4" style={{ color: "hsl(var(--m-text-primary))" }}>
              {currentQ.question_text}
            </h2>
            {Array.isArray(currentQ.options) && currentQ.options.length > 0 ? (
              <div className="space-y-2">
                {currentQ.options.map((opt: any, i: number) => {
                  const val = typeof opt === "string" ? opt : opt.text || opt.value || JSON.stringify(opt);
                  const sel = answers[currentQ.id] === val;
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswer(currentQ.id, val)}
                      className="w-full p-3 rounded-2xl text-left flex items-center justify-between m-pressable"
                      style={{
                        background: sel ? "hsl(var(--m-accent-soft))" : "hsl(var(--m-surface-muted))",
                        borderWidth: 2,
                        borderStyle: "solid",
                        borderColor: sel ? "hsl(var(--m-accent))" : "transparent",
                      }}
                    >
                      <span className="text-[14px]" style={{ color: "hsl(var(--m-text-primary))" }}>{val}</span>
                      {sel && <Check className="w-5 h-5" style={{ color: "hsl(var(--m-accent))" }} />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={answers[currentQ.id] || ""}
                onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                placeholder="Cevabınız..."
                rows={4}
                className="w-full p-3 rounded-2xl outline-none text-[14px]"
                style={{ background: "hsl(var(--m-surface-muted))", color: "hsl(var(--m-text-primary))" }}
              />
            )}
          </div>
        )}

        {isPatientStep && (
          <div className="space-y-3">
            <div className="m-card p-4 text-center">
              <p className="text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
                Sonuçlarınız için bilgilerinizi girin
              </p>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ad Soyad"
              className="w-full h-12 px-4 rounded-2xl text-[15px] outline-none"
              style={{ background: "hsl(var(--m-surface))", color: "hsl(var(--m-text-primary))", boxShadow: "var(--m-shadow)" }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
              className="w-full h-12 px-4 rounded-2xl text-[15px] outline-none"
              style={{ background: "hsl(var(--m-surface))", color: "hsl(var(--m-text-primary))", boxShadow: "var(--m-shadow)" }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="fixed bottom-0 left-0 right-0 m-glass px-5 pt-3 flex gap-2"
        style={{
          paddingBottom: "calc(12px + var(--m-safe-bottom))",
          borderTop: "1px solid hsl(var(--m-divider))",
        }}
      >
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 h-12 rounded-2xl font-semibold m-pressable"
            style={{ background: "hsl(var(--m-surface-muted))", color: "hsl(var(--m-text-primary))" }}
          >
            Geri
          </button>
        )}
        <button
          disabled={submitting}
          onClick={() => (isPatientStep ? submit() : next())}
          className="flex-[2] h-12 rounded-2xl font-semibold m-pressable disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: "hsl(var(--m-accent))", color: "white" }}
        >
          {isPatientStep ? (submitting ? "Gönderiliyor..." : "Gönder") : "İleri"}
          {!isPatientStep && <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
