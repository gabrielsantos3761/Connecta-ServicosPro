import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, User, Crown, Scissors, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

export function Login() {
  const { login, loginWithGoogle, loginWithFacebook, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("client");
  const [isFocused, setIsFocused] = useState(false);
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
      setIsFocused(true); // Foca automaticamente no role selecionado
    }
  }, [searchParams]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      email: "",
      password: "",
      general: "",
    };

    if (!formData.email) {
      newErrors.email = "Email é obrigatório";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 6) {
      newErrors.password = "Senha deve ter no mínimo 6 caracteres";
    }

    setErrors(newErrors);

    if (!newErrors.email && !newErrors.password) {
      try {
        await login(formData.email, formData.password, selectedRole);
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          general: "Email ou senha incorretos. Tente novamente.",
        }));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
    }
  };

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setIsFocused(true);
  };

  const handleBack = () => {
    setIsFocused(false);
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

  const getCredentials = () => {
    if (selectedRole === "owner") {
      return { email: "admin@barberpro.com", senha: "admin123" };
    } else if (selectedRole === "professional") {
      return { email: "profissional@barberpro.com", senha: "prof123" };
    }
    return { email: "cliente@email.com", senha: "cliente123" };
  };

  const currentRoleOption = roleOptions.find(r => r.role === selectedRole)!;
  const colors = currentRoleOption.colors;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
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
          animate={{ borderColor: colors.borderColor }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border shadow-2xl p-6 sm:p-8 relative"
          style={{ boxShadow: `0 25px 50px -12px ${colors.cardShadow}` }}
        >
          {/* Botão Voltar - Canto superior direito */}
          <AnimatePresence>
            {isFocused && (
              <motion.button
                type="button"
                onClick={handleBack}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all z-10"
              >
                <ArrowLeft className="w-4 h-4 text-gray-400" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-5"
          >
            <div className="relative">
              <motion.div
                animate={{ boxShadow: `0 10px 25px -5px ${colors.cardShadow}` }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center overflow-hidden"
              >
                <img
                  src="/Connecta-ServicosPro/assets/images/Logo.png"
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-1 rounded-2xl border border-gold/30"
              />
            </div>
          </motion.div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Bem-vindo de volta</h1>
            <p className="text-gray-400 text-sm">Selecione como deseja acessar</p>
          </div>

          {/* Role Selection - Com animação de foco suave */}
          <div className="relative mb-6">
            <AnimatePresence mode="wait">
              {!isFocused ? (
                /* 3 opções lado a lado */
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
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
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 * index, duration: 0.3 }}
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2
                          ${isSelected
                            ? `${option.colors.bgLight} ${option.colors.border}`
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                          }
                        `}
                      >
                        <div className={`
                          w-12 h-12 rounded-xl flex items-center justify-center transition-all
                          bg-gradient-to-br ${option.colors.primary} ${option.colors.shadow} shadow-lg
                        `}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <p className={`text-xs font-semibold ${isSelected ? "text-white" : "text-gray-400"}`}>
                          {option.title}
                        </p>
                      </motion.button>
                    );
                  })}
                </motion.div>
              ) : (
                /* Ícone focado grande - centralizado */
                <motion.div
                  key="focused"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="flex items-center justify-center gap-4"
                >
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                    className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center
                      bg-gradient-to-br ${colors.primary} ${colors.shadow} shadow-2xl
                    `}
                  >
                    <currentRoleOption.icon className="w-8 h-8 text-white" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="text-left"
                  >
                    <p className="font-bold text-white">{currentRoleOption.title}</p>
                    <p className={`text-sm ${colors.text}`}>{currentRoleOption.description}</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Demo Credentials */}
          <motion.div
            key={selectedRole}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${colors.bgLight} border ${colors.border}/30 rounded-xl p-3 mb-5`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className={`w-3.5 h-3.5 ${colors.text}`} />
              <p className="text-xs font-medium text-gray-300">
                Credenciais de demonstração ({currentRoleOption.title})
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="text-white font-mono text-[11px] bg-black/30 px-2 py-1 rounded mt-0.5 truncate">
                  {getCredentials().email}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Senha:</span>
                <p className="text-white font-mono text-[11px] bg-black/30 px-2 py-1 rounded mt-0.5">
                  {getCredentials().senha}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-300">Email</Label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${colors.text}`} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`
                    w-full h-11 pl-12 pr-4 bg-white/5 border rounded-xl text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 transition-all
                    ${errors.email ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                  `}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-300">Senha</Label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${colors.text}`} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`
                    w-full h-11 pl-12 pr-12 bg-white/5 border rounded-xl text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 transition-all
                    ${errors.password ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 border-2 border-white/20 rounded bg-white/5 transition-all flex items-center justify-center ${formData.rememberMe ? `${colors.bg} ${colors.border}` : ''}`}>
                    {formData.rememberMe && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Lembrar-me</span>
              </label>
              <button type="button" className={`text-sm ${colors.text} hover:opacity-80 transition-colors`}>
                Esqueceu a senha?
              </button>
            </div>

            {/* Submit Button */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                type="submit"
                className={`w-full h-11 bg-gradient-to-r ${colors.primary} hover:opacity-90 text-white font-semibold rounded-xl shadow-lg ${colors.shadow} transition-all`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  <>Entrar como {currentRoleOption.title}</>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-gray-800 text-gray-500 text-xs">Ou continue com</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              onClick={async () => {
                try {
                  await loginWithGoogle(selectedRole);
                } catch (error: any) {
                  setErrors((prev) => ({
                    ...prev,
                    general: error.message || "Erro ao fazer login com Google",
                  }));
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 h-10 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 hover:border-white/20 transition-all text-sm"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </motion.button>
            <motion.button
              type="button"
              onClick={async () => {
                try {
                  await loginWithFacebook(selectedRole);
                } catch (error: any) {
                  setErrors((prev) => ({
                    ...prev,
                    general: error.message || "Erro ao fazer login com Facebook",
                  }));
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 h-10 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 hover:border-white/20 transition-all text-sm"
              disabled={isLoading}
            >
              <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </motion.button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-5 text-center">
            <p className="text-xs text-gray-500">
              Não tem uma conta?{" "}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className={`font-semibold ${colors.text} hover:opacity-80 transition-colors`}
              >
                Cadastre-se
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">© 2024 BarberPro. Todos os direitos reservados.</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
