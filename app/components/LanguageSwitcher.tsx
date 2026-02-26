"use client";

import { useLanguageStore } from "@/app/store/languageStore";
import { Language, languageNames, languageFlags } from "@/app/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

const languages: Language[] = ['zh', 'en', 'ja'];

export default function LanguageSwitcher() {
  const { currentLanguage, setLanguage } = useLanguageStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {languageFlags[currentLanguage]} {languageNames[currentLanguage]}
          </span>
          <span className="sm:hidden">{languageFlags[currentLanguage]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span>{languageFlags[lang]}</span>
            <span>{languageNames[lang]}</span>
            {currentLanguage === lang && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
