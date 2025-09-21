import { Check } from "lucide-react";
import { Card } from "./ui/card";

interface FeatureBoxProps {
  title: string;
  variant?: "default" | "highlight";
}

export const FeatureBox = ({ title, variant = "default" }: FeatureBoxProps) => {
  const isHighlight = variant === "highlight";
  
  return (
    <Card className={`
      p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-md
      ${isHighlight 
        ? "bg-primary/10 border-primary/30 hover:bg-primary/15" 
        : "bg-white border-gray-200 hover:border-primary/40"
      }
    `}>
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isHighlight 
          ? "bg-primary text-white" 
          : "bg-primary/10"
        }
      `}>
        <Check className={`w-5 h-5 ${isHighlight ? "text-white" : "text-primary"}`} />
      </div>
      
      <span className={`
        font-medium text-sm
        ${isHighlight ? "text-primary" : "text-gray-700"}
      `}>
        {title}
      </span>
    </Card>
  );
};