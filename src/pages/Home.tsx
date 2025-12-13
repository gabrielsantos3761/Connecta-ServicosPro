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
  MapPin,
  Star,
  ArrowRight,
  CheckCircle2,
  Users,
  Award,
  Menu,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

// Testimonials Mock Data
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

export function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Buscar estabelecimentos e registrar visita ao carregar a página
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Registrar visita anônima
        await trackAnonymousVisit("/");

        // Buscar estabelecimentos
        const allBusinesses = await getAllActiveBusinesses();
        setBusinesses(allBusinesses);

        // Selecionar 3 estabelecimentos em destaque (com melhor avaliação)
        const featured = [...allBusinesses]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3);
        setFeaturedBusinesses(featured);

        // Buscar estatísticas
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

  const handleCategoryClick = (categoryId: BusinessCategory) => {
    navigate(`/categorias/${categoryId}`);
  };

  const filteredCategories = businessCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Menu Button - Fixed Position - Mobile & Desktop */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 md:top-6 md:left-6 z-50 w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-gold to-yellow-600 backdrop-blur-xl border-2 border-white/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl hover:shadow-gold/50"
          >
            <Menu className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Hero Section - Premium with Gradient Overlay */}
      <motion.div
        ref={heroRef}
        style={{ opacity, scale }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />

        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-gold/20 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-block mb-6"
            >
              <span className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-white font-medium">
                ✨ Sua beleza, nosso compromisso
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
              Excelência em
              <br />
              <span className="bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent">
                Cada Detalhe
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Conecte-se com profissionais de elite e transforme sua experiência
              de cuidado pessoal
            </p>

            {/* Search Bar - Premium */}
            <div className="max-w-2xl mx-auto relative mb-12">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-gold to-yellow-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-2 flex items-center gap-3">
                  <Search className="ml-4 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar serviços, profissionais ou categorias..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-full font-semibold hover:shadow-xl hover:shadow-gold/50 transition-all"
                  >
                    Buscar
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Stats Row - Premium */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                {
                  icon: MapPin,
                  value: loading ? "..." : `${stats.totalBusinesses}`,
                  label: "Estabelecimentos",
                },
                {
                  icon: Star,
                  value: loading ? "..." : stats.averageRating.toFixed(1),
                  label: "Avaliação Média",
                },
                {
                  icon: Award,
                  value: loading ? "..." : `${stats.totalReviews}`,
                  label: "Avaliações Totais",
                },
                {
                  icon: Users,
                  value: loading ? "..." : `${featuredBusinesses.length * 3}+`,
                  label: "Profissionais",
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-8 h-8 text-gold mx-auto mb-2" />
                  <p className="text-3xl md:text-4xl font-bold text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-white rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Featured Professionals Section */}
      <section className="relative py-24 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Estabelecimentos em Destaque
            </h2>
            <p className="text-xl text-gray-400">
              Escolhidos pela excelência em atendimento e qualidade
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loading ? (
              // Loading skeleton
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 animate-pulse"
                >
                  <div className="aspect-square bg-gray-800"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-800 rounded mb-2"></div>
                    <div className="h-6 bg-gray-800 rounded mb-2"></div>
                    <div className="h-4 bg-gray-800 rounded w-2/3"></div>
                  </div>
                </div>
              ))
            ) : featuredBusinesses.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-400 text-lg">
                  Nenhum estabelecimento encontrado
                </p>
              </div>
            ) : (
              featuredBusinesses.map((business, index) => (
                <motion.div
                  key={business.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/empresas/${business.id}`)}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-gold/50 transition-all duration-500">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={
                          business.image ||
                          business.coverImage ||
                          (business.gallery && business.gallery.length > 0
                            ? business.gallery[0]
                            : "") ||
                          "https://images.unsplash.com/photo-1521898284481-a5ec348cb555?w=400&h=400&fit=crop"
                        }
                        alt={business.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gold font-medium capitalize">
                          {business.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-gold text-gold" />
                          <span className="text-white font-semibold">
                            {business.rating.toFixed(1)}
                          </span>
                          <span className="text-gray-400 text-sm">
                            ({business.totalReviews})
                          </span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-gold transition-colors">
                        {business.name}
                      </h3>
                      <p className="text-gray-400 line-clamp-2">
                        {business.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Categories Section - Premium */}
      <section className="relative py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Explore Nossos Serviços
            </h2>
            <p className="text-xl text-gray-400">
              Diversidade e qualidade em cada categoria
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCategories.map((category, index) => {
              const Icon = iconMap[category.icon as keyof typeof iconMap];

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className="h-full cursor-pointer bg-white/5 backdrop-blur-sm border-white/10 hover:border-gold/50 hover:shadow-2xl hover:shadow-gold/20 transition-all duration-300 group overflow-hidden"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <CardContent className="p-6 relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                      <div
                        className={`${category.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 relative z-10`}
                      >
                        <Icon className={`w-8 h-8 ${category.color}`} />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-2 group-hover:text-gold transition-colors relative z-10">
                        {category.name}
                      </h4>
                      <p className="text-sm text-gray-400 mb-4 relative z-10">
                        {category.description}
                      </p>
                      <div className="flex items-center text-gold text-sm font-medium group-hover:gap-2 transition-all relative z-10">
                        Explorar{" "}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                Nenhuma categoria encontrada
              </h3>
              <p className="text-sm text-gray-500">
                Tente buscar por outro termo
              </p>
            </div>
          )}
        </div>
      </section>

      {/* How it Works - Premium */}
      <section className="relative py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-400">Simples, rápido e eficiente</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Escolha o Serviço",
                description:
                  "Navegue por categorias e encontre exatamente o que procura",
                icon: Search,
                color: "from-blue-500 to-cyan-500",
              },
              {
                step: "02",
                title: "Selecione o Profissional",
                description:
                  "Veja perfis, avaliações e escolha quem melhor atende suas necessidades",
                icon: Users,
                color: "from-purple-500 to-pink-500",
              },
              {
                step: "03",
                title: "Agende e Relaxe",
                description:
                  "Reserve seu horário em segundos e receba confirmação instantânea",
                icon: CheckCircle2,
                color: "from-green-500 to-emerald-500",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-gold/50 transition-all duration-300">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-6xl font-bold text-white/10">
                        {item.step}
                      </span>
                      <div
                        className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                      >
                        <item.icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gold transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              O Que Dizem Nossos Clientes
            </h2>
            <p className="text-xl text-gray-400">
              Experiências reais de quem confia em nós
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-gold/50 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-white font-semibold">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-purple-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Pronto para Transformar
              <br />
              <span className="bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent">
                Sua Experiência?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-10">
              Junte-se a milhares de clientes satisfeitos e descubra o melhor em
              serviços
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/categorias/barbearia")}
                className="px-8 py-4 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-gold/50 transition-all"
              >
                Começar Agora
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/login")}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all"
              >
                Sou Profissional
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Premium */}
      <footer className="bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-gold to-yellow-600 rounded-lg flex items-center justify-center">
                  <img
                    src="/assets/images/Logo.png"
                    alt="Logo"
                    className="w-full h-full object-cover rounded-lg scale-110"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">
                    Connecta ServiçosPro
                  </h4>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Conectando você aos melhores profissionais de beleza e
                bem-estar. Excelência em cada serviço, satisfação em cada
                atendimento.
              </p>
              <div className="flex gap-4">
                {["facebook", "instagram", "twitter", "linkedin"].map(
                  (social) => (
                    <a
                      key={social}
                      href="#"
                      className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-full flex items-center justify-center transition-all"
                    >
                      <span className="sr-only">{social}</span>
                    </a>
                  )
                )}
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Links Rápidos</h4>
              <ul className="space-y-3 text-sm">
                {[
                  "Sobre Nós",
                  "Serviços",
                  "Profissionais",
                  "Blog",
                  "Contato",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-gold transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Suporte</h4>
              <ul className="space-y-3 text-sm">
                {[
                  "Ajuda",
                  "FAQ",
                  "Termos de Uso",
                  "Privacidade",
                  "Segurança",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-gold transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2024 Connecta ServiçosPro. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-gold transition-colors">
                Política de Cookies
              </a>
              <a href="#" className="hover:text-gold transition-colors">
                Acessibilidade
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
