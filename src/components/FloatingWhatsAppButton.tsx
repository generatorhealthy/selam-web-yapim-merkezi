import { MessageCircle } from "lucide-react";
import { useState } from "react";
import DoctorRegistrationModal from "./DoctorRegistrationModal";

const FloatingWhatsAppButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 font-medium text-sm md:text-base"
        aria-label="Doktor Kayıt Formu"
      >
        <MessageCircle size={20} />
        <span>Kayıt Formu</span>
      </button>
      <DoctorRegistrationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default FloatingWhatsAppButton;