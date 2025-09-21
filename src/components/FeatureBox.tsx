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
        ? "bg-blue-50 border-blue-200 hover:bg-blue-100" 
        : "bg-white border-gray-200 hover:border-blue-300"
      }
    `}>
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isHighlight 
          ? "bg-blue-500 text-white" 
          : "bg-blue-100"
        }
      `}>
        <Check className={`w-5 h-5 ${isHighlight ? "text-white" : "text-blue-500"}`} />
      </div>
      
      <span className={`
        font-medium text-sm
        ${isHighlight ? "text-blue-700" : "text-gray-700"}
      `}>
        {title}
      </span>
    </Card>
  );
};