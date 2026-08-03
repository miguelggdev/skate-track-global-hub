import React, { useRef, useEffect, useState } from 'react';
import { Bot, Send, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAgentChat, type AgentId } from '@/hooks/useAgentChat';

interface DashboardAgentPanelProps {
  agentId: AgentId;
  title: string;
  subtitle?: string;
  accentColor?: string;
  suggestedQuestions?: string[];
  defaultExpanded?: boolean;
  className?: string;
}

export function DashboardAgentPanel({
  agentId,
  title,
  subtitle,
  accentColor = 'from-orange-500 to-amber-500',
  suggestedQuestions = [],
  defaultExpanded = false,
  className,
}: DashboardAgentPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading, error, clearMessages } = useAgentChat(agentId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current && expanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, expanded]);

  useEffect(() => {
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [expanded]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleSuggestion = (q: string) => {
    if (isLoading) return;
    sendMessage(q);
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header — always visible */}
      <CardHeader
        className="pb-3 cursor-pointer select-none hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(prev => !prev)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0',
              accentColor,
            )}>
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                {title}
                <Sparkles className="h-3 w-3 text-amber-400" />
              </CardTitle>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && expanded && (
              <button
                onClick={(e) => { e.stopPropagation(); clearMessages(); }}
                className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-muted transition-colors"
              >
                Limpiar
              </button>
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {/* Collapsible body */}
      {expanded && (
        <CardContent className="p-0">
          {/* Messages area */}
          <div
            ref={scrollRef}
            className="h-56 overflow-y-auto px-4 py-3 space-y-3 border-t border-border bg-muted/10"
          >
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center py-2">
                  Pregunta a tu asistente de IA
                </p>
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestion(q)}
                    disabled={isLoading}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none',
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl rounded-bl-none px-4 py-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-destructive text-center bg-destructive/10 rounded-lg p-2">
                {error}
              </p>
            )}
          </div>

          {/* Input row */}
          <div className="px-4 py-3 border-t border-border flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={`Pregunta al ${title.toLowerCase()}...`}
              disabled={isLoading}
              className="text-xs h-8"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
