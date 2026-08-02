import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, Loader2, Trash2, ChevronDown,
  Brain, Apple, Dumbbell, HeartPulse, Bike,
  Smile, DollarSign, Megaphone, Trophy, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAgentChat, type AgentId, type ChatMessage } from '@/hooks/useAgentChat';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AgentDef {
  id: AgentId;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  roles: string[];
  suggestions: string[];
}

const ALL_AGENTS: AgentDef[] = [
  {
    id: 'skating',
    name: 'Experto en Patinaje',
    description: 'Reglas FCP, técnica, categorías y equipamiento',
    icon: Trophy,
    color: 'text-orange-500',
    gradient: 'from-orange-500 to-orange-700',
    roles: ['admin', 'coach', 'athlete', 'delegate', 'leader', 'finance', 'parent'],
    suggestions: [
      '¿Qué categoría tiene un atleta nacido el 15 de marzo de 2012?',
      '¿Qué rueda puede usar un Prejuvenil?',
      '¿Cómo mejorar la técnica de virajes?',
    ],
  },
  {
    id: 'admin',
    name: 'Asistente Administrativo',
    description: 'Atletas, finanzas y competencias en tiempo real',
    icon: Shield,
    color: 'text-violet-500',
    gradient: 'from-violet-500 to-violet-700',
    roles: ['admin', 'leader'],
    suggestions: [
      '¿Cuántos atletas activos tiene el club?',
      '¿Cuál es el resumen financiero del mes?',
      '¿Qué competencias vienen próximamente?',
    ],
  },
  {
    id: 'finance',
    name: 'Asesor Financiero',
    description: 'Ingresos, egresos y pagos pendientes',
    icon: DollarSign,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500 to-emerald-700',
    roles: ['admin', 'leader', 'finance'],
    suggestions: [
      '¿Cuál es el balance del mes?',
      '¿Quién tiene pagos pendientes?',
      '¿Cómo van los ingresos vs la meta anual?',
    ],
  },
  {
    id: 'nutrition',
    name: 'Nutricionista Deportivo',
    description: 'Planes nutricionales e hidratación',
    icon: Apple,
    color: 'text-green-500',
    gradient: 'from-green-500 to-green-700',
    roles: ['admin', 'coach', 'athlete', 'leader'],
    suggestions: [
      '¿Qué debe comer un atleta antes de competir?',
      '¿Cómo hidratarse durante un entrenamiento largo?',
      'Plan de alimentación para una Juvenil de 16 años',
    ],
  },
  {
    id: 'gym',
    name: 'Preparador Físico',
    description: 'Fuerza, pliometría y prevención de lesiones',
    icon: Dumbbell,
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-blue-700',
    roles: ['admin', 'coach', 'athlete', 'leader'],
    suggestions: [
      '¿Qué ejercicios de fuerza son clave para patinadores?',
      '¿Cómo prevenir lesiones de rodilla?',
      'Rutina de pliometría para aumentar potencia',
    ],
  },
  {
    id: 'medical',
    name: 'Medicina Deportiva',
    description: 'Salud, lesiones y retorno al deporte',
    icon: HeartPulse,
    color: 'text-red-500',
    gradient: 'from-red-500 to-red-700',
    roles: ['admin', 'coach', 'leader'],
    suggestions: [
      '¿Cuál es el protocolo PRICE para una lesión?',
      '¿Cómo saber si un atleta puede volver a entrenar?',
      '¿Qué chequeos médicos debe tener un patinador?',
    ],
  },
  {
    id: 'cycling',
    name: 'Experto en Ciclismo',
    description: 'Entrenamiento cruzado con bicicleta',
    icon: Bike,
    color: 'text-cyan-500',
    gradient: 'from-cyan-500 to-cyan-700',
    roles: ['admin', 'coach', 'athlete', 'leader'],
    suggestions: [
      '¿Cuándo incluir ciclismo en la semana de entrenamiento?',
      '¿Qué zona de frecuencia cardíaca usar para recuperación?',
      'Plan de ciclismo para pretemporada',
    ],
  },
  {
    id: 'psychology',
    name: 'Psicólogo Deportivo',
    description: 'Preparación mental y manejo de ansiedad',
    icon: Smile,
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-pink-700',
    roles: ['admin', 'coach', 'athlete', 'leader', 'parent'],
    suggestions: [
      '¿Cómo manejar los nervios antes de una competencia?',
      'Técnicas de concentración para atletas jóvenes',
      '¿Cómo hablar con un atleta que quiere abandonar?',
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing y Comunicación',
    description: 'Redes sociales y comunicaciones del club',
    icon: Megaphone,
    color: 'text-yellow-500',
    gradient: 'from-yellow-500 to-yellow-600',
    roles: ['admin', 'leader'],
    suggestions: [
      'Ideas de contenido para Instagram del club',
      '¿Cómo comunicar un logro de un atleta a los padres?',
      'Estrategia para atraer nuevos atletas al club',
    ],
  },
  {
    id: 'results',
    name: 'Analista de Resultados',
    description: 'Competencias, rankings y rendimiento',
    icon: Brain,
    color: 'text-indigo-500',
    gradient: 'from-indigo-500 to-indigo-700',
    roles: ['admin', 'coach', 'delegate', 'leader'],
    suggestions: [
      '¿Cuáles son los atletas con más medallas este año?',
      'Analiza el rendimiento de una competencia',
      '¿En qué categorías somos más fuertes?',
    ],
  },
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        )}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
}

