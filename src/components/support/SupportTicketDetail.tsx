'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  AlertTriangle, 
  Bug, 
  CreditCard, 
  User, 
  Lightbulb,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Lock
} from 'lucide-react';
import { SUPPORT_CONFIG, getNextStatus } from '@/lib/support';

interface SupportMessage {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    lastName: string;
    role?: string;
  };
}

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
  messages: SupportMessage[];
  attachments: any[];
}

interface SupportTicketDetailProps {
  ticket: SupportTicket;
  onBack: () => void;
  onUpdateTicket: (ticketId: string, updates: any) => void;
  onSendMessage: (ticketId: string, content: string, isInternal?: boolean) => void;
  isLoading?: boolean;
  isAdmin?: boolean;
}

const categoryIcons = {
  TECHNICAL: AlertTriangle,
  BILLING: CreditCard,
  FEATURE_REQUEST: Lightbulb,
  BUG_REPORT: Bug,
  ACCOUNT: User,
  GENERAL: MessageSquare,
};

const statusIcons = {
  OPEN: Clock,
  IN_PROGRESS: Clock,
  PENDING_CUSTOMER: Clock,
  RESOLVED: CheckCircle,
  CLOSED: XCircle,
};

export function SupportTicketDetail({
  ticket,
  onBack,
  onUpdateTicket,
  onSendMessage,
  isLoading,
  isAdmin = false
}: SupportTicketDetailProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: ticket.status,
    priority: ticket.priority,
    resolution: ticket.resolution || '',
  });

  const getStatusBadge = (status: string) => {
    const config = SUPPORT_CONFIG.statuses[status as keyof typeof SUPPORT_CONFIG.statuses];
    if (!config) return <Badge variant="outline">{status}</Badge>;

    return (
      <Badge 
        variant={config.color === 'blue' ? 'default' : 'secondary'}
        className={
          config.color === 'green' ? 'bg-green-500' :
          config.color === 'orange' ? 'bg-orange-500' :
          config.color === 'yellow' ? 'bg-yellow-500' :
          config.color === 'red' ? 'bg-red-500' :
          ''
        }
      >
        {config.name}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = SUPPORT_CONFIG.priorities[priority as keyof typeof SUPPORT_CONFIG.priorities];
    if (!config) return <Badge variant="outline">{priority}</Badge>;

    return (
      <Badge 
        variant="outline"
        className={
          config.color === 'green' ? 'border-green-500 text-green-700' :
          config.color === 'yellow' ? 'border-yellow-500 text-yellow-700' :
          config.color === 'orange' ? 'border-orange-500 text-orange-700' :
          config.color === 'red' ? 'border-red-500 text-red-700' :
          ''
        }
      >
        {config.name}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category as keyof typeof categoryIcons];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    const IconComponent = statusIcons[status as keyof typeof statusIcons];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(ticket.id, newMessage.trim(), isInternal);
      setNewMessage('');
      setIsInternal(false);
    }
  };

  const handleSaveChanges = () => {
    onUpdateTicket(ticket.id, editData);
    setIsEditing(false);
  };

  const canEdit = isAdmin || ticket.createdBy.id === ticket.createdBy.id;
  const nextStatuses = getNextStatus(ticket.status as any);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        
        {canEdit && !isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </div>

      {/* Ticket Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getCategoryIcon(ticket.category)}
                <CardTitle>{ticket.title}</CardTitle>
              </div>
              <CardDescription>
                Creado por {ticket.createdBy.name} {ticket.createdBy.lastName} • {formatDate(ticket.createdAt)}
              </CardDescription>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Descripción</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {ticket.assignedTo && (
            <div>
              <h4 className="font-medium mb-2">Asignado a</h4>
              <p className="text-sm">
                {ticket.assignedTo.name} {ticket.assignedTo.lastName}
              </p>
            </div>
          )}

          {ticket.resolution && (
            <div>
              <h4 className="font-medium mb-2">Resolución</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {ticket.resolution}
              </p>
            </div>
          )}

          {/* Edit Form */}
          {isEditing && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium">Editar Ticket</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Estado</label>
                  <Select 
                    value={editData.status} 
                    onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {nextStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {SUPPORT_CONFIG.statuses[status as keyof typeof SUPPORT_CONFIG.statuses]?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Prioridad</label>
                  <Select 
                    value={editData.priority} 
                    onValueChange={(value) => setEditData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SUPPORT_CONFIG.priorities).map(([key, priority]) => (
                        <SelectItem key={key} value={key}>
                          {priority.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Resolución</label>
                <Textarea
                  value={editData.resolution}
                  onChange={(e) => setEditData(prev => ({ ...prev, resolution: e.target.value }))}
                  placeholder="Describe la resolución del problema..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveChanges}>
                  Guardar Cambios
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Conversación</CardTitle>
          <CardDescription>
            {ticket.messages.length} mensaje(s)
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Messages List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {ticket.messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${
                  message.isInternal 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {message.sender.name} {message.sender.lastName}
                    </span>
                    {message.sender.role === 'ADMIN' && (
                      <Badge variant="secondary" className="text-xs">Admin</Badge>
                    )}
                    {message.isInternal && (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Interno
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
                
                <p className="text-sm whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            ))}
          </div>

          <Separator />

          {/* New Message */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nuevo mensaje</label>
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                rows={3}
              />
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isInternal"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                />
                <label htmlFor="isInternal" className="text-sm">
                  Mensaje interno (solo visible para administradores)
                </label>
              </div>
            )}

            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
