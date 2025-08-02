import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DoctorRegistrationModal from "./DoctorRegistrationModal";

const FloatingWhatsAppButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session?.user);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  // Don't show the button if user is logged in
  if (isLoggedIn) {
    return null;
  }

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