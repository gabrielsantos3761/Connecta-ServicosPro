import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Scissors,
  Sparkles,
  Heart,
  Waves,
  Hand,
  Activity,
  Zap,
  Palette,
  Search,
  Star,
  ArrowRight,
  CheckCircle2,
  Users,
  Menu,
  Calendar,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { businessCategories } from "@/data/mockData";
import { BusinessCategory } from "@/types";
import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
  getAllActiveBusinesses,
  getBusinessStats,
  Business,
} from "@/services/businessService";
import { trackAnonymousVisit } from "@/services/visitorService";

const iconMap = {
  Scissors,
  Sparkles,
  Heart,
  Waves,
  Hand,
  Activity,
  Zap,
  Palette,
};

const testimonials = [
  {
    id: 1,
    name: "Ana Paula Silva",
    role: "Cliente frequente",
    content:
      "Simplesmente incrível! Encontrei os melhores profissionais da cidade em um só lugar. Agendamento super fácil!",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: 2,
    name: "Carlos Mendes",
    role: "Empresário",
    content:
      "A plataforma facilitou muito minha rotina. Consigo agendar todos meus serviços sem sair de casa.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: 3,
    name: "Juliana Costa",
    role: "Designer",
    content:
      "Profissionais qualificados, preços justos e um atendimento excepcional. Super recomendo!",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=5",
  },
];

const marqueeItems = [
  "Barbearia",
  "Salão de Beleza",
  "Estética",
  "Spa",
  "Manicure",
  "Massagem",
  "Depilação",
  "Maquiagem",
  "Barbearia",
  "Salão de Beleza",
  "Estética",
  "Spa",
  "Manicure",
  "Massagem",
  "Depilação",
  "Maquiagem",
];

