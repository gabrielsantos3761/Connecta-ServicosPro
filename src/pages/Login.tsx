import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, User, Crown, Scissors, Send } from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sanitizeString, isValidEmail, detectXSS } from "@/lib/securityUtils";

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.5rem",
  color: "#fff",
  padding: "0.75rem 1rem",
  outline: "none",
  width: "100%",
};

const goldButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg,#D4AF37,#B8941E)",
  color: "#050400",
  fontWeight: 600,
  borderRadius: "0.5rem",
  padding: "0.75rem 1.5rem",
  border: "none",
  cursor: "pointer",
  width: "100%",
};

const ghostButtonStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  fontWeight: 500,
  borderRadius: "0.5rem",
  padding: "0.75rem 1.5rem",
  border: "1px solid rgba(255,255,255,0.1)",
  cursor: "pointer",
  width: "100%",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "1.125rem",
  padding: "2rem",
};

export function Login() {
  const { login, loginWithGoogle, loginWithFacebook, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("client");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  // Pre-fill email and role from URL parameters (após registro)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const roleParam = searchParams.get('role');

    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }

    if (roleParam && (roleParam === 'client' || roleParam === 'professional' || roleParam === 'owner')) {
      setSelectedRole(roleParam as UserRole);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      email: "",
      password: "",
      general: "",
    };

    // SEGURANÇA: Sanitizar e validar inputs
    const sanitizedEmail = sanitizeString(formData.email);
    const sanitizedPassword = formData.password; // Não sanitizar senha (pode conter caracteres especiais)

    // Validar email
    if (!sanitizedEmail) {
      newErrors.email = "Email é obrigatório";
    } else if (!isValidEmail(sanitizedEmail)) {
      newErrors.email = "Email inválido";
    } else if (detectXSS(sanitizedEmail)) {
      newErrors.email = "Caracteres inválidos detectados";
    }

    // Validar senha
    if (!sanitizedPassword) {
      newErrors.password = "Senha é obrigatória";
    } else if (sanitizedPassword.length < 8) {
      newErrors.password = "Senha deve ter no mínimo 8 caracteres";
    }

    setErrors(newErrors);

    if (!newErrors.email && !newErrors.password) {
      try {
        // Usar valores sanitizados
        await login(sanitizedEmail, sanitizedPassword, selectedRole);
      } catch (error) {
        // SEGURANÇA: Mensagem genérica que não revela se usuário existe
        setErrors((prev) => ({
          ...prev,
          general: "Email ou senha incorretos. Tente novamente.",
        }));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    // SEGURANÇA: Limitar tamanho do input
    const maxLengths: Record<string, number> = {
      email: 254,
      password: 128,
    };

    const sanitizedValue = type === "checkbox" ? checked :
      (maxLengths[name] ? value.substring(0, maxLengths[name]) : value);

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
    }
  };

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
  };

  const roleOptions = [
    {
      role: "client" as UserRole,
      title: "Cliente",
      description: "Agende seus horários",
      icon: User,
      colors: {
        primary: "from-blue-500 to-blue-600",
        border: "border-blue-500",
        bg: "bg-blue-500",
        bgLight: "bg-blue-500/10",
        text: "text-blue-400",
        shadow: "shadow-blue-500/30",
        ring: "focus:ring-blue-500/30 focus:border-blue-500/50",
        glow: "rgba(59, 130, 246, 0.2)",
        cardShadow: "rgba(59, 130, 246, 0.15)",
        borderColor: "rgba(59, 130, 246, 0.3)",
      }
    },
    {
      role: "professional" as UserRole,
      title: "Profissional",
      description: "Gerencie atendimentos",
      icon: Scissors,
      colors: {
        primary: "from-emerald-500 to-green-600",
        border: "border-emerald-500",
        bg: "bg-emerald-500",
        bgLight: "bg-emerald-500/10",
        text: "text-emerald-400",
        shadow: "shadow-emerald-500/30",
        ring: "focus:ring-emerald-500/30 focus:border-emerald-500/50",
        glow: "rgba(16, 185, 129, 0.2)",
        cardShadow: "rgba(16, 185, 129, 0.15)",
        borderColor: "rgba(16, 185, 129, 0.3)",
      }
    },
    {
      role: "owner" as UserRole,
      title: "Proprietário",
      description: "Gerencie sua empresa",
      icon: Crown,
      colors: {
        primary: "from-gold to-yellow-600",
        border: "border-gold",
        bg: "bg-gold",
        bgLight: "bg-gold/10",
        text: "text-gold",
        shadow: "shadow-gold/30",
        ring: "focus:ring-gold/30 focus:border-gold/50",
        glow: "rgba(212, 175, 55, 0.2)",
        cardShadow: "rgba(212, 175, 55, 0.15)",
        borderColor: "rgba(212, 175, 55, 0.3)",
      }
    },
  ];

  const currentRoleOption = roleOptions.find(r => r.role === selectedRole)!;
  const colors = currentRoleOption.colors;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#050400" }}
    >
      {/* Estilos globais para remover fundo branco do autocomplete */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
          box-shadow: 0 0 0 1000px transparent inset !important;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* Loading Overlay para Login Social */}
      <AnimatePresence>
        {(isGoogleLoading || isFacebookLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="backdrop-blur-xl rounded-2xl border border-white/10 p-8 flex flex-col items-center gap-4 shadow-2xl"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              {/* Spinner animado com as cores do provedor */}
              <motion.div
                className={`w-16 h-16 rounded-full border-4 ${
                  isGoogleLoading
                    ? 'border-blue-500/30 border-t-blue-500'
                    : 'border-[#1877F2]/30 border-t-[#1877F2]'
                }`}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />

              {/* Texto de carregamento */}
              <div className="text-center">
                <p className="text-white font-semibold text-lg mb-1">
                  {isGoogleLoading ? 'Conectando com Google' : 'Conectando com Facebook'}
                </p>
                <p className="text-gray-400 text-sm">
                  Aguarde enquanto processamos seu login...
                </p>
              </div>

              {/* Barra de progresso animada */}
              <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    isGoogleLoading
                      ? 'bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500'
                      : 'bg-[#1877F2]'
                  }`}
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Effects */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ backgroundColor: colors.glow }}
          transition={{ duration: 0.5 }}
          className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ backgroundColor: colors.glow }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-3xl opacity-50"
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(212, 175, 55, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 175, 55, 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Main Card */}
        <motion.div
          animate={{
            borderColor: colors.borderColor,
            boxShadow: `0 25px 50px -12px ${colors.cardShadow}`
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="backdrop-blur-xl rounded-3xl shadow-2xl relative overflow-hidden"
          style={cardStyle}
        >
          {/* Brilho sutil na borda que acompanha o tipo de login */}
          <motion.div
            className={`absolute inset-0 rounded-3xl opacity-20 pointer-events-none`}
            animate={{
              background: `linear-gradient(45deg, transparent, ${colors.glow}, transparent)`
            }}
            transition={{ duration: 0.5 }}
          />

          {/* Partículas de fundo decorativas */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-32 h-32 rounded-full blur-3xl opacity-10`}
                style={{
                  background: `radial-gradient(circle, ${colors.glow}, transparent)`
                }}
                animate={{
                  x: [
                    Math.random() * 100 - 50,
                    Math.random() * 100 - 50,
                    Math.random() * 100 - 50
                  ],
                  y: [
                    Math.random() * 100 - 50,
                    Math.random() * 100 - 50,
                    Math.random() * 100 - 50
                  ],
                }}
                transition={{
                  duration: 10 + i * 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          {/* Title */}
          <motion.div
            className="text-center mb-6 relative z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.h1
              className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              Bem-vindo de volta
            </motion.h1>
            <motion.p
              className="text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Selecione como deseja acessar
            </motion.p>
          </motion.div>

          {/* Role Selection - Sempre visível com destaque no selecionado */}
          <div className="relative mb-6 z-10">
            {/* 3 opções sempre visíveis */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="grid grid-cols-3 gap-3"
            >
              {roleOptions.map((option, index) => {
                const Icon = option.icon;
                const isSelected = selectedRole === option.role;

                return (
                  <motion.button
                    key={option.role}
                    type="button"
                    onClick={() => handleSelectRole(option.role)}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{
                      opacity: isSelected ? 1 : 0.6,
                      y: 0
                    }}
                    transition={{
                      delay: 0.08 * index,
                      duration: 0.3
                    }}
                    whileHover={{
                      y: -5,
                      opacity: 1,
                      transition: { type: "spring", stiffness: 400, damping: 10 }
                    }}
                    className={`
                      p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 relative overflow-hidden
                      ${isSelected
                        ? `${option.colors.bgLight} ${option.colors.border} shadow-lg ${option.colors.shadow}`
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                      }
                    `}
                  >
                    {/* Efeito de brilho no hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />

                    {/* Brilho contínuo de fundo para o selecionado */}
                    {isSelected && (
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-r ${option.colors.primary} opacity-0`}
                        animate={{
                          opacity: [0, 0.15, 0],
                          x: ["-100%", "100%"]
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          repeatDelay: 2,
                          ease: "easeInOut"
                        }}
                      />
                    )}

                    <motion.div
                      className={`
                        rounded-xl flex items-center justify-center transition-all relative
                        bg-gradient-to-br ${option.colors.primary} ${option.colors.shadow}
                        w-14 h-14 shadow-xl
                      `}
                      whileHover={{
                        rotate: [0, -10, 10, -10, 0],
                        transition: { duration: 0.5 }
                      }}
                    >
                      <Icon className={`${isSelected ? 'w-7 h-7' : 'w-6 h-6'} text-white transition-all`} />

                      {/* Pulso de luz */}
                      {isSelected && (
                        <motion.div
                          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${option.colors.primary} opacity-0`}
                          animate={{
                            opacity: [0, 0.5, 0],
                            scale: [1, 1.2, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1
                          }}
                        />
                      )}
                    </motion.div>

                    <p className={`text-xs font-semibold transition-colors ${isSelected ? "text-white" : "text-gray-400"}`}>
                      {option.title}
                    </p>

                    {/* Descrição aparece apenas no selecionado */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.7 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`text-xs ${option.colors.text} text-center`}
                        >
                          {option.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm"
              >
                {errors.general}
              </motion.div>
            )}

            {/* Email Field */}
            <motion.div
              className="space-y-1.5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
              <div className="relative group">
                <div className="pointer-events-none">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 z-10 ${formData.email ? colors.text : 'text-gray-500'}`} />
                </div>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="off"
                  style={{
                    ...inputStyle,
                    paddingLeft: "3rem",
                    WebkitBoxShadow: '0 0 0 1000px transparent inset',
                  }}
                  className={`
                    ${errors.email ? "border-red-500/50" : ""}
                  `}
                />

                {/* Barra de progresso no fundo quando focado */}
                <motion.div
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${colors.primary}`}
                  initial={{ width: 0 }}
                  animate={{ width: formData.email ? "100%" : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-red-400"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password Field */}
            <motion.div
              className="space-y-1.5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="password" className="text-sm font-medium text-gray-300">Senha</label>
              <div className="relative group">
                <div className="pointer-events-none">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 z-10 ${formData.password ? colors.text : 'text-gray-500'}`} />
                </div>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="off"
                  style={{
                    ...inputStyle,
                    paddingLeft: "3rem",
                    paddingRight: "3rem",
                    WebkitBoxShadow: '0 0 0 1000px transparent inset',
                  }}
                  className={`
                    ${errors.password ? "border-red-500/50" : ""}
                  `}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-20 ${showPassword ? colors.text : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <AnimatePresence mode="wait">
                    {showPassword ? (
                      <motion.div
                        key="eyeoff"
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 180, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <EyeOff className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="eye"
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 180, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Eye className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                {/* Barra de progresso no fundo quando preenchido */}
                <motion.div
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${colors.primary} pointer-events-none`}
                  initial={{ width: 0 }}
                  animate={{ width: formData.password ? "100%" : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-red-400"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Remember Me & Forgot Password */}
            <motion.div
              className="flex items-center justify-between"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <motion.div
                    className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${formData.rememberMe ? `${colors.bg} ${colors.border}` : 'border-white/20 bg-white/5'}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <AnimatePresence>
                      {formData.rememberMe && (
                        <motion.svg
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{ duration: 0.2 }}
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Lembrar-me</span>
              </label>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05, x: 3 }}
                whileTap={{ scale: 0.95 }}
                className={`text-sm ${colors.text} hover:opacity-80 transition-colors relative`}
              >
                Esqueceu a senha?
                <motion.div
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${colors.primary}`}
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.button>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative"
              >
                {/* Anel brilhante ao redor do botão */}
                <motion.div
                  className={`absolute -inset-0.5 bg-gradient-to-r ${colors.primary} rounded-xl opacity-0 blur`}
                  whileHover={{ opacity: 0.7 }}
                  transition={{ duration: 0.3 }}
                />

                <button
                  type="submit"
                  style={goldButtonStyle}
                  disabled={isLoading}
                  className="relative overflow-hidden"
                >
                  {/* Efeito de brilho deslizante */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ["-100%", "100%"]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "linear"
                    }}
                  />

                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Entrando...
                      </>
                    ) : (
                      <>
                        Entrar como {currentRoleOption.title}
                        <motion.div
                          animate={{
                            x: [0, 3, 0],
                            y: [0, -2, 0]
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            repeatDelay: 1
                          }}
                        >
                          <Send className="w-4 h-4" />
                        </motion.div>
                      </>
                    )}
                  </span>
                </button>
              </motion.div>
            </motion.div>
          </form>

          {/* Divider */}
          <div className="relative my-5 z-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-gray-500 text-xs" style={{ background: "#050400" }}>Ou continue com</span>
            </div>
          </div>

          {/* Social Login */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <motion.button
              type="button"
              onClick={async () => {
                console.log('🔵 [Login.tsx] Botão Google clicado. Role selecionado:', selectedRole);
                setIsGoogleLoading(true);
                try {
                  console.log('📞 [Login.tsx] Chamando loginWithGoogle do AuthContext...');
                  await loginWithGoogle(selectedRole);
                  console.log('✅ [Login.tsx] loginWithGoogle concluído sem erros');
                } catch (error: any) {
                  console.error('❌ [Login.tsx] Erro capturado no onClick:', error);
                  console.error('❌ [Login.tsx] Mensagem:', error.message);
                  setErrors((prev) => ({
                    ...prev,
                    general: error.message || "Erro ao fazer login com Google",
                  }));
                  setIsGoogleLoading(false);
                }
              }}
              whileHover={{ scale: isGoogleLoading ? 1 : 1.03, y: isGoogleLoading ? 0 : -2 }}
              whileTap={{ scale: isGoogleLoading ? 1 : 0.97 }}
              style={ghostButtonStyle}
              className="flex items-center justify-center gap-2 h-10 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || isGoogleLoading || isFacebookLoading}
            >
              {/* Efeito de onda no hover */}
              {!isGoogleLoading && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
              )}

              {/* Spinner de carregamento */}
              {isGoogleLoading && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-red-500/20 to-yellow-500/20"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              )}

              {isGoogleLoading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full relative z-10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="relative z-10">Conectando...</span>
                </>
              ) : (
                <>
                  <motion.svg
                    className="w-4 h-4 relative z-10"
                    viewBox="0 0 24 24"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </motion.svg>
                  <span className="relative z-10">Google</span>
                </>
              )}
            </motion.button>

            <motion.button
              type="button"
              onClick={async () => {
                console.log('🔵 [Login.tsx] Botão Facebook clicado. Role selecionado:', selectedRole);
                setIsFacebookLoading(true);
                try {
                  console.log('📞 [Login.tsx] Chamando loginWithFacebook do AuthContext...');
                  await loginWithFacebook(selectedRole);
                  console.log('✅ [Login.tsx] loginWithFacebook concluído sem erros');
                } catch (error: any) {
                  console.error('❌ [Login.tsx] Erro capturado no onClick:', error);
                  console.error('❌ [Login.tsx] Mensagem:', error.message);
                  setErrors((prev) => ({
                    ...prev,
                    general: error.message || "Erro ao fazer login com Facebook",
                  }));
                  setIsFacebookLoading(false);
                }
              }}
              whileHover={{ scale: isFacebookLoading ? 1 : 1.03, y: isFacebookLoading ? 0 : -2 }}
              whileTap={{ scale: isFacebookLoading ? 1 : 0.97 }}
              style={ghostButtonStyle}
              className="flex items-center justify-center gap-2 h-10 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || isGoogleLoading || isFacebookLoading}
            >
              {/* Efeito de onda no hover */}
              {!isFacebookLoading && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
              )}

              {/* Spinner de carregamento */}
              {isFacebookLoading && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#1877F2]/20 via-[#1877F2]/30 to-[#1877F2]/20"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              )}

              {isFacebookLoading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full relative z-10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="relative z-10">Conectando...</span>
                </>
              ) : (
                <>
                  <motion.svg
                    className="w-4 h-4 text-[#1877F2] relative z-10"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </motion.svg>
                  <span className="relative z-10">Facebook</span>
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Sign Up Link */}
          <motion.div
            className="mt-5 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-xs text-gray-500">
              Não tem uma conta?{" "}
              <motion.button
                type="button"
                onClick={() => navigate('/register')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`font-semibold ${colors.text} hover:opacity-80 transition-colors relative inline-block`}
              >
                Cadastre-se
                <motion.div
                  className={`absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r ${colors.primary}`}
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.button>
            </p>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="mt-6 text-center relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <p className="text-xs text-gray-600">© 2024 BarberPro. Todos os direitos reservados.</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
