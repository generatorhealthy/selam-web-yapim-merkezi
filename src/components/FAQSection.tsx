
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Minus } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqItems: FAQItem[];
  onFaqItemsChange: (items: FAQItem[]) => void;
  title?: string;
  showPreview?: boolean;
}

const FAQSection = ({ faqItems, onFaqItemsChange, title = "Sık Sorulan Sorular", showPreview = true }: FAQSectionProps) => {
  const addFaqItem = () => {
    onFaqItemsChange([...faqItems, { question: "", answer: "" }]);
  };

  const removeFaqItem = (index: number) => {
    if (faqItems.length > 1) {
      onFaqItemsChange(faqItems.filter((_, i) => i !== index));
    }
  };

  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedFaq = faqItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onFaqItemsChange(updatedFaq);
  };

  const validFaqItems = faqItems.filter(item => item.question.trim() && item.answer.trim());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <Button type="button" onClick={addFaqItem} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Soru Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqItems.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Soru {index + 1}</Label>
                {faqItems.length > 1 && (
                  <Button 
                    type="button" 
                    onClick={() => removeFaqItem(index)} 
                    variant="outline" 
                    size="sm"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div>
                <Label htmlFor={`question-${index}`}>Soru</Label>
                <Input
                  id={`question-${index}`}
                  value={item.question}
                  onChange={(e) => updateFaqItem(index, 'question', e.target.value)}
                  placeholder="Soruyu yazın..."
                />
              </div>
              
              <div>
                <Label htmlFor={`answer-${index}`}>Cevap</Label>
                <Textarea
                  id={`answer-${index}`}
                  value={item.answer}
                  onChange={(e) => updateFaqItem(index, 'answer', e.target.value)}
                  placeholder="Cevabı yazın..."
                  rows={3}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {showPreview && validFaqItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Önizleme</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {validFaqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="whitespace-pre-wrap text-gray-700">
                      {item.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FAQSection;
