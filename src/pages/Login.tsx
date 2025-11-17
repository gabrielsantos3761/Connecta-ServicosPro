import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, User, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth, UserRole } from "@/contexts/AuthContext";

export function Login() {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("client");
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

    // Limpar erro ao digitar
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
    }
  };

  const roleOptions = [
    {
      role: "client" as UserRole,
      title: "Cliente",
      description: "Agende seus horários",
      icon: User,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-500",
    },
    {
      role: "owner" as UserRole,
      title: "Proprietário",
      description: "Gerencie sua barbearia",
      icon: Crown,
      color: "text-gold",
      bgColor: "bg-gold-light",
      borderColor: "border-gold",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23D4AF37' fillOpacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: "30px 30px",
          }}
        ></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          animate={{
            borderColor:
              selectedRole === "client"
                ? "rgba(37, 99, 235, 0.3)"
                : "rgba(212, 175, 55, 0.2)",
          }}
          transition={{ duration: 0.3 }}
        >
          <Card
            className={`shadow-2xl transition-colors duration-300 ${
              selectedRole === "client"
                ? "border-blue-500/30"
                : "border-gold/20"
            }`}
          >
            <CardContent className="p-8">
              {/* Logo */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-8"
              >
                <motion.div
                  animate={{
                    backgroundColor:
                      selectedRole === "client" ? "#2563eb" : "#D4AF37",
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg overflow-hidden"
                >
                  <img
                    src="/Connecta-ServicosPro/assets/images/Logo.png"
                    alt="Logo BarberPro"
                    className="w-full h-full object-cover scale-110"
                  />
                </motion.div>
              </motion.div>

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Bem-vindo de volta
                </h1>
                <p className="text-gray-600">Selecione como deseja acessar</p>
              </div>

              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedRole === option.role;

                  return (
                    <motion.button
                      key={option.role}
                      type="button"
                      onClick={() => setSelectedRole(option.role)}
                      className={`
                      relative p-4 rounded-lg border-2 transition-all
                      ${
                        isSelected
                          ? `${option.borderColor} ${option.bgColor}`
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }
                    `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        ${isSelected ? "bg-white" : option.bgColor}
                      `}
                        >
                          <Icon className={`w-6 h-6 ${option.color}`} />
                        </div>
                        <div>
                          <p
                            className={`font-semibold text-sm ${
                              isSelected ? option.color : "text-gray-700"
                            }`}
                          >
                            {option.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {option.description}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div
                          layoutId="selected-ring"
                          className={`absolute inset-0 border-2 rounded-lg ${option.borderColor}`}
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Demo Credentials */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedRole}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6"
                >
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    Credenciais de demonstração:
                  </p>
                  {selectedRole === "owner" ? (
                    <div className="text-xs text-gray-600">
                      <p>
                        Email:{" "}
                        <code className="bg-white px-1 py-0.5 rounded">
                          admin@barberpro.com
                        </code>
                      </p>
                      <p>
                        Senha:{" "}
                        <code className="bg-white px-1 py-0.5 rounded">
                          admin123
                        </code>
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600">
                      <p>
                        Email:{" "}
                        <code className="bg-white px-1 py-0.5 rounded">
                          cliente@email.com
                        </code>
                      </p>
                      <p>
                        Senha:{" "}
                        <code className="bg-white px-1 py-0.5 rounded">
                          cliente123
                        </code>
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* General Error */}
                {errors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                  >
                    {errors.general}
                  </motion.div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`pl-10 ${
                        errors.email
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className={`pl-10 pr-10 ${
                        errors.password
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500"
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className={`w-4 h-4 rounded border-gray-300 ${
                        selectedRole === "client"
                          ? "text-blue-600 focus:ring-blue-500"
                          : "text-gold focus:ring-gold"
                      }`}
                    />
                    <span className="text-sm text-gray-700">Lembrar-me</span>
                  </label>
                  <button
                    type="button"
                    className={`text-sm transition-colors ${
                      selectedRole === "client"
                        ? "text-blue-600 hover:text-blue-700"
                        : "text-gold hover:text-gold-dark"
                    }`}
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant={selectedRole === "client" ? "default" : "gold"}
                  className={`w-full ${
                    selectedRole === "client"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : ""
                  }`}
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    Ou continue com
                  </span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => console.log("Login com Google")}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => console.log("Login com Facebook")}
                  disabled={isLoading}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div>

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Não tem uma conta?{" "}
                  <button
                    type="button"
                    className={`font-semibold transition-colors ${
                      selectedRole === "client"
                        ? "text-blue-600 hover:text-blue-700"
                        : "text-gold hover:text-gold-dark"
                    }`}
                    onClick={() => console.log("Ir para cadastro")}
                  >
                    Cadastre-se
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-400 mt-8"
        >
          © 2024 BarberPro. Todos os direitos reservados.
        </motion.p>
      </motion.div>
    </div>
  );
}
