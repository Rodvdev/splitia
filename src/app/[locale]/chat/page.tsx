'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Trash, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

const initialMessages: Message[] = [
  {
    id: '1',
    content: "👋 ¡Hola! Soy Splitia Assistant, tu ayudante virtual para gestionar gastos compartidos. Puedo ayudarte a crear grupos, registrar gastos y resolver cualquier duda sobre la aplicación. ¿En qué puedo ayudarte hoy?",
    role: 'assistant',
    timestamp: new Date(),
  },
];

export default function ChatPage() {
  const t = useTranslations();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };
    
    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Simulate AI response (in a real app, call an API)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(input),
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  // Sample response generator
  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('grupo') || lowerQuery.includes('group')) {
      return "Para crear un grupo, ve a la sección 'Grupos' y haz clic en 'Crear grupo'. Luego podrás invitar a tus amigos y comenzar a registrar gastos compartidos.";
    } else if (lowerQuery.includes('gasto') || lowerQuery.includes('expense')) {
      return "Puedes registrar un gasto desde la sección 'Gastos'. Especifica el monto, quién pagó, y cómo se divide. El sistema calculará automáticamente quién debe a quién.";
    } else if (lowerQuery.includes('hola') || lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
      return "¡Hola! Estoy aquí para ayudarte con Splitia. ¿Tienes alguna duda específica sobre cómo dividir gastos o usar la aplicación?";
    } else {
      return "Gracias por tu mensaje. Como asistente de Splitia, puedo ayudarte a gestionar gastos compartidos, crear grupos, registrar pagos y más. ¿Podrías ser más específico sobre lo que necesitas?";
    }
  };

  const clearChat = () => {
    setMessages(initialMessages);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle textarea height
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInput(textarea.value);
    
    // Reset height to calculate actual height
    textarea.style.height = 'auto';
    
    // Set new height based on scrollHeight, with a max height
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  };

  // Handle Ctrl+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b p-4 flex items-center justify-between bg-white dark:bg-gray-950">
        <h1 className="text-xl font-bold">{t('chat.title')} - Splitia</h1>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearChat}
          className="text-muted-foreground"
        >
          <Trash className="h-4 w-4 mr-2" />
          {t('chat.newChat')}
        </Button>
      </header>
      
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={cn(
              "flex items-start gap-3 max-w-3xl mx-auto",
              message.role === 'assistant' ? "bg-muted/50 p-4 rounded-lg" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              message.role === 'assistant' ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
            )}>
              {message.role === 'assistant' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <div className="font-medium">
                {message.role === 'assistant' ? 'Splitia Assistant' : 'You'}
              </div>
              <div className="mt-1 text-pretty">
                {message.content}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start gap-3 max-w-3xl mx-auto bg-muted/50 p-4 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium">
                Splitia Assistant
              </div>
              <div className="mt-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.messageInput')}
              rows={1}
              className="pr-20 resize-none min-h-[56px] max-h-[200px] overflow-y-auto"
            />
            <Button 
              size="sm" 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">{t('chat.send')}</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t('chat.assistant')} &copy; {new Date().getFullYear()} Splitia
          </p>
        </form>
      </div>
    </div>
  );
} 