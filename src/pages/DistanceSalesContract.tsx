import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeRichHtml } from "@/utils/sanitize";

const DistanceSalesContract = () => {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    supabase
      .from("form_contents")
      .select("content")
      .eq("form_type", "pre_info")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data?.content) setFailed(true);
        else setHtml(sanitizeRichHtml(data.content));
      });
  }, []);

  return (
    <>
      <Helmet>
        <title>Mesafeli Satış Sözleşmesi - Doktorum Ol</title>
        <meta name="description" content="Doktorum Ol üyelik hizmetlerine ilişkin mesafeli satış sözleşmesi, ücret, cayma, iptal ve iade koşulları." />
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <HorizontalNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Mesafeli Satış Sözleşmesi</h1>
              <p className="text-sm text-gray-500">Satın alma sırasında kişi ve paket bilgileriniz bu metne eklenerek onayınıza sunulur.</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-5 md:p-8">
              {html ? (
                <div className="prose max-w-none text-gray-700 leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: html }} />
              ) : failed ? (
                <p className="text-center">Sözleşme metni şu an yüklenemedi. Lütfen info@doktorumol.com.tr adresinden bize ulaşın.</p>
              ) : (
                <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DistanceSalesContract;
