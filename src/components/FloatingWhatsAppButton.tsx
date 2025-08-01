import { MessageCircle } from "lucide-react";

const FloatingWhatsAppButton = () => {
  const handleClick = () => {
    window.open("https://wa.me/902162350650", "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 font-medium text-sm md:text-base animate-pulse hover:animate-none"
      aria-label="WhatsApp ile Kayıt Formu"
    >
      <MessageCircle size={20} />
      <span className="hidden sm:inline">Kayıt Formu</span>
      <span className="sm:hidden">Kayıt</span>
    </button>
  );
};

export default FloatingWhatsAppButton;