export function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await trackAnonymousVisit("/");
        const allBusinesses = await getAllActiveBusinesses();
        const featured = [...allBusinesses]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3);
        setFeaturedBusinesses(featured);
        const statistics = await getBusinessStats();
        setStats(statistics);
      } catch (error) {
        console.error("[Home] Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCategoryClick = (categoryId: BusinessCategory) => {
    navigate(`/categorias/${categoryId}`);
  };

  const filteredCategories = businessCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Menu Button */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 md:top-6 md:left-6 z-50 w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #B8941E)",
              boxShadow: "0 8px 32px rgba(212,175,55,0.35)",
            }}
          >
            <Menu className="w-6 h-6 text-black" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity }}
        className="relative min-h-screen flex items-center overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-black" />
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.18, 0.28, 0.18] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.8) 0%, transparent 70%)",
          }}
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-64 -right-64 w-[900px] h-[900px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.6) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* LEFT */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 mb-8"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#D4AF37" }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-[0.28em]"
                  style={{ color: "rgba(212,175,55,0.8)" }}
                >
                  Plataforma Premium de Beleza
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#D4AF37" }}
                />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="font-bold leading-[0.92] mb-8"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(3.2rem, 7.5vw, 5.8rem)",
                }}
              >
                <span className="text-white block">Sua beleza,</span>
                <span
                  className="block"
                  style={{
                    background:
                      "linear-gradient(135deg, #D4AF37 0%, #F4E4C1 55%, #D4AF37 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  conectada.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-gray-400 text-lg md:text-xl leading-relaxed mb-10 max-w-lg"
              >
                Descubra e agende com os melhores profissionais de beleza e
                bem-estar da sua cidade — em segundos.
              </motion.p>

              {/* Search */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="relative mb-8"
              >
                <div
                  className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                  style={{
                    background: "linear-gradient(90deg, #D4AF37, #B8941E)",
                  }}
                />
                <div
                  className="relative flex items-center rounded-2xl p-2 gap-3 transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <Search className="ml-3 w-5 h-5 text-gray-500 flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="Buscar serviços, profissionais..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      navigate("/categorias/barbearia")
                    }
                    className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-10"
                  />
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/categorias/barbearia")}
                    className="px-6 py-3 rounded-xl font-semibold text-black text-sm flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #D4AF37, #B8941E)",
                    }}
                  >
                    Buscar
                  </motion.button>
                </div>
              </motion.div>

              {/* Quick tags */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="flex flex-wrap gap-2 mb-12"
              >
                <span className="text-xs text-gray-600 self-center">
                  Popular:
                </span>
                {[
                  { label: "Barbearia", id: "barbearia" },
                  { label: "Salão", id: "salao" },
                  { label: "Manicure", id: "manicure" },
                  { label: "Spa", id: "spa" },
                ].map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() =>
                      handleCategoryClick(tag.id as BusinessCategory)
                    }
                    className="px-3 py-1 text-xs text-gray-400 rounded-full transition-all hover:text-gold"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {tag.label}
                  </button>
                ))}
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="flex items-stretch divide-x"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                {[
                  {
                    value: loading
                      ? "—"
                      : `${stats.totalBusinesses}+`,
                    label: "Estabelecimentos",
                  },
                  {
                    value: loading
                      ? "—"
                      : stats.averageRating > 0
                      ? stats.averageRating.toFixed(1)
                      : "4.8",
                    label: "Avaliação média",
                  },
                  {
                    value: loading ? "—" : `${stats.totalReviews}+`,
                    label: "Avaliações",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`${i === 0 ? "pr-8" : i === 2 ? "pl-8" : "px-8"}`}
                  >
                    <p
                      className="text-2xl font-bold text-white"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* RIGHT: Image mosaic */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="hidden lg:block relative h-[580px]"
            >
              {/* Main image */}
              <div
                className="absolute left-0 top-0 w-[56%] h-[64%] rounded-3xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500&h=500&fit=crop"
                  alt="Salon"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              {/* Top right */}
              <div
                className="absolute right-0 top-0 w-[41%] h-[47%] rounded-3xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop"
                  alt="Barber"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              {/* Bottom right */}
              <div
                className="absolute right-0 bottom-0 w-[41%] h-[50%] rounded-3xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop"
                  alt="Spa"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              {/* Bottom left */}
              <div
                className="absolute left-0 bottom-0 w-[53%] h-[33%] rounded-3xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400&h=200&fit=crop"
                  alt="Makeup"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* Floating: rating */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-8 top-[36%] rounded-2xl p-4 shadow-2xl"
                style={{
                  background: "rgba(10,8,5,0.85)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(212,175,55,0.15)" }}
                  >
                    <Star className="w-5 h-5 fill-gold text-gold" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Top Avaliados</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-gold text-gold" />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating: booked */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.2,
                }}
                className="absolute -right-4 top-[54%] rounded-2xl p-4 shadow-2xl"
                style={{
                  background: "rgba(10,8,5,0.85)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(34,197,94,0.15)" }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Agendado!</p>
                    <p className="text-gray-500 text-xs">Hoje às 15:30</p>
                  </div>
                </div>
              </motion.div>

              {/* Live badge */}
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                <span className="text-xs font-medium text-red-400">
                  Online agora
                </span>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-gray-700 uppercase tracking-widest">
            Deslize
          </span>
          <div
            className="w-px h-10"
            style={{
              background:
                "linear-gradient(to bottom, rgba(212,175,55,0.5), transparent)",
            }}
          />
        </motion.div>
      </motion.section>

      {/* ═══════════════════════════════════════════
          MARQUEE STRIP
      ═══════════════════════════════════════════ */}
      <div
        className="relative py-4 overflow-hidden"
        style={{
          background: "linear-gradient(90deg, #0a0805, #0f0d07, #0a0805)",
          borderTop: "1px solid rgba(212,175,55,0.15)",
          borderBottom: "1px solid rgba(212,175,55,0.15)",
        }}
      >
        <motion.div
          className="flex whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          {marqueeItems.map((item, i) => (
            <span key={i} className="inline-flex items-center">
              <span
                className="text-xs font-semibold uppercase px-6"
                style={{
                  letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                {item}
              </span>
              <span className="text-gold text-xs opacity-60">✦</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════
          FEATURED BUSINESSES
      ═══════════════════════════════════════════ */}
      <section className="relative py-28 bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between"
          >
            <div>
              <span
                className="text-xs font-semibold uppercase mb-3 block"
                style={{
                  letterSpacing: "0.25em",
                  color: "rgba(212,175,55,0.7)",
                }}
              >
                01 — Em Destaque
              </span>
              <h2
                className="text-5xl md:text-6xl font-bold text-white leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Escolhidos com
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #D4AF37, #F4E4C1)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  excelência
                </span>
              </h2>
            </div>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => navigate("/categorias/barbearia")}
              className="hidden md:flex items-center gap-2 text-sm text-gray-500 hover:text-gold transition-colors mb-2"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>

        {/* Bento Grid */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl animate-pulse"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    height: i === 0 ? "560px" : "270px",
                  }}
                />
              ))}
            </div>
          ) : featuredBusinesses.length === 0 ? (
            <p className="text-gray-600 text-center py-20">
              Nenhum estabelecimento encontrado
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Large hero card */}
              {featuredBusinesses[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="md:col-span-2 md:row-span-2 group cursor-pointer relative rounded-3xl overflow-hidden"
                  style={{ minHeight: "340px", height: "560px" }}
                  onClick={() =>
                    navigate(`/empresas/${featuredBusinesses[0].id}`)
                  }
                >
                  <img
                    src={
                      featuredBusinesses[0].image ||
                      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=700&fit=crop"
                    }
                    alt={featuredBusinesses[0].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                        style={{
                          background: "rgba(212,175,55,0.15)",
                          border: "1px solid rgba(212,175,55,0.35)",
                          color: "#D4AF37",
                        }}
                      >
                        {featuredBusinesses[0].category}
                      </span>
                      <div
                        className="flex items-center gap-1 rounded-full px-2.5 py-1"
                        style={{ background: "rgba(0,0,0,0.5)" }}
                      >
                        <Star className="w-3 h-3 fill-gold text-gold" />
                        <span className="text-white text-xs font-semibold">
                          {featuredBusinesses[0].rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <h3
                      className="text-3xl font-bold text-white mb-2 group-hover:text-gold transition-colors"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {featuredBusinesses[0].name}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-5 max-w-md">
                      {featuredBusinesses[0].description}
                    </p>
                    <motion.div
                      whileHover={{ scale: 1.04 }}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-black px-5 py-2.5 rounded-full cursor-pointer"
                      style={{
                        background:
                          "linear-gradient(135deg, #D4AF37, #B8941E)",
                      }}
                    >
                      Agendar agora <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Smaller cards */}
              {featuredBusinesses.slice(1, 3).map((business, index) => (
                <motion.div
                  key={business.id}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.12 }}
                  className="group cursor-pointer relative rounded-3xl overflow-hidden"
                  style={{ height: "270px" }}
                  onClick={() => navigate(`/empresas/${business.id}`)}
                >
                  <img
                    src={
                      business.image ||
                      "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop"
                    }
                    alt={business.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="text-xs mb-1 capitalize"
                          style={{ color: "#D4AF37" }}
                        >
                          {business.category}
                        </p>
                        <h4
                          className="text-lg font-bold text-white group-hover:text-gold transition-colors"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {business.name}
                        </h4>
                      </div>
                      <div
                        className="flex items-center gap-1 rounded-full px-2.5 py-1.5 flex-shrink-0"
                        style={{
                          background: "rgba(0,0,0,0.55)",
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        <Star className="w-3 h-3 fill-gold text-gold" />
                        <span className="text-white text-xs font-bold">
                          {business.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CATEGORIES
      ═══════════════════════════════════════════ */}
      <section
        className="relative py-28 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #000 0%, #0d0b06 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span
              className="text-xs font-semibold uppercase mb-3 block"
              style={{
                letterSpacing: "0.25em",
                color: "rgba(212,175,55,0.7)",
              }}
            >
              02 — Categorias
            </span>
            <h2
              className="text-5xl md:text-6xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Explore
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F4E4C1)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                nossos serviços
              </span>
            </h2>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCategories.map((category, index) => {
              const Icon = iconMap[category.icon as keyof typeof iconMap];
              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleCategoryClick(category.id)}
                  className="group relative text-left p-6 rounded-2xl transition-all duration-300 overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse at top left, rgba(212,175,55,0.09) 0%, transparent 65%)",
                    }}
                  />
                  <div
                    className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {Icon && (
                      <Icon className="w-6 h-6 text-gray-400 group-hover:text-gold transition-colors" />
                    )}
                  </div>
                  <h4 className="text-white font-semibold text-sm mb-1 group-hover:text-gold transition-colors relative z-10">
                    {category.name}
                  </h4>
                  <p className="text-gray-600 text-xs leading-relaxed mb-4 relative z-10">
                    {category.description}
                  </p>
                  <div className="flex items-center gap-1 text-xs font-medium transition-colors relative z-10 text-gold/50 group-hover:text-gold">
                    Explorar{" "}
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-gray-700 mb-4" />
              <p className="text-gray-600">Nenhuma categoria encontrada</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════ */}
      <section className="relative py-28 bg-black overflow-hidden">
        {/* Decorative large number */}
        <div
          className="absolute top-4 right-4 select-none pointer-events-none"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "22rem",
            lineHeight: 1,
            fontWeight: 700,
            color: "rgba(255,255,255,0.018)",
          }}
        >
          03
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <span
              className="text-xs font-semibold uppercase mb-3 block"
              style={{
                letterSpacing: "0.25em",
                color: "rgba(212,175,55,0.7)",
              }}
            >
              03 — Como funciona
            </span>
            <h2
              className="text-5xl md:text-6xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Simples como
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F4E4C1)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                deve ser
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connector line */}
            <div
              className="hidden md:block absolute top-5 left-[calc(16.7%+2rem)] right-[calc(16.7%+2rem)] h-px"
              style={{
                background:
                  "linear-gradient(90deg, rgba(212,175,55,0.4), rgba(212,175,55,0.1), rgba(212,175,55,0.4))",
              }}
            />

            {[
              {
                step: "01",
                title: "Escolha o serviço",
                description:
                  "Navegue pelas categorias e encontre exatamente o que procura com filtros inteligentes.",
                icon: Search,
              },
              {
                step: "02",
                title: "Selecione o profissional",
                description:
                  "Veja perfis detalhados, portfólio e avaliações reais. Escolha quem melhor te atende.",
                icon: Users,
              },
              {
                step: "03",
                title: "Agende e relaxe",
                description:
                  "Reserve em segundos e receba confirmação imediata. Nós cuidamos do resto.",
                icon: Calendar,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className="w-10 h-10 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      borderColor: "#D4AF37",
                      color: "#D4AF37",
                    }}
                  >
                    {item.step}
                  </div>
                  <div
                    className="flex-1 h-px"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  />
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{
                    background: "rgba(212,175,55,0.08)",
                    border: "1px solid rgba(212,175,55,0.18)",
                  }}
                >
                  <item.icon
                    className="w-7 h-7"
                    style={{ color: "#D4AF37" }}
                  />
                </div>
                <h3
                  className="text-2xl font-bold text-white mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {item.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TRUST STRIP
      ═══════════════════════════════════════════ */}
      <div
        className="py-10"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          background: "rgba(212,175,55,0.025)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                label: "Pagamento Seguro",
                desc: "Transações 100% protegidas",
              },
              {
                icon: Star,
                label: "Profissionais Verificados",
                desc: "Todos avaliados e certificados",
              },
              {
                icon: Calendar,
                label: "Agendamento Fácil",
                desc: "Confirme em menos de 1 minuto",
              },
              {
                icon: CheckCircle2,
                label: "Satisfação Garantida",
                desc: "Experiência premium garantida",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(212,175,55,0.1)" }}
                >
                  <item.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {item.label}
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════ */}
      <section className="relative py-28 bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span
              className="text-xs font-semibold uppercase mb-3 block"
              style={{
                letterSpacing: "0.25em",
                color: "rgba(212,175,55,0.7)",
              }}
            >
              04 — Depoimentos
            </span>
            <h2
              className="text-5xl md:text-6xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              O que dizem
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F4E4C1)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                nossos clientes
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Featured testimonial */}
            <div className="relative min-h-[320px]">
              <AnimatePresence mode="wait">
                {testimonials.map((t, i) =>
                  i === activeTestimonial ? (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div
                        className="font-bold select-none mb-2"
                        style={{
                          fontFamily: "Georgia, serif",
                          fontSize: "7rem",
                          lineHeight: 0.75,
                          background:
                            "linear-gradient(135deg, #D4AF37, transparent)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        "
                      </div>
                      <blockquote
                        className="text-2xl md:text-3xl font-light text-white leading-relaxed mb-8"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {t.content}
                      </blockquote>
                      <div className="flex items-center gap-4">
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-12 h-12 rounded-full object-cover"
                          style={{
                            border: "2px solid rgba(212,175,55,0.3)",
                          }}
                        />
                        <div>
                          <p className="text-white font-semibold">{t.name}</p>
                          <p className="text-gray-500 text-sm">{t.role}</p>
                        </div>
                        <div className="ml-auto flex gap-0.5">
                          {[...Array(t.rating)].map((_, j) => (
                            <Star
                              key={j}
                              className="w-4 h-4 fill-gold text-gold"
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : null
                )}
              </AnimatePresence>

              {/* Dots */}
              <div className="flex gap-2 mt-8">
                {testimonials.map((_, i) => (
                  <button key={i} onClick={() => setActiveTestimonial(i)}>
                    <div
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === activeTestimonial ? "28px" : "8px",
                        height: "8px",
                        background:
                          i === activeTestimonial
                            ? "#D4AF37"
                            : "rgba(255,255,255,0.15)",
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Testimonial list */}
            <div className="space-y-3">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setActiveTestimonial(i)}
                  className="cursor-pointer p-5 rounded-2xl transition-all duration-300"
                  style={{
                    background:
                      i === activeTestimonial
                        ? "rgba(212,175,55,0.07)"
                        : "rgba(255,255,255,0.02)",
                    border:
                      i === activeTestimonial
                        ? "1px solid rgba(212,175,55,0.35)"
                        : "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {t.name}
                      </p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[...Array(t.rating)].map((_, j) => (
                          <Star
                            key={j}
                            className="w-3 h-3 fill-gold text-gold"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {t.content}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA
      ═══════════════════════════════════════════ */}
      <section
        className="relative py-32 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #080603 0%, #000 50%, #080603 100%)",
        }}
      >
        {/* Gold orbs */}
        <div
          className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full opacity-[0.15] pointer-events-none"
          style={{
            background: "radial-gradient(circle, #D4AF37 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.08] pointer-events-none"
          style={{
            background: "radial-gradient(circle, #D4AF37 0%, transparent 65%)",
          }}
        />
        {/* Grid overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.025 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid-cta"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-cta)" />
        </svg>

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-3 text-xs font-semibold uppercase mb-6 block justify-center" style={{ letterSpacing: "0.25em", color: "rgba(212,175,55,0.7)" }}>
              <span
                className="h-px w-8 block"
                style={{ background: "rgba(212,175,55,0.5)" }}
              />
              Comece hoje
              <span
                className="h-px w-8 block"
                style={{ background: "rgba(212,175,55,0.5)" }}
              />
            </span>
            <h2
              className="text-5xl md:text-7xl font-bold leading-tight mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              <span className="text-white">Pronto para</span>
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #D4AF37, #F4E4C1, #D4AF37)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                se cuidar?
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Milhares de clientes já descobriram o melhor em serviços de beleza
              e bem-estar. Sua vez.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{
                  scale: 1.04,
                  boxShadow: "0 0 50px rgba(212,175,55,0.4)",
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/categorias/barbearia")}
                className="px-10 py-4 rounded-full font-bold text-black text-base"
                style={{ background: "linear-gradient(135deg, #D4AF37, #B8941E)" }}
              >
                Explorar serviços
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/login")}
                className="px-10 py-4 rounded-full font-bold text-white text-base transition-all"
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                Sou profissional →
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════ */}
      <footer
        className="bg-black"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #D4AF37, #B8941E)",
                  }}
                >
                  <img
                    src="/assets/images/Logo.png"
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">
                    Connecta ServiçosPro
                  </p>
                  <p className="text-xs text-gray-600">Beleza & Bem-estar</p>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6">
                Conectando você aos melhores profissionais. Excelência em cada
                serviço, satisfação em cada atendimento.
              </p>
              <div className="flex gap-3">
                {["in", "ig", "tw", "yt"].map((s) => (
                  <a
                    key={s}
                    href="#"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:text-gold transition-all text-xs"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {s}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-white font-semibold text-sm mb-5">
                Navegação
              </h5>
              <ul className="space-y-3">
                {[
                  "Serviços",
                  "Profissionais",
                  "Estabelecimentos",
                  "Blog",
                  "Contato",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-500 hover:text-gold text-sm transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-white font-semibold text-sm mb-5">
                Suporte
              </h5>
              <ul className="space-y-3">
                {[
                  "Central de Ajuda",
                  "FAQ",
                  "Termos de Uso",
                  "Privacidade",
                  "Segurança",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-500 hover:text-gold text-sm transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <p className="text-gray-600 text-xs">
              © 2025 Connecta ServiçosPro. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-gray-600 hover:text-gold text-xs transition-colors"
              >
                Cookies
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-gold text-xs transition-colors"
              >
                Acessibilidade
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
