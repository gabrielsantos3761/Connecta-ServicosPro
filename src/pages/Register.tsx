import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  CreditCard,
  Calendar,
  Scissors,
  Crown,
  AlertCircle,
  CheckCircle,
  Send,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  registerWithEmail,
  checkEmailExists,
  addRoleWithPassword,
} from "@/services/authService";
import type { UserRole } from "@/contexts/AuthContext";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import en from "react-phone-number-input/locale/en";
import flags from "react-phone-number-input/flags";
import {
  sanitizeString,
  isValidEmail,
  isValidCPF,
  isValidCNPJ,
  isValidPhone,
  isValidPassword,
  detectXSS,
  detectSQLInjection,
} from "@/lib/securityUtils";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG = "#050400";
const GOLD = "#D4AF37";
const GOLD2 = "#B8941E";
const CARD_BG = "rgba(255,255,255,0.02)";
const CARD_BORDER = "1px solid rgba(255,255,255,0.07)";
const CARD_RADIUS = "1.125rem";
const MUTED = "rgba(255,255,255,0.5)";
const DIVIDER = "1px solid rgba(255,255,255,0.06)";
const SPRING = { type: "spring" as const, stiffness: 320, damping: 36 };

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.5rem",
  color: "#fff",
  padding: "0.75rem 1rem",
  outline: "none",
  width: "100%",
};

const inputWithIconStyle: React.CSSProperties = {
  ...inputStyle,
  paddingLeft: "3rem",
};

const inputWithIconAndToggle: React.CSSProperties = {
  ...inputStyle,
  paddingLeft: "3rem",
  paddingRight: "3rem",
};

const goldBtnStyle: React.CSSProperties = {
  background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
  color: BG,
  fontWeight: 600,
  borderRadius: "0.5rem",
  padding: "0.75rem 1.5rem",
  border: "none",
  cursor: "pointer",
  width: "100%",
  fontSize: "0.875rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
};

const outlineBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  borderRadius: "0.5rem",
  padding: "0.75rem 1.5rem",
  border: "1px solid rgba(255,255,255,0.1)",
  cursor: "pointer",
  width: "100%",
  fontSize: "0.875rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 500,
  color: MUTED,
  marginBottom: "0.375rem",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
};

