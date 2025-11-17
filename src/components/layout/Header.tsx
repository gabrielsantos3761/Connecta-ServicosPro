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

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMobileMenuClick?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function Header({
  title,
  subtitle,
  onMobileMenuClick,
  searchValue,
  onSearchChange,
}: HeaderProps) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-6">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile Menu Button + Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden flex-shrink-0"
            onClick={onMobileMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Title */}
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Search and Notifications */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search - Hidden on small mobile */}
          <div className="relative hidden sm:block w-48 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-10 text-sm"
              value={searchValue || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>

          {/* Search Icon for Mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setIsMobileSearchOpen(true)}
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full"></span>
          </Button>
        </div>
      </div>

      {/* Mobile Search Dialog */}
      <Dialog open={isMobileSearchOpen} onOpenChange={setIsMobileSearchOpen}>
        <DialogContent className="sm:hidden top-0 translate-y-0 max-w-full w-full rounded-none border-0">
          <DialogHeader>
            <DialogTitle>Buscar</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-10"
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
