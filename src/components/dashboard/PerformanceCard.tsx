import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

interface PerformanceCardProps {
  title: string;
  value: number;
  target?: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'number' | 'currency' | 'percentage';
  icon: React.ComponentType<any>;
  className?: string;
}

const PerformanceCard: React.FC<PerformanceCardProps> = ({
  title,
  value,
  target,
  change,
  changeType,
  format = 'number',
  icon: Icon,
  className = ''
}) => {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const progressPercentage = target ? Math.min((value / target) * 100, 100) : 0;

  return (
    <Card className={`hover:scale-105 transition-all duration-300 animate-scale-in ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">
            <AnimatedCounter
              end={value}
              prefix={format === 'currency' ? '€' : ''}
              suffix={format === 'percentage' ? '%' : ''}
            />
          </div>
          
          {change !== undefined && (
            <div className={`flex items-center text-xs ${getChangeColor()}`}>
              {getTrendIcon()}
              <span className="ml-1">
                {Math.abs(change)}{format === 'percentage' ? 'pp' : '%'} desde el mes pasado
              </span>
            </div>
          )}

          {target && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Objetivo: {formatValue(target)}</span>
                <span>{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceCard;