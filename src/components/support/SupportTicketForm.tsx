'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SUPPORT_CONFIG } from '@/lib/support';
import { MessageSquare, AlertTriangle, Bug, CreditCard, User, Lightbulb } from 'lucide-react';

interface SupportTicketFormProps {
  onSubmit: (data: TicketFormData) => void;
  isLoading?: boolean;
}

interface TicketFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
}

const categoryIcons = {
  TECHNICAL: AlertTriangle,
  BILLING: CreditCard,
  FEATURE_REQUEST: Lightbulb,
  BUG_REPORT: Bug,
  ACCOUNT: User,
  GENERAL: MessageSquare,
};

export function SupportTicketForm({ onSubmit, isLoading }: SupportTicketFormProps) {
  const [formData, setFormData] = useState<TicketFormData>({
    title: '',
    description: '',
    category: '',
    priority: '',
  });
  const [errors, setErrors] = useState<Partial<TicketFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<TicketFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'El título debe tener al menos 5 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'La descripción debe tener al menos 20 caracteres';
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof TicketFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const IconComponent = categoryIcons[categoryId as keyof typeof categoryIcons];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Ticket de Soporte</CardTitle>
        <CardDescription>
          Describe tu problema o consulta y te ayudaremos a resolverlo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título del problema</Label>
            <Input
              id="title"
              placeholder="Describe brevemente el problema..."
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORT_CONFIG.categories).map(([key, category]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(key)}
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-muted-foreground">{category.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          {/* Priority */}
          {formData.category && (
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una prioridad" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPORT_CONFIG.priorities).map(([key, priority]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            priority.color === 'green' ? 'bg-green-500' :
                            priority.color === 'yellow' ? 'bg-yellow-500' :
                            priority.color === 'orange' ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                        />
                        <div>
                          <div className="font-medium">{priority.name}</div>
                          <div className="text-xs text-muted-foreground">
                            SLA: {priority.slaHours}h
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción detallada</Label>
            <Textarea
              id="description"
              placeholder="Proporciona todos los detalles relevantes sobre tu problema..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={errors.description ? 'border-red-500' : ''}
              rows={6}
            />
            <div className="flex justify-between items-center">
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
              <p className="text-sm text-muted-foreground ml-auto">
                {formData.description.length}/500
              </p>
            </div>
          </div>

          {/* Category Info */}
          {formData.category && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{SUPPORT_CONFIG.categories[formData.category as keyof typeof SUPPORT_CONFIG.categories]?.name}:</strong>{' '}
                {SUPPORT_CONFIG.categories[formData.category as keyof typeof SUPPORT_CONFIG.categories]?.description}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Crear Ticket'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
