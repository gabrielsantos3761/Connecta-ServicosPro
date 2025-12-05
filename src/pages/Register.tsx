import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, User, ArrowLeft, Phone, CreditCard, Calendar, ChevronDown, Scissors, Crown, AlertCircle, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { registerWithEmail, checkEmailExists, addRoleWithPassword } from "@/services/authService";
import type { UserRole } from "@/contexts/AuthContext";
import {
  sanitizeString,
  isValidEmail,
  isValidCPF,
  isValidCNPJ,
  isValidPhone,
  isValidPassword,
  getPasswordStrength,
  detectXSS,
  detectSQLInjection
} from "@/lib/securityUtils";

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
  const [emailExists, setEmailExists] = useState(false);
  const [existingUserData, setExistingUserData] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // 1: Tipo de conta, 2: Dados pessoais, 3: Credenciais

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

  // SEGURANÇA: Mostra força da senha
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const handlePasswordChange = (password: string) => {
    setFormData(prev => ({ ...prev, password }));
    setPasswordStrength(getPasswordStrength(password));

    if (errors.password) {
      setErrors(prev => ({ ...prev, password: "" }));
    }
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

    // SEGURANÇA: Sanitizar inputs
    const sanitizedName = sanitizeString(formData.name);
    const sanitizedEmail = sanitizeString(formData.email);

    // Validar nome
    if (!sanitizedName) {
      newErrors.name = "Nome é obrigatório";
    } else if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      newErrors.name = "Nome deve ter entre 2 e 100 caracteres";
    } else if (detectXSS(sanitizedName) || detectSQLInjection(sanitizedName)) {
      newErrors.name = "Nome contém caracteres inválidos";
    }

    // Validar email
    if (!sanitizedEmail) {
      newErrors.email = "Email é obrigatório";
    } else if (!isValidEmail(sanitizedEmail)) {
      newErrors.email = "Email inválido";
    } else if (detectXSS(sanitizedEmail)) {
      newErrors.email = "Email contém caracteres inválidos";
    }

    // Validar senha
    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = "Senha deve ter no mínimo 8 caracteres, incluindo letras e números";
    }

    // Validar confirmação de senha
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirme sua senha";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    // Validar CPF
    if (!formData.cpf) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!isValidCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
    }

    // Validar telefone
    const fullPhone = `${selectedCountry.code}${formData.phone.replace(/\D/g, '')}`;
    if (!formData.phone) {
      newErrors.phone = "Telefone é obrigatório";
    } else if (!isValidPhone(fullPhone)) {
      newErrors.phone = "Telefone inválido";
    }

    // Validar gênero
    if (!formData.gender) {
      newErrors.gender = "Gênero é obrigatório";
    }

    // Validar data de nascimento
    if (!formData.birthDate) {
      newErrors.birthDate = "Data de nascimento é obrigatória";
    }

    // Validar CNPJ (opcional para profissionais e proprietários)
    if ((selectedRole === 'owner' || selectedRole === 'professional') && formData.cnpj && !isValidCNPJ(formData.cnpj)) {
      newErrors.cnpj = "CNPJ inválido";
    }

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(error => error !== "");

    if (!hasErrors) {
      setIsLoading(true);
      try {
        console.log('🚀 Iniciando registro...', { email: formData.email, role: selectedRole });

        // SEGURANÇA: Usar valores sanitizados
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

        const result = await registerWithEmail(
          sanitizedEmail,
          formData.password,
          sanitizedName,
          selectedRole,
          additionalData
        );

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

    // SEGURANÇA: Limitar tamanho dos inputs
    const maxLengths: Record<string, number> = {
      name: 100,
      email: 254,
      password: 128,
      confirmPassword: 128,
      cpf: 14,
      phone: 20,
      cnpj: 18,
      birthDate: 10,
    };

    let formattedValue = value;

    // Limitar tamanho
    if (maxLengths[name]) {
      formattedValue = formattedValue.substring(0, maxLengths[name]);
    }

    // Aplicar formatação
    if (name === 'cpf') {
      formattedValue = formatCPF(formattedValue);
    } else if (name === 'phone') {
      formattedValue = formatPhone(formattedValue, selectedCountry.code);
    } else if (name === 'cnpj') {
      formattedValue = formatCNPJ(formattedValue);
    } else if (name === 'password') {
      // Atualizar força da senha
      setPasswordStrength(getPasswordStrength(formattedValue));
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
  };

  const handleNextStep = () => {
    // Validar campos da etapa atual antes de avançar
    if (currentStep === 1) {
      // Etapa 1: Tipo de conta já selecionado
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validar dados pessoais
      const newErrors = {
        name: "",
        cpf: "",
        phone: "",
        gender: "",
        birthDate: "",
        cnpj: "",
      };

      // SEGURANÇA: Validar com funções seguras
      const sanitizedName = sanitizeString(formData.name);

      if (!sanitizedName) {
        newErrors.name = "Nome é obrigatório";
      } else if (detectXSS(sanitizedName) || detectSQLInjection(sanitizedName)) {
        newErrors.name = "Nome contém caracteres inválidos";
      }

      if (!formData.cpf) {
        newErrors.cpf = "CPF é obrigatório";
      } else if (!isValidCPF(formData.cpf)) {
        newErrors.cpf = "CPF inválido";
      }

      const fullPhone = `${selectedCountry.code}${formData.phone.replace(/\D/g, '')}`;
      if (!formData.phone) {
        newErrors.phone = "Telefone é obrigatório";
      } else if (!isValidPhone(fullPhone)) {
        newErrors.phone = "Telefone inválido";
      }

      if (!formData.gender) newErrors.gender = "Gênero é obrigatório";
      if (!formData.birthDate) newErrors.birthDate = "Data de nascimento é obrigatória";

      if ((selectedRole === 'professional' || selectedRole === 'owner') && formData.cnpj && !isValidCNPJ(formData.cnpj)) {
        newErrors.cnpj = "CNPJ inválido";
      }

      setErrors(prev => ({ ...prev, ...newErrors }));

      const hasErrors = Object.values(newErrors).some(error => error !== "");
      if (!hasErrors) {
        setCurrentStep(3);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEmailBlur = async () => {
    const sanitizedEmail = sanitizeString(formData.email);
    if (sanitizedEmail && isValidEmail(sanitizedEmail)) {
      const result = await checkEmailExists(sanitizedEmail);
      if (result.exists && result.userData) {
        // Verifica se o usuário já possui o role selecionado
        if (result.userData.roles.includes(selectedRole)) {
          setErrors(prev => ({
            ...prev,
            email: `Este email já está cadastrado como ${selectedRole === 'client' ? 'Cliente' : selectedRole === 'professional' ? 'Profissional' : 'Proprietário'}. Faça login.`
          }));
          setEmailExists(false);
        } else {
          setEmailExists(true);
          setExistingUserData(result.userData);
          setErrors(prev => ({ ...prev, email: "" }));
        }
      } else {
        setEmailExists(false);
        setExistingUserData(null);
      }
    }
  };

  const handleUseExistingData = () => {
    if (existingUserData) {
      // Preenche os campos com os dados existentes
      setFormData(prev => ({
        ...prev,
        name: existingUserData.displayName || prev.name,
        phone: existingUserData.phone?.replace(selectedCountry.code, '') || prev.phone,
        cpf: existingUserData.cpf || prev.cpf,
        gender: existingUserData.gender || prev.gender,
        birthDate: existingUserData.birthDate || prev.birthDate,
      }));
      setShowPasswordModal(true);
    }
  };

  const handleConfirmPassword = async () => {
    setPasswordError("");
    setIsLoading(true);

    try {
      const cnpj = formData.cnpj || undefined;
      await addRoleWithPassword(formData.email, confirmPassword, selectedRole, cnpj);

      console.log('✅ Novo role adicionado com sucesso!');
      navigate(`/login?email=${encodeURIComponent(formData.email)}&role=${selectedRole}`);
    } catch (error: any) {
      console.error('❌ Erro ao adicionar role:', error);
      setPasswordError(error.message || "Erro ao confirmar senha");
    } finally {
      setIsLoading(false);
    }
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

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Criar Conta</h1>
            <p className="text-gray-400 text-sm">
              {currentStep === 1 && "Selecione o tipo de conta"}
              {currentStep === 2 && "Informe seus dados pessoais"}
              {currentStep === 3 && "Crie suas credenciais de acesso"}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((step) => (
              <motion.div
                key={step}
                className="flex items-center"
              >
                <motion.div
                  animate={{
                    backgroundColor: currentStep >= step ? colors.glow : 'rgba(255, 255, 255, 0.1)',
                    scale: currentStep === step ? 1.2 : 1
                  }}
                  transition={{ duration: 0.3 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= step ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {step}
                </motion.div>
                {step < 3 && (
                  <motion.div
                    animate={{
                      backgroundColor: currentStep > step ? colors.glow : 'rgba(255, 255, 255, 0.1)'
                    }}
                    className="w-12 h-0.5 mx-1"
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Aviso de conta existente */}
          {emailExists && existingUserData && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-400">Conta encontrada!</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Você já possui uma conta como {existingUserData.roles.map((r: string) =>
                      r === 'client' ? 'Cliente' : r === 'professional' ? 'Profissional' : 'Proprietário'
                    ).join(', ')}. Clique abaixo para usar seus dados existentes.
                  </p>
                  <Button
                    type="button"
                    onClick={handleUseExistingData}
                    className="mt-3 w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 h-10 font-medium"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Usar dados existentes
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

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

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {/* STEP 1: Role Selection */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Role Selection */}
                  <div className="relative mb-6">
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
                              {option.label}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative"
                    >
                      <motion.div
                        className={`absolute -inset-0.5 bg-gradient-to-r ${colors.primary} rounded-xl opacity-0 blur`}
                        whileHover={{ opacity: 0.7 }}
                        transition={{ duration: 0.3 }}
                      />

                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className={`w-full h-11 bg-gradient-to-r ${colors.primary} hover:opacity-90 text-white font-semibold rounded-xl shadow-lg ${colors.shadow} transition-all relative overflow-hidden`}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "linear" }}
                        />
                        <span className="relative z-10">Próximo</span>
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}

              {/* STEP 2: Personal Data */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Name Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-300">Nome completo</Label>
                    <div className="relative group">
                      <div className="pointer-events-none">
                        <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 z-10 ${formData.name ? colors.text : 'text-gray-500'}`} />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Seu nome"
                        value={formData.name}
                        onChange={handleChange}
                        autoComplete="off"
                        style={{
                          backgroundColor: 'transparent',
                          WebkitBoxShadow: '0 0 0 1000px transparent inset'
                        }}
                        className={`
                          w-full h-11 pl-12 pr-4 bg-transparent border rounded-xl text-white placeholder-gray-500
                          focus:outline-none focus:ring-2 transition-all duration-300
                          ${errors.name ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                        `}
                      />
                      <motion.div
                        className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${colors.primary} pointer-events-none`}
                        initial={{ width: 0 }}
                        animate={{ width: formData.name ? "100%" : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-xs text-red-400"
                        >
                          {errors.name}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* CPF Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cpf" className="text-sm font-medium text-gray-300">CPF</Label>
                    <div className="relative group">
                      <div className="pointer-events-none">
                        <CreditCard className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 z-10 ${formData.cpf ? colors.text : 'text-gray-500'}`} />
                      </div>
                      <input
                        id="cpf"
                        name="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={handleChange}
                        maxLength={14}
                        autoComplete="off"
                        style={{
                          backgroundColor: 'transparent',
                          WebkitBoxShadow: '0 0 0 1000px transparent inset'
                        }}
                        className={`
                          w-full h-11 pl-12 pr-4 bg-transparent border rounded-xl text-white placeholder-gray-500
                          focus:outline-none focus:ring-2 transition-all duration-300
                          ${errors.cpf ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                        `}
                      />
                      <motion.div
                        className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${colors.primary} pointer-events-none`}
                        initial={{ width: 0 }}
                        animate={{ width: formData.cpf ? "100%" : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.cpf && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-xs text-red-400"
                        >
                          {errors.cpf}
                        </motion.p>
                      )}
                    </AnimatePresence>
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
                      <div className="relative flex-1 group">
                        <div className="pointer-events-none">
                          <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 z-10 ${formData.phone ? colors.text : 'text-gray-500'}`} />
                        </div>
                        <input
                          id="phone"
                          name="phone"
                          type="text"
                          placeholder={selectedCountry.country === 'BR' ? '(00) 00000-0000' : 'Número de telefone'}
                          value={formData.phone}
                          onChange={handleChange}
                          maxLength={selectedCountry.maxLength}
                          autoComplete="off"
                          style={{
                            backgroundColor: 'transparent',
                            WebkitBoxShadow: '0 0 0 1000px transparent inset'
                          }}
                          className={`
                            w-full h-11 pl-12 pr-4 bg-transparent border rounded-xl text-white placeholder-gray-500
                            focus:outline-none focus:ring-2 transition-all duration-300
                            ${errors.phone ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                          `}
                        />
                        <motion.div
                          className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${colors.primary} pointer-events-none`}
                          initial={{ width: 0 }}
                          animate={{ width: formData.phone ? "100%" : 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                    <AnimatePresence>
                      {errors.phone && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-xs text-red-400"
                        >
                          {errors.phone}
                        </motion.p>
                      )}
                    </AnimatePresence>
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
                      <div className="relative group">
                        <div className="pointer-events-none">
                          <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 z-10 ${formData.birthDate ? colors.text : 'text-gray-500'}`} />
                        </div>
                        <input
                          id="birthDate"
                          name="birthDate"
                          type="date"
                          value={formData.birthDate}
                          onChange={handleChange}
                          autoComplete="off"
                          style={{
                            backgroundColor: 'transparent',
                            WebkitBoxShadow: '0 0 0 1000px transparent inset'
                          }}
                          className={`
                            w-full h-11 pl-12 pr-4 bg-transparent border rounded-xl text-white
                            focus:outline-none focus:ring-2 transition-all duration-300
                            ${errors.birthDate ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                          `}
                        />
                        <motion.div
                          className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${colors.primary} pointer-events-none`}
                          initial={{ width: 0 }}
                          animate={{ width: formData.birthDate ? "100%" : 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <AnimatePresence>
                        {errors.birthDate && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-xs text-red-400"
                          >
                            {errors.birthDate}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* CNPJ Field - Only for Professional and Owner */}
                  {(selectedRole === 'professional' || selectedRole === 'owner') && (
                    <div className="space-y-1.5">
                      <Label htmlFor="cnpj" className="text-sm font-medium text-gray-300">
                        CNPJ <span className="text-gray-500 text-xs">(Opcional)</span>
                      </Label>
                      <div className="relative group">
                        <div className="pointer-events-none">
                          <CreditCard className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 z-10 ${formData.cnpj ? colors.text : 'text-gray-500'}`} />
                        </div>
                        <input
                          id="cnpj"
                          name="cnpj"
                          type="text"
                          placeholder="00.000.000/0000-00"
                          value={formData.cnpj}
                          onChange={handleChange}
                          maxLength={18}
                          autoComplete="off"
                          style={{
                            backgroundColor: 'transparent',
                            WebkitBoxShadow: '0 0 0 1000px transparent inset'
                          }}
                          className={`
                            w-full h-11 pl-12 pr-4 bg-transparent border rounded-xl text-white placeholder-gray-500
                            focus:outline-none focus:ring-2 transition-all duration-300
                            ${errors.cnpj ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                          `}
                        />
                        <motion.div
                          className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${colors.primary} pointer-events-none`}
                          initial={{ width: 0 }}
                          animate={{ width: formData.cnpj ? "100%" : 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <AnimatePresence>
                        {errors.cnpj && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-xs text-red-400"
                          >
                            {errors.cnpj}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-3 pt-2">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        type="button"
                        onClick={handlePreviousStep}
                        className="w-full h-11 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all"
                      >
                        Voltar
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-[2] relative"
                    >
                      <motion.div
                        className={`absolute -inset-0.5 bg-gradient-to-r ${colors.primary} rounded-xl opacity-0 blur`}
                        whileHover={{ opacity: 0.7 }}
                        transition={{ duration: 0.3 }}
                      />
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className={`w-full h-11 bg-gradient-to-r ${colors.primary} hover:opacity-90 text-white font-semibold rounded-xl shadow-lg ${colors.shadow} transition-all relative overflow-hidden`}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "linear" }}
                        />
                        <span className="relative z-10">Próximo</span>
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Credentials */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-300">Email</Label>
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
                        onBlur={handleEmailBlur}
                        autoComplete="off"
                        style={{
                          backgroundColor: 'transparent',
                          WebkitBoxShadow: '0 0 0 1000px transparent inset'
                        }}
                        className={`
                          w-full h-11 pl-12 pr-4 bg-transparent border rounded-xl text-white placeholder-gray-500
                          focus:outline-none focus:ring-2 transition-all duration-300
                          ${errors.email ? "border-red-500/50 focus:ring-red-500/30" : emailExists ? `border-green-500/50 ${colors.ring}` : `border-white/10 ${colors.ring}`}
                        `}
                      />
                      <motion.div
                        className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${colors.primary} pointer-events-none`}
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
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-300">Senha</Label>
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
                          backgroundColor: 'transparent',
                          WebkitBoxShadow: '0 0 0 1000px transparent inset'
                        }}
                        className={`
                          w-full h-11 pl-12 pr-12 bg-transparent border rounded-xl text-white placeholder-gray-500
                          focus:outline-none focus:ring-2 transition-all duration-300
                          ${errors.password ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
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
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">Confirmar senha</Label>
                    <div className="relative group">
                      <div className="pointer-events-none">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 z-10 ${formData.confirmPassword ? colors.text : 'text-gray-500'}`} />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        autoComplete="off"
                        style={{
                          backgroundColor: 'transparent',
                          WebkitBoxShadow: '0 0 0 1000px transparent inset'
                        }}
                        className={`
                          w-full h-11 pl-12 pr-12 bg-transparent border rounded-xl text-white placeholder-gray-500
                          focus:outline-none focus:ring-2 transition-all duration-300
                          ${errors.confirmPassword ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                        `}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-20 ${showConfirmPassword ? colors.text : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        <AnimatePresence mode="wait">
                          {showConfirmPassword ? (
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
                      <motion.div
                        className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${colors.primary} pointer-events-none`}
                        initial={{ width: 0 }}
                        animate={{ width: formData.confirmPassword ? "100%" : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-xs text-red-400"
                        >
                          {errors.confirmPassword}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Navigation & Submit Buttons */}
                  <div className="flex gap-3 pt-2">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        type="button"
                        onClick={handlePreviousStep}
                        className="w-full h-11 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all"
                      >
                        Voltar
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-[2] relative"
                    >
                      <motion.div
                        className={`absolute -inset-0.5 bg-gradient-to-r ${colors.primary} rounded-xl opacity-0 blur`}
                        whileHover={{ opacity: 0.7 }}
                        transition={{ duration: 0.3 }}
                      />
                      <Button
                        type="submit"
                        className={`w-full h-11 bg-gradient-to-r ${colors.primary} hover:opacity-90 text-white font-semibold rounded-xl shadow-lg ${colors.shadow} transition-all relative overflow-hidden`}
                        disabled={isLoading}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "linear" }}
                        />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isLoading ? (
                            <>
                              <motion.div
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              />
                              Criando conta...
                            </>
                          ) : (
                            <>
                              Criar conta
                              <motion.div
                                animate={{ x: [0, 3, 0], y: [0, -2, 0] }}
                                transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                              >
                                <Send className="w-4 h-4" />
                              </motion.div>
                            </>
                          )}
                        </span>
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Login Link */}
          <motion.div
            className="mt-5 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-xs text-gray-500">
              Já tem uma conta?{" "}
              <motion.button
                type="button"
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`font-semibold ${colors.text} hover:opacity-80 transition-colors relative inline-block`}
              >
                Faça login
                <motion.div
                  className={`absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r ${colors.primary}`}
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.button>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Modal de Confirmação de Senha */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.primary} flex items-center justify-center flex-shrink-0`}>
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">Confirmar Identidade</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Digite sua senha para adicionar o perfil de{" "}
                    <span className={colors.text}>
                      {selectedRole === 'client' ? 'Cliente' : selectedRole === 'professional' ? 'Profissional' : 'Proprietário'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Informações preenchidas */}
              <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs font-medium text-gray-400 mb-2">Dados que serão utilizados:</p>
                <div className="space-y-1 text-sm text-white">
                  <p>✓ Nome: {formData.name}</p>
                  <p>✓ CPF: {formData.cpf}</p>
                  <p>✓ Telefone: {formData.phone}</p>
                  {formData.cnpj && <p>✓ CNPJ: {formData.cnpj}</p>}
                </div>
              </div>

              {/* Campo de senha */}
              <div className="space-y-2 mb-6">
                <Label htmlFor="modal-password" className="text-sm font-medium text-gray-300">
                  Senha da conta existente
                </Label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${colors.text}`} />
                  <input
                    id="modal-password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleConfirmPassword()}
                    className={`
                      w-full h-11 pl-12 pr-4 bg-white/5 border rounded-xl text-white placeholder-gray-500
                      focus:outline-none focus:ring-2 transition-all
                      ${passwordError ? "border-red-500/50 focus:ring-red-500/30" : `border-white/10 ${colors.ring}`}
                    `}
                    autoFocus
                  />
                </div>
                {passwordError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {passwordError}
                  </motion.p>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setConfirmPassword("");
                    setPasswordError("");
                  }}
                  variant="outline"
                  className="flex-1 border-white/10 text-white hover:bg-white/5"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmPassword}
                  className={`flex-1 bg-gradient-to-r ${colors.primary} hover:opacity-90 text-white`}
                  disabled={isLoading || !confirmPassword}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Confirmando...
                    </div>
                  ) : (
                    "Confirmar"
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
