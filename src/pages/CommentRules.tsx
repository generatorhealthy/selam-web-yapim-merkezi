import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

const CommentRules = () => {
  return (
    <>
      <Helmet>
        <title>Yorum Yayınlama Kuralları - Doktorum Ol</title>
        <meta name="description" content="Doktorum Ol platformunda yorum yapma kuralları ve değerlendirme kriterleri hakkında bilgi alın." />
        <meta name="keywords" content="yorum kuralları, değerlendirme, doktor yorumu, platform kuralları" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <HorizontalNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Yorum Yayınlama Kuralları</h1>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="prose max-w-none text-gray-700 leading-relaxed space-y-6">
                <p>
                  İşbu Yorum Yayınlanma Kuralları ("Kurallar") ile, doktorumol.com.tr ("Şirket") olarak, doktorlar ("Doktor(lar)") ile gerçekleştirdiğiniz görüşmelere ilişkin Şirket'in sahibi olduğu www.doktorumol.com.tr alan adlı internet sitesi ("İnternet Sitesi") üzerinden görüş ve önerilerinizi paylaşabileceğiniz, ilgili Doktor'a gitmeyi düşünenler için giden üyelerin ("Üye") Doktor hakkındaki düşüncelerini öğrenebilecekleri dürüst bir platform yaratmayı amaçlamaktayız.
                </p>

                <p>
                  Bu itibarla görüşme gerçekleştirdiğiniz Doktor'a ilişkin yorumları yayınlarken olumlu ya da olumsuz olduğuna bakılmaksızın, ilgili yorumlar bakımından gerekli incelemeleri yapıp;
                </p>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Yayınlanacak yorumlar şu kriterleri karşılamalıdır:</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Doktor/uzmanın ve/veya kullandığı/uyguladığı tanı-tedavi yönteminin, mesleki becerisinin sınanmasına dair ifade içermeyen</li>
                    <li>Genel ahlaka ve kamu düzenine aykırı olmayan</li>
                    <li>Kişilik haklarını ihlal etmeyen</li>
                    <li>Fikri/sınai hakları ihlal etmeyen</li>
                    <li>6502 sayılı Tüketicinin Korunması Hakkında Kanun, 10.01.2015 tarihli ve 29232 sayılı Resmî Gazete'de yayımlanan Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği'ne ve sair mevzuatlara uygun</li>
                    <li>Haksız rekabet yaratmayan</li>
                    <li>Hakaret/küfür/tehdit/müstehcenlik/suç unsuru içermeyen</li>
                    <li>İlgili Doktor ile alakasız olmayan</li>
                    <li>Başkalarına dair kişisel verileri ya da özel hayatın gizliliğini ihlal etmeyen</li>
                    <li>Hukuka aykırı bir durumu teşvik etmeyen/desteklemeyen</li>
                    <li>Diğer Üyeler'in yorumlarına cevap niteliğinde taciz/utandırıcı/kışkırtıcı nitelikte olmayan</li>
                    <li>Farklı internet sitelerine yönlendirmeyen</li>
                    <li>Link, reklam veya karşılaştırma içermeyen</li>
                    <li>İlgili mevzuatına aykırı sağlık beyanı içermeyen</li>
                  </ul>
                </div>

                <p>
                  İlgili yorumlar olumlu ya da olumsuz olduğuna bakılmaksızın en az 1 (bir) yıl süreyle herhangi bir yönlendirme yapılmadan tarih, değerlendirme notu gibi objektif bir ölçüte göre İnternet Sitesi'nde yayınlanacaktır.
                </p>

                <p>
                  Üyeler'in, değerlendirmelerinin yayınlanması için bir rumuz (nick name) kullanmaları durumunda söz konusu rumuz, yürürlükteki mevzuata ve ahlaka aykırı olamaz; hakaret, küfür, sövme, aşağılayıcı, kişilik haklarına zarar veren sözler içeremez.
                </p>

                <p>
                  Tüm Üyelerimiz'in doğru yönlendirilmesi amacıyla yalnızca ilgili Doktor'la görüşme gerçekleştirmiş Üyelerimiz yorum yapmalıdır. İlgili Doktor'a ilişkin yapmış olduğunuz bir yorum mevzuata ya da yukarıda belirtilen Kurallar'a aykırı ise yayınlanmayacağını veya bir tespit sonucunda platformdan kaldırılabileceğini, böyle bir durumda sizleri bilgilendireceğimizi belirtmek isteriz. Eğer yapmış olduğunuz değerlendirmenin haksız yere kaldırıldığını ya da yayınlanmadığını düşünüyorsanız bizlerle e-posta aracılığıyla iletişime geçebilirsiniz. Bu kapsamda taleplerinizi info@doktorumol.com.tr adresine iletebilirsiniz.
                </p>

                <p>
                  Şirket, işbu Kurallar'ı hiçbir şekil ve surette ön ihbara ve/veya ihtara gerek kalmaksızın her zaman güncelleyebilir, değiştirebilir veya yürürlükten kaldırabilir. Güncellenen, değiştirilen ya da yürürlükten kaldırılan her hüküm, yayın tarihinde Üye için hüküm ifade edecektir.
                </p>

                <p className="font-semibold">Bilgilerinize sunarız</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default CommentRules;
