import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import RegistrationForm from "./RegistrationForm";

const FloatingWhatsAppButton = () => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const isMobile = useIsMobile();

  // Sadece mobilde göster
  if (!isMobile) {
    return null;
  }

  const handleClick = () => {
    setIsRegistrationOpen(true);
  };

  return (
    <>
      <button 
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 font-medium text-sm md:text-base"
        aria-label="Kayıt Ol"
      >
        <MessageCircle size={20} />
        <span>Kayıt Ol</span>
      </button>
      
      <RegistrationForm 
        isOpen={isRegistrationOpen} 
        onClose={() => setIsRegistrationOpen(false)} 
      />
    </>
  );
};

export default FloatingWhatsAppButton;