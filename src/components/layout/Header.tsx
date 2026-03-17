import { useState } from "react";
import { Bell, Search, Menu } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const gold = "#D4AF37";

const iconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.375rem",
  borderRadius: "0.5rem",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.5rem",
  color: "#fff",
  padding: "0.5rem 0.75rem 0.5rem 2.25rem",
  fontSize: "0.875rem",
  outline: "none",
  width: "100%",
};

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
    <header style={{
      background: "rgba(5,4,0,0.85)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(212,175,55,0.15)",
      padding: "1rem 2rem",
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        {/* Mobile Menu + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
          <button
            style={{ ...iconBtnStyle, flexShrink: 0 }}
            className="md:hidden"
            onClick={onMobileMenuClick}
          >
            <Menu size={20} />
          </button>
          <div style={{ minWidth: 0 }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.1rem, 3vw, 1.6rem)",
              fontWeight: 700,
              color: "#fff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginTop: "0.1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {action ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {action}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Desktop search */}
            <div className="relative hidden sm:block" style={{ width: "12rem" }}>
              <Search size={14} style={{ position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }} />
              <input
                type="search"
                placeholder="Buscar..."
                style={inputStyle}
                value={searchValue || ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>

            {/* Mobile search icon */}
            <button
              style={iconBtnStyle}
              className="sm:hidden"
              onClick={() => setIsMobileSearchOpen(true)}
            >
              <Search size={18} />
            </button>

            {/* Notifications */}
            <button style={{ ...iconBtnStyle, position: "relative" }}>
              <Bell size={18} />
              <span style={{
                position: "absolute", top: "0.25rem", right: "0.25rem",
                width: 7, height: 7, borderRadius: "50%",
                background: gold,
              }} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Search Dialog */}
      <Dialog open={isMobileSearchOpen} onOpenChange={setIsMobileSearchOpen}>
        <DialogContent style={{ background: "#0a0900", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem" }} className="sm:hidden top-0 translate-y-0 max-w-full w-full rounded-none border-0">
          <DialogHeader>
            <DialogTitle style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>Buscar</DialogTitle>
          </DialogHeader>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }} />
            <input
              type="search"
              placeholder="Buscar..."
              style={inputStyle}
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
