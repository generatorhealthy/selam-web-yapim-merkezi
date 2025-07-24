
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdminBackButtonProps {
  to?: string;
  label?: string;
}

const AdminBackButton = ({ to = "/divan_paneli/dashboard", label = "Geri Dön" }: AdminBackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(to);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className="mb-6">
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
};

export default AdminBackButton;
