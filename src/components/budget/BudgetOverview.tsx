'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Filter,
  Download
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface BudgetCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  budget: number;
  spent: number;
  currency: string;
}

interface BudgetOverviewProps {
  month: number;
  year: number;
  currency: string;
  categories: BudgetCategory[];
  totalBudget: number;
  totalSpent: number;
  onMonthChange: (month: number, year: number) => void;
  onAddBudget: () => void;
  onExport: () => void;
  onFilter: () => void;
}

export function BudgetOverview({
  month,
  year,
  currency,
  categories,
  totalBudget,
  totalSpent,
  onMonthChange,
  onAddBudget,
  onExport,
  onFilter,
}: BudgetOverviewProps) {
  // Get month name
  const monthName = useMemo(() => {
    const date = new Date(year, month - 1, 1);
    return date.toLocaleString('es', { month: 'long' });
  }, [month, year]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency,
    }).format(amount);
  };
  
  // Prepare chart data
  const chartData = useMemo(() => {
    return categories.map(cat => ({
      name: cat.name,
      Budget: cat.budget,
      Gastado: cat.spent,
      Disponible: Math.max(0, cat.budget - cat.spent),
      fill: cat.color || '#4f46e5'
    }));
  }, [categories]);
  
  // Calculate total progress
  const totalProgress = useMemo(() => {
    if (totalBudget === 0) return 0;
    return Math.min(100, Math.round((totalSpent / totalBudget) * 100));
  }, [totalBudget, totalSpent]);
  
  // Handle previous month
  const handlePrevMonth = () => {
    let newMonth = month - 1;
    let newYear = year;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    
    onMonthChange(newMonth, newYear);
  };
  
  // Handle next month
  const handleNextMonth = () => {
    let newMonth = month + 1;
    let newYear = year;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    
    onMonthChange(newMonth, newYear);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Presupuesto</h2>
          <Badge variant="outline" className="text-sm">
            {totalBudget > 0 
              ? formatCurrency(totalBudget - totalSpent) 
              : 'Sin presupuesto'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onFilter}>
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onExport}>
            <Download className="h-4 w-4" />
          </Button>
          <Button onClick={onAddBudget}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo presupuesto
          </Button>
        </div>
      </div>
      
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="text-center">
          <h3 className="font-medium text-lg capitalize">{monthName}</h3>
          <p className="text-sm text-muted-foreground">{year}</p>
        </div>
        
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Resumen</CardTitle>
          <CardDescription>
            Progreso general de tu presupuesto mensual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total gastado</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Presupuesto total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progreso</span>
                <span className="text-sm font-medium">{totalProgress}%</span>
              </div>
              <Progress 
                value={totalProgress} 
                className={`h-2 ${totalProgress >= 100 ? "bg-red-500" : ""}`}
              />
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-full ${
                  totalSpent <= totalBudget ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {totalSpent <= totalBudget ? (
                    <ArrowDownIcon className="h-4 w-4" />
                  ) : (
                    <ArrowUpIcon className="h-4 w-4" />
                  )}
                </div>
                <span className="text-sm">
                  {totalSpent <= totalBudget 
                    ? "Por debajo del presupuesto" 
                    : "Por encima del presupuesto"}
                </span>
              </div>
              
              <Select defaultValue="month">
                <SelectTrigger className="w-36 h-8">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Categories Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Gastos por categoría</CardTitle>
          <CardDescription>
            Comparación de presupuestos y gastos por categoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                  labelStyle={{ color: '#111' }}
                />
                <Legend />
                <Bar dataKey="Budget" name="Presupuesto" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Gastado" name="Gastado" fill="#6366f1" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Disponible" name="Disponible" fill="#a5b4fc" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Las categorías sin presupuesto asignado no se muestran.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 