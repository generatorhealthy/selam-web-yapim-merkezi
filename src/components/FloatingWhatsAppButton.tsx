import { MessageCircle } from "lucide-react";

const FloatingWhatsAppButton = () => {
  const handleClick = () => {
    window.open('https://wa.me/905515045454', '_blank');
  };

  return (
    <button 
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 font-medium text-sm md:text-base"
      aria-label="WhatsApp İletişim"
    >
      <MessageCircle size={20} />
      <span>WhatsApp</span>
    </button>
  );
};

export default FloatingWhatsAppButton;