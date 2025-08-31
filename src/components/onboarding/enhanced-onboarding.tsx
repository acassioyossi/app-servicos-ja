"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressIndicator, LoadingState, NotificationBanner } from "@/components/ui/feedback";
import { FormField, FormSection, FormActions } from "@/components/ui/enhanced-form";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  MapPin,
  Briefcase,
  Star,
  Shield,
  Zap,
  Heart,
  Users,
  Clock,
  DollarSign,
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface UserProfile {
  userType: 'client' | 'professional';
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    avatar?: string;
  };
  preferences: {
    serviceCategories: string[];
    budget: string;
    availability: string[];
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  professionalInfo?: {
    skills: string[];
    experience: string;
    portfolio: string[];
    pricing: {
      hourlyRate: number;
      minimumJob: number;
    };
    documents: {
      id: string;
      certificate: string;
      insurance: string;
    };
  };
}

interface EnhancedOnboardingProps {
  onComplete: (profile: UserProfile) => void;
  onSkip?: () => void;
}

const serviceCategories = [
  { id: 'cleaning', label: 'Limpeza', icon: '🧹' },
  { id: 'plumbing', label: 'Encanamento', icon: '🔧' },
  { id: 'electrical', label: 'Elétrica', icon: '⚡' },
  { id: 'painting', label: 'Pintura', icon: '🎨' },
  { id: 'gardening', label: 'Jardinagem', icon: '🌱' },
  { id: 'moving', label: 'Mudanças', icon: '📦' },
  { id: 'beauty', label: 'Beleza', icon: '💄' },
  { id: 'tutoring', label: 'Aulas', icon: '📚' },
  { id: 'pet', label: 'Pet Care', icon: '🐕' },
  { id: 'tech', label: 'Tecnologia', icon: '💻' }
];

const availabilityOptions = [
  { id: 'morning', label: 'Manhã (6h-12h)' },
  { id: 'afternoon', label: 'Tarde (12h-18h)' },
  { id: 'evening', label: 'Noite (18h-22h)' },
  { id: 'weekend', label: 'Fins de semana' },
  { id: 'flexible', label: 'Horário flexível' }
];

