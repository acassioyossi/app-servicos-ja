"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge, LoadingState, ProgressIndicator, NotificationBanner } from "@/components/ui/feedback";
import { PageHeader, NavigationMenu } from "@/components/ui/navigation";
import { cn } from "@/lib/utils";
import {
  Bell,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  MessageCircle,
  Star,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
  MoreHorizontal
} from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  professional: {
    name: string;
    avatar: string;
    rating: number;
  };
  createdAt: Date;
  estimatedCompletion?: Date;
  location: string;
}

interface DashboardStats {
  totalServices: number;
  activeServices: number;
  completedServices: number;
  totalSpent: number;
  averageRating: number;
  responseTime: string;
}

interface EnhancedDashboardProps {
  userType: 'client' | 'professional';
  userName: string;
  userAvatar?: string;
}

export function EnhancedDashboard({ userType, userName, userAvatar }: EnhancedDashboardProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
  }>>([]);

  // Simulate data loading
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data
      const mockServices: Service[] = [
        {
          id: '1',
          title: 'Reparo de Encanamento',
          description: 'Vazamento na cozinha precisa de reparo urgente',
          price: 150,
          status: 'in_progress',
          professional: {
            name: 'João Silva',
            avatar: 'https://placehold.co/100x100.png',
            rating: 4.8
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          estimatedCompletion: new Date(Date.now() + 1 * 60 * 60 * 1000),
          location: 'São Paulo, SP'
        },
        {
          id: '2',
          title: 'Limpeza Residencial',
          description: 'Limpeza completa do apartamento',
          price: 200,
          status: 'completed',
          professional: {
            name: 'Maria Santos',
            avatar: 'https://placehold.co/100x100.png',
            rating: 4.9
          },
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          location: 'São Paulo, SP'
        },
        {
          id: '3',
          title: 'Instalação Elétrica',
          description: 'Instalação de novos pontos de energia',
          price: 300,
          status: 'pending',
          professional: {
            name: 'Carlos Oliveira',
            avatar: 'https://placehold.co/100x100.png',
            rating: 4.7
          },
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          estimatedCompletion: new Date(Date.now() + 3 * 60 * 60 * 1000),
          location: 'São Paulo, SP'
        }
      ];
      
      const mockStats: DashboardStats = {
        totalServices: 12,
        activeServices: 3,
        completedServices: 8,
        totalSpent: 2450,
        averageRating: 4.8,
        responseTime: '< 15 min'
      };
      
      const mockNotifications = [
        {
          id: '1',
          type: 'success' as const,
          title: 'Serviço Concluído',
          message: 'Limpeza residencial foi finalizada com sucesso',
          timestamp: new Date(Date.now() - 10 * 60 * 1000)
        },
        {
          id: '2',
          type: 'info' as const,
          title: 'Profissional a Caminho',
          message: 'João Silva está se dirigindo ao local',
          timestamp: new Date(Date.now() - 30 * 60 * 1000)
        }
      ];
      
      setServices(mockServices);
      setStats(mockStats);
      setNotifications(mockNotifications);
      setLoading(false);
    };
    
    loadDashboardData();
  }, []);

  const filteredServices = services.filter(service => 
    filter === 'all' || service.status === filter
  );

  const getStatusColor = (status: Service['status']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'processing';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: Service['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingState 
            variant="pulse" 
            size="lg" 
            text="Carregando seu dashboard..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Bem-vindo, ${userName}!`}
        description={userType === 'client' ? 'Gerencie seus serviços e acompanhe o progresso' : 'Acompanhe seus trabalhos e clientes'}
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Dashboard', href: '/dashboard' }
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {userType === 'client' ? 'Novo Serviço' : 'Nova Oferta'}
            </Button>
          </div>
        }
      />

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.slice(0, 2).map((notification) => (
            <NotificationBanner
              key={notification.id}
              variant={notification.type}
              title={notification.title}
              description={notification.message}
              dismissible
              onDismiss={() => {
                setNotifications(prev => prev.filter(n => n.id !== notification.id));
              }}
            />
          ))}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalServices}</div>
              <p className="text-xs text-muted-foreground">
                +2 desde o mês passado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeServices}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeServices > 0 ? 'Em andamento' : 'Nenhum ativo'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userType === 'client' ? 'Total Gasto' : 'Total Ganho'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% este mês
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}</div>
              <p className="text-xs text-muted-foreground">
                Baseado em {stats.completedServices} serviços
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Services Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Seus Serviços</h2>
          
          {/* Filter Tabs */}
          <div className="flex gap-1">
            {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(status)}
                className="text-xs"
              >
                {status === 'all' ? 'Todos' : getStatusText(status)}
                {status !== 'all' && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {services.filter(s => s.status === status).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Services List */}
        <div className="grid gap-4">
          {filteredServices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-muted-foreground text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">Nenhum serviço encontrado</h3>
                  <p className="text-sm">
                    {filter === 'all' 
                      ? 'Você ainda não possui serviços cadastrados'
                      : `Nenhum serviço com status "${getStatusText(filter)}"`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Service Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{service.title}</h3>
                          <p className="text-muted-foreground text-sm">{service.description}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            status={getStatusColor(service.status)}
                            text={getStatusText(service.status)}
                            animated={service.status === 'in_progress'}
                          />
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Professional Info */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={service.professional.avatar} />
                          <AvatarFallback>
                            {service.professional.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <p className="font-medium text-sm">{service.professional.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{service.professional.rating}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{service.location}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-lg">R$ {service.price}</p>
                          {service.estimatedCompletion && service.status === 'in_progress' && (
                            <p className="text-xs text-muted-foreground">
                              <Clock className="inline h-3 w-3 mr-1" />
                              Conclusão em {Math.ceil((service.estimatedCompletion.getTime() - Date.now()) / (1000 * 60 * 60))}h
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress for in-progress services */}
                      {service.status === 'in_progress' && (
                        <div className="space-y-2">
                          <ProgressIndicator
                            steps={[
                              { label: 'Solicitado', completed: true },
                              { label: 'Aceito', completed: true },
                              { label: 'Em Execução', completed: true },
                              { label: 'Finalizado', completed: false }
                            ]}
                            variant="success"
                            size="sm"
                          />
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                        
                        {service.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <Star className="h-4 w-4 mr-2" />
                            Avaliar
                          </Button>
                        )}
                        
                        {service.status === 'pending' && (
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}