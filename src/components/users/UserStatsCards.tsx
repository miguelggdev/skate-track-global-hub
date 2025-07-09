import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Shield, TrendingUp } from 'lucide-react';
import { User } from '@/pages/UserManagement';

interface UserStatsCardsProps {
  users: User[];
}

const UserStatsCards = ({ users }: UserStatsCardsProps) => {
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.role !== undefined).length;
  const adminUsers = users.filter(user => user.role === 'admin').length;
  const recentUsers = users.filter(user => {
    const createdDate = new Date(user.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate >= thirtyDaysAgo;
  }).length;

  const stats = [
    {
      title: "Total Usuarios",
      value: totalUsers,
      icon: Users,
      description: "Usuarios registrados",
      color: "text-blue-600"
    },
    {
      title: "Usuarios Activos",
      value: activeUsers,
      icon: UserCheck,
      description: "Con roles asignados",
      color: "text-green-600"
    },
    {
      title: "Administradores",
      value: adminUsers,
      icon: Shield,
      description: "Con permisos admin",
      color: "text-purple-600"
    },
    {
      title: "Nuevos (30 días)",
      value: recentUsers,
      icon: TrendingUp,
      description: "Registrados recientemente",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="argon-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UserStatsCards;