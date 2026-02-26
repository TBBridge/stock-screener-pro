"use client";

import { useState } from "react";
import { useLanguageStore } from "@/app/store/languageStore";
import { getDocumentation } from "@/app/lib/documentation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen, HelpCircle, ChevronRight, X } from "lucide-react";

interface DocumentationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentationPanel({ isOpen, onClose }: DocumentationPanelProps) {
  const { currentLanguage, t } = useLanguageStore();
  const [selectedSection, setSelectedSection] = useState<number>(0);

  const docs = getDocumentation(currentLanguage);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-6 w-6 text-primary" />
              {currentLanguage === 'zh' ? '使用指南' : currentLanguage === 'ja' ? 'ユーザーガイド' : 'User Guide'}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(80vh-80px)]">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r bg-gray-50">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-1">
                {docs.map((section, index) => (
                  <Button
                    key={index}
                    variant={selectedSection === index ? "secondary" : "ghost"}
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => setSelectedSection(index)}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          selectedSection === index ? "rotate-90" : ""
                        }`}
                      />
                      <span className="text-sm font-medium">{section.title}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                {docs[selectedSection] && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-3">
                        {docs[selectedSection].title}
                      </h2>
                      <p className="text-gray-600 leading-relaxed">
                        {docs[selectedSection].content}
                      </p>
                    </div>

                    <Separator />

                    {docs[selectedSection].subsections && (
                      <Accordion type="single" collapsible className="w-full">
                        {docs[selectedSection].subsections.map((subsection, idx) => (
                          <AccordionItem key={idx} value={`item-${idx}`}>
                            <AccordionTrigger className="text-left">
                              <span className="font-semibold">{subsection.title}</span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pt-2 pb-4">
                                <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                                  {subsection.content}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 帮助按钮组件
export function HelpButton({ onClick }: { onClick: () => void }) {
  const { currentLanguage } = useLanguageStore();
  
  const tooltipText = {
    zh: '使用指南',
    en: 'User Guide',
    ja: 'ガイド',
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      onClick={onClick}
    >
      <HelpCircle className="h-4 w-4" />
      <span className="hidden sm:inline">{tooltipText[currentLanguage]}</span>
    </Button>
  );
}
