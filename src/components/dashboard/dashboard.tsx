'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Star, Users, TrendingUp } from 'lucide-react';

interface DashboardProps {
  userType?: 'client' | 'professional';
}

export function Dashboard({ userType = 'client' }: DashboardProps) {
  const stats = {
    client: [
      { label: 'Serviços Solicitados', value: '12', icon: Calendar },
      { label: 'Profissionais Favoritos', value: '5', icon: Star },
      { label: 'Economia Total', value: 'R$ 450', icon: TrendingUp },
    ],
    professional: [
      { label: 'Serviços Realizados', value: '28', icon: Calendar },
      { label: 'Avaliação Média', value: '4.8', icon: Star },
      { label: 'Clientes Atendidos', value: '15', icon: Users },
    ]
  };

  const recentActivity = {
    client: [
      { title: 'Encanador João', status: 'Concluído', time: '2 horas atrás', location: 'Centro' },
      { title: 'Eletricista Maria', status: 'Em andamento', time: '1 dia atrás', location: 'Zona Sul' },
      { title: 'Pintor Carlos', status: 'Agendado', time: '3 dias atrás', location: 'Zona Norte' },
    ],
    professional: [
      { title: 'Reparo hidráulico', status: 'Concluído', time: '1 hora atrás', client: 'Ana Silva' },
      { title: 'Instalação elétrica', status: 'Em andamento', time: '3 horas atrás', client: 'Pedro Santos' },
      { title: 'Manutenção geral', status: 'Agendado', time: '1 dia atrás', client: 'Maria Costa' },
    ]
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats[userType].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>
            {userType === 'client' ? 'Seus últimos serviços solicitados' : 'Seus últimos serviços realizados'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity[userType].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{activity.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{activity.time}</span>
                    {userType === 'client' && 'location' in activity && (
                      <>
                        <MapPin className="h-3 w-3 ml-2" />
                        <span>{activity.location}</span>
                      </>
                    )}
                    {userType === 'professional' && 'client' in activity && (
                      <>
                        <Users className="h-3 w-3 ml-2" />
                        <span>{activity.client}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge 
                  variant={activity.status === 'Concluído' ? 'default' : 
                          activity.status === 'Em andamento' ? 'secondary' : 'outline'}
                >
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {userType === 'client' ? (
              <>
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="h-5 w-5 mb-2" />
                  Agendar Serviço
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <MapPin className="h-5 w-5 mb-2" />
                  Buscar Próximo
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Star className="h-5 w-5 mb-2" />
                  Favoritos
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Clock className="h-5 w-5 mb-2" />
                  Histórico
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="h-5 w-5 mb-2" />
                  Agenda
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-5 w-5 mb-2" />
                  Clientes
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-5 w-5 mb-2" />
                  Relatórios
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Star className="h-5 w-5 mb-2" />
                  Avaliações
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;