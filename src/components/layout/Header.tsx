import { useState } from "react";
import { Bell, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { theme } from "@/styles/theme";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMobileMenuClick?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  action?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  onMobileMenuClick,
  searchValue,
  onSearchChange,
  action,
}: HeaderProps) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className="bg-black/80 backdrop-blur-xl border-b border-gold/20 px-4 md:px-8 py-4 md:py-6 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile Menu Button + Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`md:hidden flex-shrink-0 ${theme.colors.text.primary} hover:bg-white/10`}
            onClick={onMobileMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Title */}
          <div className="min-w-0">
            <h1 className={`text-xl md:text-3xl font-bold ${theme.colors.text.primary} truncate`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`text-xs md:text-sm ${theme.colors.text.secondary} mt-1 truncate`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions or Search and Notifications */}
        {action ? (
          <div className="flex items-center gap-2">
            {action}
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search - Hidden on small mobile */}
            <div className="relative hidden sm:block w-48 md:w-80">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.colors.text.secondary} w-4 h-4`} />
              <Input
                type="search"
                placeholder="Buscar..."
                className={`pl-10 text-sm ${theme.components.input.base}`}
                value={searchValue || ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>

            {/* Search Icon for Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className={`sm:hidden ${theme.colors.text.primary} hover:bg-white/10`}
              onClick={() => setIsMobileSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className={`relative ${theme.colors.text.primary} hover:bg-white/10`}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full"></span>
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Search Dialog */}
      <Dialog open={isMobileSearchOpen} onOpenChange={setIsMobileSearchOpen}>
        <DialogContent className={`sm:hidden top-0 translate-y-0 max-w-full w-full rounded-none border-0 ${theme.colors.card.base}`}>
          <DialogHeader>
            <DialogTitle className={theme.colors.text.primary}>Buscar</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.colors.text.secondary} w-4 h-4`} />
            <Input
              type="search"
              placeholder="Buscar..."
              className={`pl-10 ${theme.components.input.base}`}
              value={searchValue || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              autoFocus
            />
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
