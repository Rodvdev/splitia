'use client';

import { useState, useEffect } from 'react';
import { SupportTicketForm } from '@/components/support/SupportTicketForm';
import { SupportTicketList } from '@/components/support/SupportTicketList';
import { SupportTicketDetail } from '@/components/support/SupportTicketDetail';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, MessageSquare } from 'lucide-react';

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
  messages: any[];
  attachments: any[];
  _count: {
    messages: number;
    attachments: number;
  };
}

interface TicketFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
}

interface SupportPageClientProps {
  userId: string;
}

export function SupportPageClient({ userId }: SupportPageClientProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/support/tickets');
      const data = await response.json();

      if (data.success) {
        setTickets(data.data.tickets);
      } else {
        setError(data.error || 'Error al cargar los tickets');
      }
    } catch (err) {
      setError('Error al cargar los tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async (formData: TicketFormData) => {
    try {
      setIsCreating(true);
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setTickets(prev => [data.data, ...prev]);
        setActiveTab('list');
        setSelectedTicket(null);
        setError(null);
      } else {
        setError(data.error || 'Error al crear el ticket');
      }
    } catch (err) {
      setError('Error al crear el ticket');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTicketClick = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedTicket(data.data);
        setActiveTab('detail');
      } else {
        setError(data.error || 'Error al cargar el ticket');
      }
    } catch (err) {
      setError('Error al cargar el ticket');
    }
  };

  const handleUpdateTicket = async (ticketId: string, updates: any) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedTicket(data.data);
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId ? data.data : ticket
        ));
      } else {
        setError(data.error || 'Error al actualizar el ticket');
      }
    } catch (err) {
      setError('Error al actualizar el ticket');
    }
  };

  const handleSendMessage = async (ticketId: string, content: string, isInternal?: boolean) => {
    try {
      setIsSending(true);
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, isInternal }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the selected ticket to get updated messages
        handleTicketClick(ticketId);
      } else {
        setError(data.error || 'Error al enviar el mensaje');
      }
    } catch (err) {
      setError('Error al enviar el mensaje');
    } finally {
      setIsSending(false);
    }
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setActiveTab('list');
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
        <Button 
          variant="outline" 
          onClick={() => setError(null)}
          className="mt-2"
        >
          Cerrar
        </Button>
      </Alert>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="list" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Mis Tickets
        </TabsTrigger>
        <TabsTrigger value="create" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Crear Ticket
        </TabsTrigger>
        <TabsTrigger value="detail" disabled={!selectedTicket}>
          Detalle del Ticket
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="list" className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Mis Tickets de Soporte</h2>
          <p className="text-muted-foreground">
            Gestiona tus consultas y problemas reportados
          </p>
        </div>
        
        <SupportTicketList
          tickets={tickets}
          onTicketClick={handleTicketClick}
          isLoading={isLoading}
          isAdmin={false} // You might want to determine this based on user role
        />
      </TabsContent>
      
      <TabsContent value="create" className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Crear Nuevo Ticket</h2>
          <p className="text-muted-foreground">
            Describe tu problema o consulta y te ayudaremos a resolverlo
          </p>
        </div>
        
        <SupportTicketForm
          onSubmit={handleCreateTicket}
          isLoading={isCreating}
        />
      </TabsContent>
      
      <TabsContent value="detail" className="space-y-6">
        {selectedTicket && (
          <SupportTicketDetail
            ticket={selectedTicket}
            onBack={handleBackToList}
            onUpdateTicket={handleUpdateTicket}
            onSendMessage={handleSendMessage}
            isLoading={isSending}
            isAdmin={false} // You might want to determine this based on user role
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
