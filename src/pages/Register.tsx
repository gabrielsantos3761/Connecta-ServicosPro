import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, User, ArrowLeft, Phone, CreditCard, Calendar, ChevronDown, Scissors, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { registerWithEmail } from "@/services/authService";
import type { UserRole } from "@/contexts/AuthContext";

// Country codes with flags
const countryCodes = [
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brasil', maxLength: 15 },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'EUA', maxLength: 14 },
  { code: '+351', country: 'PT', flag: '🇵🇹', name: 'Portugal', maxLength: 16 },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Espanha', maxLength: 15 },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'Reino Unido', maxLength: 16 },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina', maxLength: 16 },
];

export function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("client");
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]); // Brasil por padrão
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
    phone: "",
    gender: "",
    birthDate: "",
    cnpj: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
    phone: "",
    gender: "",
    birthDate: "",
    cnpj: "",
    general: "",
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');

    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;

    // Verifica se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let firstDigit = 11 - (sum % 11);
    if (firstDigit >= 10) firstDigit = 0;

    if (parseInt(cleanCPF.charAt(9)) !== firstDigit) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    let secondDigit = 11 - (sum % 11);
    if (secondDigit >= 10) secondDigit = 0;

    if (parseInt(cleanCPF.charAt(10)) !== secondDigit) return false;

    return true;
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 10 || cleanPhone.length === 11;
  };

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 11) {
      return cleanValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const validateCNPJ = (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    if (cleanCNPJ.length !== 14) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

    // Validação dos dígitos verificadores
    let length = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, length);
    const digits = cleanCNPJ.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cleanCNPJ.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  };

  const formatCNPJ = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 14) {
      return cleanValue
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const formatPhone = (value: string, countryCode: string = '+55') => {
    const cleanValue = value.replace(/\D/g, '');

    // Formatação para Brasil (+55)
    if (countryCode === '+55') {
      if (cleanValue.length <= 11) {
        if (cleanValue.length <= 10) {
          return cleanValue
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
        }
        return cleanValue
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2');
      }
    }

    // Formatação genérica para outros países
    return cleanValue;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      cpf: "",
      phone: "",
      gender: "",
      birthDate: "",
      cnpj: "",
      general: "",
    };

    if (!formData.name) {
      newErrors.name = "Nome é obrigatório";
    }

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirme sua senha";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    if (!formData.cpf) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
    }

    if (!formData.phone) {
      newErrors.phone = "Telefone é obrigatório";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Telefone inválido";
    }

    if (!formData.gender) {
      newErrors.gender = "Gênero é obrigatório";
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "Data de nascimento é obrigatória";
    }

    // Validação do CNPJ (opcional para proprietários e profissionais)
    if ((selectedRole === 'owner' || selectedRole === 'professional') && formData.cnpj && !validateCNPJ(formData.cnpj)) {
      newErrors.cnpj = "CNPJ inválido";
    }

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(error => error !== "");

    if (!hasErrors) {
      setIsLoading(true);
      try {
        console.log('🚀 Iniciando registro...', { email: formData.email, role: selectedRole });

        const additionalData: any = {
          cpf: formData.cpf.replace(/\D/g, ''),
          phone: `${selectedCountry.code}${formData.phone.replace(/\D/g, '')}`,
          gender: formData.gender,
          birthDate: formData.birthDate,
        };

        // Adiciona CNPJ se preenchido (opcional para proprietários e profissionais)
        if (formData.cnpj && (selectedRole === 'owner' || selectedRole === 'professional')) {
          additionalData.cnpj = formData.cnpj.replace(/\D/g, '');
        }

        const result = await registerWithEmail(formData.email, formData.password, formData.name, selectedRole, additionalData);

        console.log('✅ Registro bem-sucedido!', result);
        console.log('📍 Redirecionando para login com credenciais pré-preenchidas');

        // Redirecionar para login com email e role pré-preenchidos
        navigate(`/login?email=${encodeURIComponent(formData.email)}&role=${selectedRole}`);
      } catch (error: any) {
        console.error('❌ Erro no registro:', error);
        setErrors((prev) => ({
          ...prev,
          general: error.message || "Erro ao criar conta. Tente novamente.",
        }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    let formattedValue = value;
    if (name === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (name === 'phone') {
      formattedValue = formatPhone(value, selectedCountry.code);
    } else if (name === 'cnpj') {
      formattedValue = formatCNPJ(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
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
      value: "client" as UserRole,
      label: "Cliente",
      icon: User,
      color: "from-blue-500 to-blue-600",
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
      value: "professional" as UserRole,
      label: "Profissional",
      icon: Scissors,
      color: "from-emerald-500 to-green-600",
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
      value: "owner" as UserRole,
      label: "Proprietário",
      icon: Crown,
      color: "from-gold to-yellow-600",
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

  const currentRoleOption = roleOptions.find(r => r.value === selectedRole)!;
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
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          animate={{ borderColor: colors.borderColor }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border shadow-2xl p-8"
          style={{ boxShadow: `0 25px 50px -12px ${colors.cardShadow}` }}
        >

          {/* Botão Voltar - Para Login */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="absolute top-4 left-4 w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all z-10"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>

          {/* Botão Voltar - Para desfazer seleção de role */}
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

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Criar Conta</h1>
            <p className="text-gray-400 text-sm">Preencha seus dados para começar</p>
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
                >
                  <Label className="text-sm font-medium text-gray-300 mb-2 block">Tipo de conta</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {roleOptions.map((option, index) => {
                      const Icon = option.icon;
                      const isSelected = selectedRole === option.value;

                      return (
                        <motion.button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelectRole(option.value)}
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
                            {option.label}
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>
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
                    <p className="font-bold text-white">{currentRoleOption.label}</p>
                    <p className={`text-sm ${colors.text}`}>Criar conta</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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

            {/* Name Field */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-gray-300">Nome completo</Label>
              <div className="relative">
                <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${colors.text}`} />
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={handleChange}
                  className={`
                    w-full h-11 pl-12 pr-4 bg-white/5 border rounded-xl text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 transition-all
                    ${errors.name ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                  `}
                />
              </div>
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* CPF Field */}
            <div className="space-y-1.5">
              <Label htmlFor="cpf" className="text-sm font-medium text-gray-300">CPF</Label>
              <div className="relative">
                <CreditCard className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${colors.text}`} />
                <input
                  id="cpf"
                  name="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={handleChange}
                  maxLength={14}
                  className={`
                    w-full h-11 pl-12 pr-4 bg-white/5 border rounded-xl text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 transition-all
                    ${errors.cpf ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                  `}
                />
              </div>
              {errors.cpf && <p className="text-xs text-red-400">{errors.cpf}</p>}
            </div>

            {/* Phone Field */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-300">Telefone</Label>
              <div className="relative flex gap-2">
                {/* Country Code Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    onBlur={() => setTimeout(() => setShowCountryDropdown(false), 200)}
                    className="h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <span className="text-xl">{selectedCountry.flag}</span>
                    <span className="text-sm">{selectedCountry.code}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* Dropdown */}
                  {showCountryDropdown && (
                    <div className="absolute top-full mt-1 left-0 w-64 bg-gray-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                      {countryCodes.map((country) => (
                        <button
                          key={country.country}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowCountryDropdown(false);
                          }}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                        >
                          <span className="text-2xl">{country.flag}</span>
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">{country.name}</p>
                            <p className="text-gray-400 text-xs">{country.code}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone Input */}
                <div className="relative flex-1">
                  <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${colors.text}`} />
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    placeholder={selectedCountry.country === 'BR' ? '(00) 00000-0000' : 'Número de telefone'}
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={selectedCountry.maxLength}
                    className={`
                      w-full h-11 pl-12 pr-4 bg-white/5 border rounded-xl text-white placeholder-gray-500
                      focus:outline-none focus:ring-2 transition-all
                      ${errors.phone ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                    `}
                  />
                </div>
              </div>
              {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
            </div>

            {/* Gender and Birth Date in a row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Gender Field */}
              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-sm font-medium text-gray-300">Gênero</Label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`
                    w-full h-11 px-4 bg-white/5 border rounded-xl text-white
                    focus:outline-none focus:ring-2 transition-all
                    ${errors.gender ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                  `}
                >
                  <option value="" className="bg-gray-800">Selecione</option>
                  <option value="masculino" className="bg-gray-800">Masculino</option>
                  <option value="feminino" className="bg-gray-800">Feminino</option>
                  <option value="outro" className="bg-gray-800">Outro</option>
                </select>
                {errors.gender && <p className="text-xs text-red-400">{errors.gender}</p>}
              </div>

              {/* Birth Date Field */}
              <div className="space-y-1.5">
                <Label htmlFor="birthDate" className="text-sm font-medium text-gray-300">Nascimento</Label>
                <div className="relative">
                  <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${colors.text}`} />
                  <input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className={`
                      w-full h-11 pl-12 pr-4 bg-white/5 border rounded-xl text-white
                      focus:outline-none focus:ring-2 transition-all
                      ${errors.birthDate ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                    `}
                  />
                </div>
                {errors.birthDate && <p className="text-xs text-red-400">{errors.birthDate}</p>}
              </div>
            </div>

            {/* CNPJ Field - Only for Professional and Owner */}
            {(selectedRole === 'professional' || selectedRole === 'owner') && (
              <div className="space-y-1.5">
                <Label htmlFor="cnpj" className="text-sm font-medium text-gray-300">
                  CNPJ <span className="text-gray-500 text-xs">(Opcional)</span>
                </Label>
                <div className="relative">
                  <CreditCard className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${colors.text}`} />
                  <input
                    id="cnpj"
                    name="cnpj"
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={handleChange}
                    maxLength={18}
                    className={`
                      w-full h-11 pl-12 pr-4 bg-white/5 border rounded-xl text-white placeholder-gray-500
                      focus:outline-none focus:ring-2 transition-all
                      ${errors.cnpj ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                    `}
                  />
                </div>
                {errors.cnpj && <p className="text-xs text-red-400">{errors.cnpj}</p>}
              </div>
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
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
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
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">Confirmar senha</Label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${colors.text}`} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`
                    w-full h-11 pl-12 pr-12 bg-white/5 border rounded-xl text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 transition-all
                    ${errors.confirmPassword ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
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
                    Criando conta...
                  </div>
                ) : (
                  "Criar conta"
                )}
              </Button>
            </motion.div>
          </form>

          {/* Login Link */}
          <div className="mt-5 text-center">
            <p className="text-xs text-gray-500">
              Já tem uma conta?{" "}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={`font-semibold ${colors.text} hover:opacity-80 transition-colors`}
              >
                Faça login
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