export default function AgentChat() {
  const { profile } = useUserProfile();
  const role = profile?.role ?? 'athlete';

  const availableAgents = ALL_AGENTS.filter(a => a.roles.includes(role));
  const [activeAgent, setActiveAgent] = useState<AgentDef>(availableAgents[0] ?? ALL_AGENTS[0]);

  const { messages, sendMessage, isLoading, error, clearMessages } = useAgentChat(activeAgent.id);

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectAgent = (agent: AgentDef) => {
    setActiveAgent(agent);
    clearMessages();
  };

  const AgentIcon = activeAgent.icon;

  return (
    <DashboardLayout title="Asistentes IA" userRole={role}>
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto gap-4">

        {/* Agent selector */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 h-10 pr-3">
                <div className={cn('w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center', activeAgent.gradient)}>
                  <AgentIcon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-medium text-sm">{activeAgent.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              {availableAgents.map(agent => {
                const Icon = agent.icon;
                return (
                  <DropdownMenuItem
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent)}
                    className={cn(
                      'flex items-start gap-3 px-3 py-2.5 cursor-pointer',
                      activeAgent.id === agent.id && 'bg-muted'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0 mt-0.5', agent.gradient)}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{agent.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{agent.description}</p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-border bg-card overflow-hidden">
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center gap-6 py-12">
                <div className={cn('w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg', activeAgent.gradient)}>
                  <AgentIcon className="h-8 w-8 text-white" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-semibold text-foreground">{activeAgent.name}</h3>
                  <p className="text-sm text-muted-foreground">{activeAgent.description}</p>
                </div>
                <div className="w-full max-w-md space-y-2">
                  <p className="text-xs text-center text-muted-foreground mb-3">Preguntas sugeridas</p>
                  {activeAgent.suggestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      disabled={isLoading}
                      className="w-full text-left text-sm px-4 py-2.5 rounded-xl border border-border bg-muted/30 hover:bg-muted text-foreground transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {error && (
              <div className="mx-auto max-w-sm">
                <p className="text-xs text-destructive text-center bg-destructive/10 rounded-xl p-3">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2 items-end bg-card">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Pregunta al ${activeAgent.name.toLowerCase()}...`}
              disabled={isLoading}
              rows={1}
              className="resize-none min-h-[40px] max-h-32 text-sm leading-relaxed"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="sm"
              className={cn('h-10 w-10 p-0 flex-shrink-0 bg-gradient-to-br text-white', activeAgent.gradient)}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
