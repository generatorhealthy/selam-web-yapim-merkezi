
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface AdminBackButtonProps {
  to?: string;
  label?: string;
}

const AdminBackButton = ({ to = "/divan_paneli/dashboard", label = "Geri Dön" }: AdminBackButtonProps) => {
  return (
    <Button variant="outline" size="sm" asChild className="mb-6">
      <Link to={to}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {label}
      </Link>
    </Button>
  );
};

export default AdminBackButton;
