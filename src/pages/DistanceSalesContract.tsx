import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

const DistanceSalesContract = () => {
  return (
    <>
      <Helmet>
        <title>Mesafeli Satış Sözleşmesi - Doktorum Ol</title>
        <meta name="description" content="Doktorum Ol mesafeli satış sözleşmesi ve satış koşulları hakkında detaylı bilgi alın." />
        <meta name="keywords" content="mesafeli satış, sözleşme, satış koşulları, doktorum ol" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <HorizontalNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Mesafeli Satış Sözleşmesi</h1>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="prose max-w-none text-gray-700 leading-relaxed">
                <p className="text-center text-lg">
                  Bu sayfa içeriği hazırlanmaktadır. Detaylı bilgi için lütfen bizimle iletişime geçin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DistanceSalesContract;