export function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("client");
  const [emailExists, setEmailExists] = useState(false);
  const [existingUserData, setExistingUserData] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // 1: Tipo de conta, 2: Dados pessoais, 3: Credenciais

  // Estados para dropdown customizado de países
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("BR");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showBirthDateCalendar, setShowBirthDateCalendar] = useState(false);
  const birthDateRef = useRef<HTMLDivElement>(null);
  const [birthDateInput, setBirthDateInput] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

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

  // Lista de países disponíveis
  const allCountries = getCountries();
  const filteredCountries = allCountries.filter((country) => {
    const countryName = en[country as keyof typeof en] || country;
    const countryCode = getCountryCallingCode(country as any);
    const searchLower = countrySearch.toLowerCase();
    return (
      countryName.toLowerCase().includes(searchLower) ||
      countryCode.includes(searchLower) ||
      country.toLowerCase().includes(searchLower)
    );
  });

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowCountryDropdown(false);
        setCountrySearch("");
      }
      if (
        birthDateRef.current &&
        !birthDateRef.current.contains(event.target as Node)
      ) {
        setShowBirthDateCalendar(false);
      }
    };

    if (showCountryDropdown || showBirthDateCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCountryDropdown, showBirthDateCalendar]);

  // Sincronizar input de data com formData
  useEffect(() => {
    if (formData.birthDate && !birthDateInput) {
      const [year, month, day] = formData.birthDate.split("-");
      setBirthDateInput(`${day}/${month}/${year}`);
    }
  }, [formData.birthDate, birthDateInput]);

  // Sincronizar calendário com data selecionada quando abrir
  useEffect(() => {
    if (showBirthDateCalendar && formData.birthDate) {
      const date = new Date(formData.birthDate + "T00:00:00");
      setSelectedYear(date.getFullYear());
      setSelectedMonth(date.getMonth());
    }
  }, [showBirthDateCalendar]);

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length <= 11) {
      return cleanValue
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  const formatCNPJ = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length <= 14) {
      return cleanValue
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  // Funções para o calendário de data de nascimento
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"];

  // Gerar lista de anos (dos últimos 100 anos até o ano atual)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 100; year--) {
      years.push(year);
    }
    return years;
  };

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    setSelectedMonth(newMonth);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setSelectedYear(newYear);
  };

  const previousMonth = () => {
    let newMonth = selectedMonth - 1;
    let newYear = selectedYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const nextMonth = () => {
    let newMonth = selectedMonth + 1;
    let newYear = selectedYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const formatBirthDate = (value: string) => {
    // Remove tudo exceto números
    const cleanValue = value.replace(/\D/g, "");

    // Formata como DD/MM/AAAA
    if (cleanValue.length <= 2) {
      return cleanValue;
    } else if (cleanValue.length <= 4) {
      return `${cleanValue.slice(0, 2)}/${cleanValue.slice(2)}`;
    } else {
      return `${cleanValue.slice(0, 2)}/${cleanValue.slice(
        2,
        4
      )}/${cleanValue.slice(4, 8)}`;
    }
  };

  const handleBirthDateInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    const formatted = formatBirthDate(value);
    setBirthDateInput(formatted);

    // Se tiver formato completo DD/MM/AAAA, converte para formato ISO
    if (formatted.length === 10) {
      const [day, month, year] = formatted.split("/");
      const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;

      // Validar se é uma data válida
      const testDate = new Date(isoDate);
      if (!isNaN(testDate.getTime())) {
        setFormData((prev) => ({ ...prev, birthDate: isoDate }));
        if (errors.birthDate) {
          setErrors((prev) => ({ ...prev, birthDate: "" }));
        }
      }
    }
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(selectedYear, selectedMonth, day);
    const formattedDate = selectedDate.toISOString().split("T")[0];
    setFormData((prev) => ({ ...prev, birthDate: formattedDate }));

    // Atualizar o input visual também
    const [year, month, dayNum] = formattedDate.split("-");
    setBirthDateInput(`${dayNum}/${month}/${year}`);

    setShowBirthDateCalendar(false);
    if (errors.birthDate) {
      setErrors((prev) => ({ ...prev, birthDate: "" }));
    }
  };

  const isDateSelected = (day: number) => {
    if (!formData.birthDate) return false;
    const selectedDate = new Date(formData.birthDate + "T00:00:00");
    const checkDate = new Date(selectedYear, selectedMonth, day);
    return selectedDate.toDateString() === checkDate.toDateString();
  };

  const isFutureDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(selectedYear, selectedMonth, day);
    return date > today;
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
      newErrors.password =
        "Senha deve ter no mínimo 8 caracteres, incluindo letras e números";
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
    if (!formData.phone) {
      newErrors.phone = "Telefone é obrigatório";
    } else if (!isValidPhone(formData.phone)) {
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
    if (
      (selectedRole === "owner" || selectedRole === "professional") &&
      formData.cnpj &&
      !isValidCNPJ(formData.cnpj)
    ) {
      newErrors.cnpj = "CNPJ inválido";
    }

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error !== "");

    if (!hasErrors) {
      setIsLoading(true);
      try {
        // SEGURANÇA: Usar valores sanitizados
        const additionalData: any = {
          cpf: formData.cpf.replace(/\D/g, ""),
          phone: formData.phone, // PhoneInput já retorna no formato internacional completo
          gender: formData.gender,
          birthDate: formData.birthDate,
        };

        // Adiciona CNPJ se preenchido (opcional para proprietários e profissionais)
        if (
          formData.cnpj &&
          (selectedRole === "owner" || selectedRole === "professional")
        ) {
          additionalData.cnpj = formData.cnpj.replace(/\D/g, "");
        }

        await registerWithEmail(
          sanitizedEmail,
          formData.password,
          sanitizedName,
          selectedRole,
          additionalData
        );

        // Redirecionar para login com email e role pré-preenchidos
        navigate(
          `/login?email=${encodeURIComponent(
            formData.email
          )}&role=${selectedRole}`
        );
      } catch (error: any) {
        console.error("❌ Erro no registro:", error);
        setErrors((prev) => ({
          ...prev,
          general: error.message || "Erro ao criar conta. Tente novamente.",
        }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
    if (name === "cpf") {
      formattedValue = formatCPF(formattedValue);
    } else if (name === "cnpj") {
      formattedValue = formatCNPJ(formattedValue);
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
      } else if (
        detectXSS(sanitizedName) ||
        detectSQLInjection(sanitizedName)
      ) {
        newErrors.name = "Nome contém caracteres inválidos";
      }

      if (!formData.cpf) {
        newErrors.cpf = "CPF é obrigatório";
      } else if (!isValidCPF(formData.cpf)) {
        newErrors.cpf = "CPF inválido";
      }

      if (!formData.phone) {
        newErrors.phone = "Telefone é obrigatório";
      } else if (!isValidPhone(formData.phone)) {
        newErrors.phone = "Telefone inválido";
      }

      if (!formData.gender) newErrors.gender = "Gênero é obrigatório";
      if (!formData.birthDate)
        newErrors.birthDate = "Data de nascimento é obrigatória";

      if (
        (selectedRole === "professional" || selectedRole === "owner") &&
        formData.cnpj &&
        !isValidCNPJ(formData.cnpj)
      ) {
        newErrors.cnpj = "CNPJ inválido";
      }

      setErrors((prev) => ({ ...prev, ...newErrors }));

      const hasErrors = Object.values(newErrors).some((error) => error !== "");
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
          setErrors((prev) => ({
            ...prev,
            email: `Este email já está cadastrado como ${
              selectedRole === "client"
                ? "Cliente"
                : selectedRole === "professional"
                ? "Profissional"
                : "Proprietário"
            }. Faça login.`,
          }));
          setEmailExists(false);
        } else {
          setEmailExists(true);
          setExistingUserData(result.userData);
          setErrors((prev) => ({ ...prev, email: "" }));
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
      setFormData((prev) => ({
        ...prev,
        name: existingUserData.displayName || prev.name,
        phone: existingUserData.phone || prev.phone, // PhoneInput gerencia o formato automaticamente
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
      await addRoleWithPassword(
        formData.email,
        confirmPassword,
        selectedRole,
        cnpj
      );

      navigate(
        `/login?email=${encodeURIComponent(
          formData.email
        )}&role=${selectedRole}`
      );
    } catch (error: any) {
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
      accentColor: "#3B82F6",
      accentGlow: "rgba(59,130,246,0.25)",
    },
    {
      value: "professional" as UserRole,
      label: "Profissional",
      icon: Scissors,
      accentColor: "#10B981",
      accentGlow: "rgba(16,185,129,0.25)",
    },
    {
      value: "owner" as UserRole,
      label: "Proprietário",
      icon: Crown,
      accentColor: GOLD,
      accentGlow: "rgba(212,175,55,0.25)",
    },
  ];

  const currentRoleOption = roleOptions.find((r) => r.value === selectedRole)!;

  // ── Inline styles for error inputs ──────────────────────────────────────────
  const inputError: React.CSSProperties = {
    ...inputWithIconStyle,
    border: "1px solid rgba(239,68,68,0.5)",
  };

  const inputErrorWithToggle: React.CSSProperties = {
    ...inputWithIconAndToggle,
    border: "1px solid rgba(239,68,68,0.5)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Global autofill override */}
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

        /* Custom scrollbar */
        .dlx-scroll::-webkit-scrollbar { width: 6px; }
        .dlx-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 8px; }
        .dlx-scroll::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 8px; }
        .dlx-scroll::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.5); }

        /* Country dropdown */
        .dlx-country-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          max-height: 300px;
          background: #0e0c01;
          border: 1px solid rgba(212,175,55,0.2);
          border-radius: 0.75rem;
          box-shadow: 0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.08);
          z-index: 9999;
          overflow: hidden;
        }

        .dlx-country-search {
          position: sticky;
          top: 0;
          padding: 0.75rem;
          background: #0e0c01;
          border-bottom: ${DIVIDER};
          z-index: 10;
        }

        .dlx-country-search input {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 2.25rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.5rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
        }

        .dlx-country-search input:focus {
          border-color: rgba(212,175,55,0.4);
          box-shadow: 0 0 0 2px rgba(212,175,55,0.12);
        }

        .dlx-country-search input::placeholder { color: ${MUTED}; }

        .dlx-country-list { max-height: 232px; overflow-y: auto; }

        .dlx-country-item {
          padding: 0.625rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          border-bottom: ${DIVIDER};
          transition: background 0.15s;
          font-size: 0.875rem;
          color: #fff;
        }

        .dlx-country-item:hover { background: rgba(212,175,55,0.06); }
        .dlx-country-item.selected { background: rgba(212,175,55,0.04); }

        /* Birth-date calendar */
        .dlx-calendar {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          min-width: 320px;
          padding: 1.25rem;
          border-radius: ${CARD_RADIUS};
          border: 1px solid rgba(212,175,55,0.3);
          background: #0e0c01;
          box-shadow: 0 24px 48px rgba(0,0,0,0.85), 0 0 40px rgba(212,175,55,0.08);
          z-index: 10000;
        }

        .dlx-cal-header { display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1rem; }
        .dlx-cal-selectors { display:flex; gap:0.5rem; }
        .dlx-cal-select {
          flex:1; padding:0.5rem 0.75rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius:0.5rem; color:#fff; font-size:0.8125rem;
          outline:none; cursor:pointer;
        }
        .dlx-cal-select:hover { border-color: rgba(212,175,55,0.3); }
        .dlx-cal-select:focus { border-color: rgba(212,175,55,0.5); box-shadow:0 0 0 2px rgba(212,175,55,0.1); }
        .dlx-cal-select option { background:#0e0c01; color:#fff; }

        .dlx-cal-nav { display:flex; align-items:center; justify-content:space-between; }
        .dlx-cal-nav-btn {
          width:32px; height:32px; border-radius:50%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: ${MUTED}; display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:all 0.2s;
        }
        .dlx-cal-nav-btn:hover { background:rgba(212,175,55,0.1); border-color:rgba(212,175,55,0.3); color:${GOLD}; }

        .dlx-cal-day-names { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; margin-bottom:0.5rem; }
        .dlx-cal-day-name { text-align:center; font-size:0.6875rem; font-weight:600; padding:0.375rem; color:${MUTED}; }
        .dlx-cal-day-name:first-child, .dlx-cal-day-name:last-child { color:${GOLD}; opacity:0.7; }

        .dlx-cal-divider { height:1px; background:linear-gradient(to right,transparent,rgba(212,175,55,0.3),transparent); margin-bottom:0.5rem; }

        .dlx-cal-days { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
        .dlx-cal-day {
          width:36px; height:36px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:0.8125rem; font-weight:500;
          cursor:pointer; transition:all 0.15s; color:#fff;
          background:transparent; border:none;
        }
        .dlx-cal-day:not(.disabled):not(.selected):hover {
          background:rgba(212,175,55,0.1); color:${GOLD}; transform:scale(1.05);
        }
        .dlx-cal-day.selected {
          background:transparent; color:#fff;
          border:2px solid ${GOLD};
          box-shadow:0 0 0 3px rgba(212,175,55,0.15), 0 0 16px rgba(212,175,55,0.15);
          font-weight:700;
        }
        .dlx-cal-day.disabled { color:rgba(255,255,255,0.2); cursor:not-allowed; }

        .dlx-cal-legend { margin-top:1rem; padding-top:0.75rem; border-top:${DIVIDER}; display:flex; align-items:center; justify-content:center; gap:0.5rem; font-size:0.75rem; color:${MUTED}; }
        .dlx-cal-legend-dot { width:10px; height:10px; border-radius:50%; border:2px solid ${GOLD}; box-shadow:0 0 6px rgba(212,175,55,0.3); }

        /* input placeholder muted */
        input::placeholder { color: ${MUTED}; }
        select option { background:#0e0c01; color:#fff; }
      `}</style>

      {/* Ambient glow blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <motion.div
          animate={{ opacity: [0.18, 0.28, 0.18] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "15%",
            left: "-8%",
            width: "38vw",
            height: "38vw",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${currentRoleOption.accentGlow} 0%, transparent 70%)`,
            filter: "blur(48px)",
          }}
        />
        <motion.div
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{
            position: "absolute",
            bottom: "10%",
            right: "-6%",
            width: "32vw",
            height: "32vw",
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)`,
            filter: "blur(56px)",
          }}
        />
        {/* Subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.025,
            backgroundImage: `linear-gradient(rgba(212,175,55,0.4) 1px,transparent 1px), linear-gradient(90deg,rgba(212,175,55,0.4) 1px,transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 10 }}
      >
        <div
          style={{
            background: CARD_BG,
            border: CARD_BORDER,
            borderRadius: CARD_RADIUS,
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            padding: "2rem",
            boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)",
          }}
        >
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              position: "absolute",
              top: "1rem",
              left: "1rem",
              width: "2.25rem",
              height: "2.25rem",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              color: MUTED,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLButtonElement).style.color = MUTED;
            }}
          >
            <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
          </button>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.625rem",
                fontWeight: 700,
                color: "#fff",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Criar Conta
            </h1>
            <p style={{ color: MUTED, fontSize: "0.8125rem", marginTop: "0.375rem" }}>
              {currentStep === 1 && "Selecione o tipo de conta"}
              {currentStep === 2 && "Informe seus dados pessoais"}
              {currentStep === 3 && "Crie suas credenciais de acesso"}
            </p>
          </div>

          {/* Step progress */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "1.5rem",
            }}
          >
            {[1, 2, 3].map((step) => (
              <div key={step} style={{ display: "flex", alignItems: "center" }}>
                <motion.div
                  animate={{
                    background: currentStep >= step
                      ? `linear-gradient(135deg,${GOLD},${GOLD2})`
                      : "rgba(255,255,255,0.08)",
                    scale: currentStep === step ? 1.15 : 1,
                  }}
                  transition={SPRING}
                  style={{
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: currentStep >= step ? BG : MUTED,
                  }}
                >
                  {step}
                </motion.div>
                {step < 3 && (
                  <motion.div
                    animate={{
                      background: currentStep > step
                        ? `linear-gradient(90deg,${GOLD},${GOLD2})`
                        : "rgba(255,255,255,0.08)",
                    }}
                    transition={{ duration: 0.4 }}
                    style={{ width: "3rem", height: "2px", margin: "0 0.25rem" }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Existing account banner */}
          {emailExists && existingUserData && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING}
              style={{
                marginBottom: "1.25rem",
                padding: "1rem",
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: "0.75rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <CheckCircle style={{ width: "1.125rem", height: "1.125rem", color: "#10B981", flexShrink: 0, marginTop: "2px" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#10B981", margin: 0 }}>
                    Conta encontrada!
                  </p>
                  <p style={{ fontSize: "0.75rem", color: MUTED, marginTop: "0.25rem" }}>
                    Você já possui uma conta como{" "}
                    {existingUserData.roles
                      .map((r: string) =>
                        r === "client" ? "Cliente" : r === "professional" ? "Profissional" : "Proprietário"
                      )
                      .join(", ")}
                    . Clique abaixo para usar seus dados existentes.
                  </p>
                  <button
                    type="button"
                    onClick={handleUseExistingData}
                    style={{
                      marginTop: "0.75rem",
                      background: "rgba(16,185,129,0.12)",
                      color: "#10B981",
                      border: "1px solid rgba(16,185,129,0.3)",
                      borderRadius: "0.5rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <CheckCircle style={{ width: "0.875rem", height: "0.875rem" }} />
                    Usar dados existentes
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "0.5rem",
                  padding: "0.75rem 1rem",
                  fontSize: "0.8125rem",
                  color: "#F87171",
                  marginBottom: "1rem",
                }}
              >
                {errors.general}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* ── STEP 1: Role Selection ──────────────────────────────────── */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={SPRING}
                >
                  <label style={labelStyle}>Tipo de conta</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: "0.75rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    {roleOptions.map((option, index) => {
                      const Icon = option.icon;
                      const isSelected = selectedRole === option.value;
                      return (
                        <motion.button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelectRole(option.value)}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: isSelected ? 1 : 0.65, y: 0 }}
                          transition={{ delay: 0.06 * index, ...SPRING }}
                          whileHover={{ y: -4, opacity: 1, transition: SPRING }}
                          whileTap={{ scale: 0.97 }}
                          style={{
                            padding: "0.875rem 0.5rem",
                            borderRadius: "0.75rem",
                            border: isSelected
                              ? `1px solid ${option.accentColor}55`
                              : "1px solid rgba(255,255,255,0.07)",
                            background: isSelected
                              ? `${option.accentGlow}`
                              : "rgba(255,255,255,0.02)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "0.5rem",
                            cursor: "pointer",
                            position: "relative",
                            overflow: "hidden",
                            transition: "border-color 0.3s, background 0.3s",
                          }}
                        >
                          {/* Shimmer on hover */}
                          <motion.div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)",
                            }}
                            initial={{ x: "-100%" }}
                            whileHover={{ x: "100%" }}
                            transition={{ duration: 0.5 }}
                          />
                          {/* Icon wrapper */}
                          <div
                            style={{
                              width: "3rem",
                              height: "3rem",
                              borderRadius: "0.625rem",
                              background: `linear-gradient(135deg,${option.accentColor}cc,${option.accentColor}88)`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: `0 6px 20px ${option.accentGlow}`,
                            }}
                          >
                            <Icon style={{ width: "1.375rem", height: "1.375rem", color: "#fff" }} />
                          </div>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: isSelected ? "#fff" : MUTED,
                              transition: "color 0.2s",
                            }}
                          >
                            {option.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    style={goldBtnStyle}
                  >
                    Próximo
                  </button>
                </motion.div>
              )}

              {/* ── STEP 2: Personal Data ───────────────────────────────────── */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={SPRING}
                  style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                >
                  {/* Name */}
                  <div>
                    <label htmlFor="name" style={labelStyle}>Nome completo</label>
                    <div style={{ position: "relative" }}>
                      <User
                        style={{
                          position: "absolute",
                          left: "0.875rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "1.125rem",
                          height: "1.125rem",
                          color: formData.name ? GOLD : MUTED,
                          pointerEvents: "none",
                          zIndex: 1,
                          transition: "color 0.2s",
                        }}
                      />
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Seu nome"
                        value={formData.name}
                        onChange={handleChange}
                        autoComplete="off"
                        style={errors.name ? inputError : inputWithIconStyle}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "0.25rem" }}
                        >
                          {errors.name}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* CPF */}
                  <div>
                    <label htmlFor="cpf" style={labelStyle}>CPF</label>
                    <div style={{ position: "relative" }}>
                      <CreditCard
                        style={{
                          position: "absolute",
                          left: "0.875rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "1.125rem",
                          height: "1.125rem",
                          color: formData.cpf ? GOLD : MUTED,
                          pointerEvents: "none",
                          zIndex: 1,
                          transition: "color 0.2s",
                        }}
                      />
                      <input
                        id="cpf"
                        name="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={handleChange}
                        maxLength={14}
                        autoComplete="off"
                        style={errors.cpf ? inputError : inputWithIconStyle}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.cpf && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "0.25rem" }}
                        >
                          {errors.cpf}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Phone */}
                  <div style={{ position: "relative", zIndex: 20 }} ref={dropdownRef}>
                    <label style={labelStyle}>Telefone</label>
                    <div style={{ position: "relative" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {/* Country selector */}
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            padding: "0 0.75rem",
                            height: "2.875rem",
                            background: "rgba(255,255,255,0.05)",
                            border: errors.phone
                              ? "1px solid rgba(239,68,68,0.5)"
                              : "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "0.5rem",
                            cursor: "pointer",
                            flexShrink: 0,
                            transition: "border-color 0.2s",
                          }}
                        >
                          <div style={{ width: "1.5rem", height: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {(() => {
                              const Flag = flags[selectedCountry as keyof typeof flags];
                              return Flag ? <Flag title={en[selectedCountry as keyof typeof en]} /> : null;
                            })()}
                          </div>
                          <span style={{ color: "#fff", fontSize: "0.8125rem", fontWeight: 500 }}>
                            +{getCountryCallingCode(selectedCountry as any)}
                          </span>
                          <svg
                            style={{
                              width: "0.875rem",
                              height: "0.875rem",
                              color: MUTED,
                              transform: showCountryDropdown ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s",
                            }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Phone number input */}
                        <div style={{ position: "relative", flex: 1 }}>
                          <Phone
                            style={{
                              position: "absolute",
                              left: "0.875rem",
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: "1.125rem",
                              height: "1.125rem",
                              color: formData.phone ? GOLD : MUTED,
                              pointerEvents: "none",
                              zIndex: 1,
                              transition: "color 0.2s",
                            }}
                          />
                          <input
                            type="tel"
                            placeholder={
                              selectedCountry === "BR" ? "(00) 00000-0000"
                              : selectedCountry === "US" ? "(000) 000-0000"
                              : selectedCountry === "GB" ? "00000 000000"
                              : "Phone number"
                            }
                            value={(() => {
                              if (!formData.phone) return "";
                              const countryCode = getCountryCallingCode(selectedCountry as any);
                              const digitsOnly = formData.phone.replace(/\D/g, "").replace(countryCode, "");
                              if (!digitsOnly) return "";
                              if (selectedCountry === "BR") {
                                if (digitsOnly.length <= 2) return `(${digitsOnly}`;
                                if (digitsOnly.length <= 7) return `(${digitsOnly.substring(0,2)}) ${digitsOnly.substring(2)}`;
                                if (digitsOnly.length <= 11) return `(${digitsOnly.substring(0,2)}) ${digitsOnly.substring(2,7)}-${digitsOnly.substring(7)}`;
                              } else if (selectedCountry === "US") {
                                if (digitsOnly.length <= 3) return `(${digitsOnly}`;
                                if (digitsOnly.length <= 6) return `(${digitsOnly.substring(0,3)}) ${digitsOnly.substring(3)}`;
                                return `(${digitsOnly.substring(0,3)}) ${digitsOnly.substring(3,6)}-${digitsOnly.substring(6,10)}`;
                              }
                              return digitsOnly;
                            })()}
                            onChange={(e) => {
                              const digitsOnly = e.target.value.replace(/\D/g, "");
                              if (!digitsOnly) {
                                setFormData((prev) => ({ ...prev, phone: "" }));
                                return;
                              }
                              const countryCode = getCountryCallingCode(selectedCountry as any);
                              const fullPhone = `+${countryCode}${digitsOnly}`;
                              setFormData((prev) => ({ ...prev, phone: fullPhone }));
                              if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                            }}
                            style={
                              errors.phone
                                ? inputError
                                : inputWithIconStyle
                            }
                          />
                        </div>
                      </div>

                      {/* Country dropdown */}
                      <AnimatePresence>
                        {showCountryDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="dlx-country-dropdown"
                          >
                            <div className="dlx-country-search">
                              <div style={{ position: "relative" }}>
                                <Search
                                  style={{
                                    position: "absolute",
                                    left: "0.625rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: "0.875rem",
                                    height: "0.875rem",
                                    color: MUTED,
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder="Buscar país..."
                                  value={countrySearch}
                                  onChange={(e) => setCountrySearch(e.target.value)}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                                {countrySearch && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setCountrySearch(""); }}
                                    style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: MUTED }}
                                  >
                                    <X style={{ width: "0.875rem", height: "0.875rem" }} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="dlx-country-list dlx-scroll">
                              {filteredCountries.length > 0 ? (
                                filteredCountries.map((country) => {
                                  const Flag = flags[country as keyof typeof flags];
                                  const countryName = en[country as keyof typeof en] || country;
                                  return (
                                    <div
                                      key={country}
                                      onClick={() => {
                                        setSelectedCountry(country);
                                        const currentNumber = formData.phone.replace(/^\+\d+/, "");
                                        const newFullPhone = `+${getCountryCallingCode(country as any)}${currentNumber}`;
                                        setFormData((prev) => ({ ...prev, phone: newFullPhone }));
                                        setShowCountryDropdown(false);
                                        setCountrySearch("");
                                      }}
                                      className={`dlx-country-item${selectedCountry === country ? " selected" : ""}`}
                                    >
                                      <div style={{ width: "1.75rem", height: "1.75rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        {Flag && <Flag title={countryName} />}
                                      </div>
                                      <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>{countryName}</span>
                                        <span style={{ color: MUTED, fontSize: "0.75rem" }}>
                                          +{getCountryCallingCode(country as any)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div style={{ padding: "2rem", textAlign: "center", color: MUTED, fontSize: "0.875rem" }}>
                                  Nenhum país encontrado
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <AnimatePresence>
                      {errors.phone && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "0.25rem" }}
                        >
                          {errors.phone}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Gender + Birth Date */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    {/* Gender */}
                    <div>
                      <label htmlFor="gender" style={labelStyle}>Gênero</label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        style={{
                          ...inputStyle,
                          color: formData.gender ? "#fff" : MUTED,
                          border: errors.gender ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <option value="">Selecione</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                        <option value="outro">Outro</option>
                      </select>
                      {errors.gender && (
                        <p style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "0.25rem" }}>{errors.gender}</p>
                      )}
                    </div>

                    {/* Birth Date */}
                    <div style={{ position: "relative", zIndex: 10 }} ref={birthDateRef}>
                      <label htmlFor="birthDate" style={labelStyle}>Nascimento</label>
                      <div style={{ position: "relative" }}>
                        <Calendar
                          style={{
                            position: "absolute",
                            left: "0.875rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "1.125rem",
                            height: "1.125rem",
                            color: formData.birthDate ? GOLD : MUTED,
                            pointerEvents: "none",
                            zIndex: 1,
                            transition: "color 0.2s",
                          }}
                        />
                        <input
                          type="text"
                          id="birthDate"
                          name="birthDate"
                          placeholder="dd/mm/aaaa"
                          value={birthDateInput}
                          onChange={handleBirthDateInputChange}
                          onFocus={() => setShowBirthDateCalendar(false)}
                          maxLength={10}
                          autoComplete="off"
                          style={{
                            ...inputWithIconAndToggle,
                            border: errors.birthDate ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
                          }}
                        />
                        {/* Calendar toggle */}
                        <button
                          type="button"
                          onClick={() => setShowBirthDateCalendar(!showBirthDateCalendar)}
                          style={{
                            position: "absolute",
                            right: "0.5rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "0.375rem",
                            borderRadius: "0.375rem",
                          }}
                        >
                          <svg
                            style={{
                              width: "1rem",
                              height: "1rem",
                              color: showBirthDateCalendar ? GOLD : MUTED,
                              transform: showBirthDateCalendar ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s, color 0.2s",
                            }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Calendar popup */}
                        <AnimatePresence>
                          {showBirthDateCalendar && (
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.97 }}
                              transition={{ duration: 0.15 }}
                              className="dlx-calendar"
                            >
                              <div className="dlx-cal-header">
                                <div className="dlx-cal-selectors">
                                  <select value={selectedMonth} onChange={handleMonthChange} className="dlx-cal-select">
                                    {monthNames.map((month, index) => (
                                      <option key={index} value={index}>{month}</option>
                                    ))}
                                  </select>
                                  <select value={selectedYear} onChange={handleYearChange} className="dlx-cal-select">
                                    {generateYears().map((year) => (
                                      <option key={year} value={year}>{year}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="dlx-cal-nav">
                                  <button type="button" onClick={previousMonth} className="dlx-cal-nav-btn">
                                    <ChevronLeft style={{ width: "1.125rem", height: "1.125rem" }} />
                                  </button>
                                  <span style={{ color: MUTED, fontSize: "0.8125rem" }}>
                                    {monthNames[selectedMonth]} {selectedYear}
                                  </span>
                                  <button type="button" onClick={nextMonth} className="dlx-cal-nav-btn">
                                    <ChevronRight style={{ width: "1.125rem", height: "1.125rem" }} />
                                  </button>
                                </div>
                              </div>

                              <div className="dlx-cal-day-names">
                                {dayNames.map((name, index) => (
                                  <div key={`${name}-${index}`} className="dlx-cal-day-name">{name}</div>
                                ))}
                              </div>

                              <div className="dlx-cal-divider" />

                              <div className="dlx-cal-days">
                                {(() => {
                                  const days = [];
                                  const totalDays = daysInMonth(selectedYear, selectedMonth);
                                  const firstDay = firstDayOfMonth(selectedYear, selectedMonth);
                                  for (let i = 0; i < firstDay; i++) {
                                    days.push(<div key={`empty-${i}`} />);
                                  }
                                  for (let day = 1; day <= totalDays; day++) {
                                    const selected = isDateSelected(day);
                                    const future = isFutureDate(day);
                                    days.push(
                                      <button
                                        key={day}
                                        type="button"
                                        onClick={() => !future && handleDateSelect(day)}
                                        disabled={future}
                                        className={`dlx-cal-day${selected ? " selected" : ""}${future ? " disabled" : ""}`}
                                      >
                                        {day}
                                      </button>
                                    );
                                  }
                                  return days;
                                })()}
                              </div>

                              <div className="dlx-cal-legend">
                                <div className="dlx-cal-legend-dot" />
                                <span>Selecionado</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <AnimatePresence>
                        {errors.birthDate && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "0.25rem" }}
                          >
                            {errors.birthDate}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* CNPJ (optional) */}
                  {(selectedRole === "professional" || selectedRole === "owner") && (
                    <div>
                      <label htmlFor="cnpj" style={labelStyle}>
                        CNPJ{" "}
                        <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400, textTransform: "none" }}>
                          (opcional)
                        </span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <CreditCard
                          style={{
                            position: "absolute",
                            left: "0.875rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "1.125rem",
                            height: "1.125rem",
                            color: formData.cnpj ? GOLD : MUTED,
                            pointerEvents: "none",
                            zIndex: 1,
                            transition: "color 0.2s",
                          }}
                        />
                        <input
                          id="cnpj"
                          name="cnpj"
                          type="text"
                          placeholder="00.000.000/0000-00"
                          value={formData.cnpj}
                          onChange={handleChange}
                          maxLength={18}
                          autoComplete="off"
                          style={errors.cnpj ? inputError : inputWithIconStyle}
                        />
                      </div>
                      <AnimatePresence>
                        {errors.cnpj && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "0.25rem" }}
                          >
                            {errors.cnpj}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Nav buttons */}
                  <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
                    <motion.button
                      type="button"
                      onClick={handlePreviousStep}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      style={{ ...outlineBtnStyle, flex: 1 }}
                    >
                      Voltar
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleNextStep}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      style={{ ...goldBtnStyle, flex: 2 }}
                    >
                      Próximo
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Credentials ──────────────────────────────────────── */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={SPRING}
                  style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                >
                  {/* Email */}
                  <div>
                    <label htmlFor="email" style={labelStyle}>Email</label>
                    <div style={{ position: "relative" }}>
                      <Mail
                        style={{
                          position: "absolute",
                          left: "0.875rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "1.125rem",
                          height: "1.125rem",
                          color: formData.email ? GOLD : MUTED,
                          pointerEvents: "none",
                          zIndex: 1,
                          transition: "color 0.2s",
                        }}
                      />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleEmailBlur}
                        autoComplete="off"
                        style={
                          errors.email
                            ? inputError
                            : emailExists
                            ? { ...inputWithIconStyle, border: "1px solid rgba(16,185,129,0.4)" }
                            : inputWithIconStyle
                        }
                      />
                    </div>
                    <AnimatePresence>
                      {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "0.25rem" }}
                        >
                          {errors.email}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" style={labelStyle}>Senha</label>
                    <div style={{ position: "relative" }}>
                      <Lock
                        style={{
                          position: "absolute",
                          left: "0.875rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "1.125rem",
                          height: "1.125rem",
                          color: formData.password ? GOLD : MUTED,
                          pointerEvents: "none",
                          zIndex: 1,
                          transition: "color 0.2s",
                        }}
                      />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="off"
                        style={errors.password ? inputErrorWithToggle : inputWithIconAndToggle}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: "absolute",
                          right: "0.875rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: showPassword ? GOLD : MUTED,
                          zIndex: 2,
                          transition: "color 0.2s",
                          display: "flex",
                          alignItems: "center",
                        }}
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
                              <EyeOff style={{ width: "1.125rem", height: "1.125rem" }} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="eye"
                              initial={{ rotate: -180, opacity: 0 }}
                              animate={{ rotate: 0, opacity: 1 }}
                              exit={{ rotate: 180, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Eye style={{ width: "1.125rem", height: "1.125rem" }} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                    <AnimatePresence>
                      {errors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "0.25rem" }}
                        >
                          {errors.password}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" style={labelStyle}>Confirmar senha</label>
                    <div style={{ position: "relative" }}>
                      <Lock
                        style={{
                          position: "absolute",
                          left: "0.875rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "1.125rem",
                          height: "1.125rem",
                          color: formData.confirmPassword ? GOLD : MUTED,
                          pointerEvents: "none",
                          zIndex: 1,
                          transition: "color 0.2s",
                        }}
                      />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        autoComplete="off"
                        style={errors.confirmPassword ? inputErrorWithToggle : inputWithIconAndToggle}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: "absolute",
                          right: "0.875rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: showConfirmPassword ? GOLD : MUTED,
                          zIndex: 2,
                          transition: "color 0.2s",
                          display: "flex",
                          alignItems: "center",
                        }}
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
                              <EyeOff style={{ width: "1.125rem", height: "1.125rem" }} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="eye"
                              initial={{ rotate: -180, opacity: 0 }}
                              animate={{ rotate: 0, opacity: 1 }}
                              exit={{ rotate: 180, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Eye style={{ width: "1.125rem", height: "1.125rem" }} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                    <AnimatePresence>
                      {errors.confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "0.25rem" }}
                        >
                          {errors.confirmPassword}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Nav + Submit */}
                  <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
                    <motion.button
                      type="button"
                      onClick={handlePreviousStep}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      style={{ ...outlineBtnStyle, flex: 1 }}
                    >
                      Voltar
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={!isLoading ? { scale: 1.02, y: -1 } : {}}
                      whileTap={!isLoading ? { scale: 0.97 } : {}}
                      style={{
                        ...goldBtnStyle,
                        flex: 2,
                        opacity: isLoading ? 0.75 : 1,
                        cursor: isLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            style={{
                              width: "1rem",
                              height: "1rem",
                              border: `2px solid ${BG}44`,
                              borderTop: `2px solid ${BG}`,
                              borderRadius: "50%",
                            }}
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
                            <Send style={{ width: "0.875rem", height: "0.875rem" }} />
                          </motion.div>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Divider */}
          <div style={{ borderBottom: DIVIDER, margin: "1.25rem 0 1rem" }} />

          {/* Login link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ textAlign: "center", fontSize: "0.8125rem", color: MUTED, margin: 0 }}
          >
            Já tem uma conta?{" "}
            <motion.button
              type="button"
              onClick={() => navigate("/login")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: GOLD,
                fontWeight: 600,
                fontSize: "0.8125rem",
                padding: 0,
              }}
            >
              Faça login
            </motion.button>
          </motion.p>
        </div>
      </motion.div>

      {/* ── Password Confirmation Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {showPasswordModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            />

            {/* Modal card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={SPRING}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "420px",
                background: "#0a0800",
                border: `1px solid rgba(212,175,55,0.2)`,
                borderRadius: CARD_RADIUS,
                padding: "1.75rem",
                boxShadow: "0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.06)",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div
                  style={{
                    width: "2.875rem",
                    height: "2.875rem",
                    borderRadius: "0.75rem",
                    background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Lock style={{ width: "1.375rem", height: "1.375rem", color: BG }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      color: "#fff",
                      margin: 0,
                    }}
                  >
                    Confirmar Identidade
                  </h3>
                  <p style={{ fontSize: "0.8125rem", color: MUTED, marginTop: "0.25rem" }}>
                    Digite sua senha para adicionar o perfil de{" "}
                    <span style={{ color: GOLD, fontWeight: 600 }}>
                      {selectedRole === "client"
                        ? "Cliente"
                        : selectedRole === "professional"
                        ? "Profissional"
                        : "Proprietário"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Data summary */}
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "0.875rem",
                  background: "rgba(255,255,255,0.03)",
                  border: CARD_BORDER,
                  borderRadius: "0.75rem",
                }}
              >
                <p style={{ fontSize: "0.75rem", fontWeight: 500, color: MUTED, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Dados que serão utilizados:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem", color: "#fff" }}>
                  <p style={{ margin: 0 }}>✓ Nome: {formData.name}</p>
                  <p style={{ margin: 0 }}>✓ CPF: {formData.cpf}</p>
                  <p style={{ margin: 0 }}>✓ Telefone: {formData.phone}</p>
                  {formData.cnpj && <p style={{ margin: 0 }}>✓ CNPJ: {formData.cnpj}</p>}
                </div>
              </div>

              {/* Password input */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label htmlFor="modal-password" style={labelStyle}>
                  Senha da conta existente
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    style={{
                      position: "absolute",
                      left: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "1.125rem",
                      height: "1.125rem",
                      color: GOLD,
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                  <input
                    id="modal-password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleConfirmPassword()}
                    autoFocus
                    style={
                      passwordError
                        ? inputError
                        : inputWithIconStyle
                    }
                  />
                </div>
                {passwordError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: "0.75rem", color: "#F87171", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                  >
                    <AlertCircle style={{ width: "0.75rem", height: "0.75rem" }} />
                    {passwordError}
                  </motion.p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setConfirmPassword("");
                    setPasswordError("");
                  }}
                  disabled={isLoading}
                  style={{ ...outlineBtnStyle, flex: 1, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPassword}
                  disabled={isLoading || !confirmPassword}
                  style={{
                    ...goldBtnStyle,
                    flex: 1,
                    opacity: isLoading || !confirmPassword ? 0.6 : 1,
                    cursor: isLoading || !confirmPassword ? "not-allowed" : "pointer",
                  }}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        style={{
                          width: "1rem",
                          height: "1rem",
                          border: `2px solid ${BG}44`,
                          borderTop: `2px solid ${BG}`,
                          borderRadius: "50%",
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Confirmando...
                    </>
                  ) : (
                    "Confirmar"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