export function EnhancedOnboarding({ onComplete, onSkip }: EnhancedOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    userType: 'client',
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: ''
    },
    preferences: {
      serviceCategories: [],
      budget: '',
      availability: [],
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps: OnboardingStep[] = [
    {
      id: 'user-type',
      title: 'Tipo de Usuário',
      description: 'Como você pretende usar nossa plataforma?',
      icon: <User className="h-6 w-6" />,
      completed: !!profile.userType
    },
    {
      id: 'personal-info',
      title: 'Informações Pessoais',
      description: 'Conte-nos um pouco sobre você',
      icon: <User className="h-6 w-6" />,
      completed: !!(profile.personalInfo.name && profile.personalInfo.email && profile.personalInfo.phone)
    },
    {
      id: 'preferences',
      title: 'Preferências',
      description: 'Personalize sua experiência',
      icon: <Heart className="h-6 w-6" />,
      completed: profile.preferences.serviceCategories.length > 0
    },
    ...(profile.userType === 'professional' ? [{
      id: 'professional-info',
      title: 'Informações Profissionais',
      description: 'Mostre suas habilidades e experiência',
      icon: <Briefcase className="h-6 w-6" />,
      completed: !!(profile.professionalInfo?.skills.length && profile.professionalInfo?.experience)
    }] : []),
    {
      id: 'verification',
      title: 'Verificação',
      description: 'Confirme suas informações',
      icon: <Shield className="h-6 w-6" />,
      completed: false
    }
  ];

  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (stepIndex) {
      case 1: // Personal Info
        if (!profile.personalInfo.name.trim()) {
          newErrors.name = 'Nome é obrigatório';
        }
        if (!profile.personalInfo.email.trim()) {
          newErrors.email = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.personalInfo.email)) {
          newErrors.email = 'Email inválido';
        }
        if (!profile.personalInfo.phone.trim()) {
          newErrors.phone = 'Telefone é obrigatório';
        }
        break;
        
      case 2: // Preferences
        if (profile.preferences.serviceCategories.length === 0) {
          newErrors.categories = 'Selecione pelo menos uma categoria';
        }
        break;
        
      case 3: // Professional Info (if applicable)
        if (profile.userType === 'professional') {
          if (!profile.professionalInfo?.skills.length) {
            newErrors.skills = 'Selecione suas habilidades';
          }
          if (!profile.professionalInfo?.experience.trim()) {
            newErrors.experience = 'Descreva sua experiência';
          }
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      onComplete(profile);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const updatePersonalInfo = (updates: Partial<UserProfile['personalInfo']>) => {
    setProfile(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...updates }
    }));
  };

  const updatePreferences = (updates: Partial<UserProfile['preferences']>) => {
    setProfile(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates }
    }));
  };

  const updateProfessionalInfo = (updates: Partial<UserProfile['professionalInfo']>) => {
    setProfile(prev => ({
      ...prev,
      professionalInfo: { ...prev.professionalInfo, ...updates }
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // User Type Selection
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Como você pretende usar nossa plataforma?</h2>
              <p className="text-muted-foreground">
                Escolha a opção que melhor descreve seu objetivo
              </p>
            </div>
            
            <RadioGroup
              value={profile.userType}
              onValueChange={(value: 'client' | 'professional') => updateProfile({ userType: value })}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="client" id="client" className="sr-only" />
                <Label
                  htmlFor="client"
                  className={cn(
                    "flex-1 cursor-pointer rounded-lg border-2 p-6 hover:bg-accent transition-colors",
                    profile.userType === 'client' ? "border-primary bg-primary/5" : "border-muted"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold text-lg">Sou Cliente</h3>
                        <p className="text-sm text-muted-foreground">
                          Preciso contratar serviços
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Encontre profissionais qualificados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Compare preços e avaliações</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Pagamento seguro</span>
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="professional" id="professional" className="sr-only" />
                <Label
                  htmlFor="professional"
                  className={cn(
                    "flex-1 cursor-pointer rounded-lg border-2 p-6 hover:bg-accent transition-colors",
                    profile.userType === 'professional' ? "border-primary bg-primary/5" : "border-muted"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold text-lg">Sou Profissional</h3>
                        <p className="text-sm text-muted-foreground">
                          Quero oferecer meus serviços
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Encontre novos clientes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Gerencie sua agenda</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Receba pagamentos online</span>
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );
        
      case 1: // Personal Information
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Informações Pessoais</h2>
              <p className="text-muted-foreground">
                Precisamos de algumas informações básicas para criar seu perfil
              </p>
            </div>
            
            <FormSection title="Dados Básicos">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Nome Completo"
                  error={errors.name}
                  required
                >
                  <Input
                    value={profile.personalInfo.name}
                    onChange={(e) => updatePersonalInfo({ name: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </FormField>
                
                <FormField
                  label="Email"
                  error={errors.email}
                  required
                >
                  <Input
                    type="email"
                    value={profile.personalInfo.email}
                    onChange={(e) => updatePersonalInfo({ email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </FormField>
                
                <FormField
                  label="Telefone"
                  error={errors.phone}
                  required
                >
                  <Input
                    value={profile.personalInfo.phone}
                    onChange={(e) => updatePersonalInfo({ phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </FormField>
                
                <FormField
                  label="Localização"
                  description="Cidade onde você está localizado"
                >
                  <Input
                    value={profile.personalInfo.location}
                    onChange={(e) => updatePersonalInfo({ location: e.target.value })}
                    placeholder="São Paulo, SP"
                  />
                </FormField>
              </div>
            </FormSection>
          </div>
        );
        
      case 2: // Preferences
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Suas Preferências</h2>
              <p className="text-muted-foreground">
                {profile.userType === 'client' 
                  ? 'Que tipos de serviços você costuma precisar?'
                  : 'Em quais categorias você oferece serviços?'
                }
              </p>
            </div>
            
            <FormSection title="Categorias de Interesse">
              {errors.categories && (
                <NotificationBanner
                  variant="error"
                  title="Erro"
                  description={errors.categories}
                  dismissible={false}
                />
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {serviceCategories.map((category) => {
                  const isSelected = profile.preferences.serviceCategories.includes(category.id);
                  return (
                    <Button
                      key={category.id}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "h-auto p-4 flex flex-col items-center gap-2 text-center",
                        isSelected && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => {
                        const categories = isSelected
                          ? profile.preferences.serviceCategories.filter(id => id !== category.id)
                          : [...profile.preferences.serviceCategories, category.id];
                        updatePreferences({ serviceCategories: categories });
                      }}
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <span className="text-xs font-medium">{category.label}</span>
                    </Button>
                  );
                })}
              </div>
            </FormSection>
            
            <FormSection title="Disponibilidade">
              <div className="space-y-3">
                {availabilityOptions.map((option) => {
                  const isSelected = profile.preferences.availability.includes(option.id);
                  return (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const availability = checked
                            ? [...profile.preferences.availability, option.id]
                            : profile.preferences.availability.filter(id => id !== option.id);
                          updatePreferences({ availability });
                        }}
                      />
                      <Label htmlFor={option.id} className="text-sm font-medium">
                        {option.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </FormSection>
            
            {profile.userType === 'client' && (
              <FormSection title="Orçamento Preferido">
                <Select
                  value={profile.preferences.budget}
                  onValueChange={(value) => updatePreferences({ budget: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione sua faixa de orçamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Até R$ 100</SelectItem>
                    <SelectItem value="medium">R$ 100 - R$ 500</SelectItem>
                    <SelectItem value="high">R$ 500 - R$ 1.000</SelectItem>
                    <SelectItem value="premium">Acima de R$ 1.000</SelectItem>
                  </SelectContent>
                </Select>
              </FormSection>
            )}
          </div>
        );
        
      case 3: // Professional Info (if professional)
        if (profile.userType === 'professional') {
          return (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Informações Profissionais</h2>
                <p className="text-muted-foreground">
                  Conte-nos sobre sua experiência e habilidades
                </p>
              </div>
              
              <FormSection title="Experiência">
                <FormField
                  label="Descreva sua experiência"
                  error={errors.experience}
                  required
                >
                  <Textarea
                    value={profile.professionalInfo?.experience || ''}
                    onChange={(e) => updateProfessionalInfo({ experience: e.target.value })}
                    placeholder="Conte sobre sua experiência, certificações e principais trabalhos realizados..."
                    rows={4}
                  />
                </FormField>
              </FormSection>
              
              <FormSection title="Preços">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Valor por hora (R$)">
                    <Input
                      type="number"
                      value={profile.professionalInfo?.pricing?.hourlyRate || ''}
                      onChange={(e) => updateProfessionalInfo({
                        pricing: {
                          ...profile.professionalInfo?.pricing,
                          hourlyRate: Number(e.target.value)
                        }
                      })}
                      placeholder="50"
                    />
                  </FormField>
                  
                  <FormField label="Valor mínimo do trabalho (R$)">
                    <Input
                      type="number"
                      value={profile.professionalInfo?.pricing?.minimumJob || ''}
                      onChange={(e) => updateProfessionalInfo({
                        pricing: {
                          ...profile.professionalInfo?.pricing,
                          minimumJob: Number(e.target.value)
                        }
                      })}
                      placeholder="100"
                    />
                  </FormField>
                </div>
              </FormSection>
            </div>
          );
        }
        // Fall through to verification if not professional
        
      case steps.length - 1: // Verification
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold">Quase pronto!</h2>
              <p className="text-muted-foreground">
                Revise suas informações antes de finalizar
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{profile.personalInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{profile.personalInfo.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <Badge variant="secondary">
                    {profile.userType === 'client' ? 'Cliente' : 'Profissional'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Preferências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <span className="text-muted-foreground">Categorias selecionadas:</span>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferences.serviceCategories.map(categoryId => {
                      const category = serviceCategories.find(c => c.id === categoryId);
                      return category ? (
                        <Badge key={categoryId} variant="outline">
                          {category.icon} {category.label}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <NotificationBanner
              variant="info"
              title="Próximos passos"
              description="Após finalizar o cadastro, você receberá um email de confirmação e poderá começar a usar a plataforma imediatamente."
              dismissible={false}
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Header */}
        <div className="mb-8">
          <ProgressIndicator
            steps={steps.map(step => ({
              label: step.title,
              completed: step.completed || steps.indexOf(step) < currentStep
            }))}
            currentStep={currentStep}
            variant="primary"
          />
        </div>
        
        {/* Main Content */}
        <Card className="shadow-xl">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>
        
        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
            )}
            
            {onSkip && currentStep === 0 && (
              <Button variant="ghost" onClick={onSkip}>
                Pular configuração
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={!steps[currentStep].completed}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isSubmitting}>
                {isSubmitting ? (
                  <LoadingState variant="spinner" size="sm" text="Finalizando..." />
                ) : (
                  <>
                    Finalizar Cadastro
                    <Check className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}