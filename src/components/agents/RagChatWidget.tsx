import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, ChevronDown, ChevronUp, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useRagChat, type RagMessage } from '@/hooks/useRagChat';

const SUGGESTED_QUESTIONS = [
  '¿Qué rueda puede usar un Infantil B de 12 años?',
  '¿Cuáles son las reglas de falta en el circuito AMEBA?',
  '¿Cuántos atletas se premian en Mini 7 años?',
  '¿Cuáles son las pruebas del Campeonato Nacional FCP?',
];

interface SourcesListProps {
  sources: NonNullable<RagMessage['sources']>;
}

function SourcesList({ sources }: SourcesListProps) {
  const [expanded, setExpanded] = useState(false);
  if (!sources.length) return null;

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <FileText className="h-3 w-3" />
        <span>{sources.length} fuente{sources.length > 1 ? 's' : ''}</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {expanded && (
        <div className="mt-1.5 space-y-1.5 pl-1 border-l-2 border-border">
          {sources.map((src, i) => (
            <div key={i} className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {src.document}{src.page ? `, pág. ${src.page}` : ''}
              </span>
              {src.excerpt && (
                <p className="mt-0.5 italic line-clamp-2">"{src.excerpt}"</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RagChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading, error, clearMessages } = useRagChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleSuggestion = (q: string) => {
    sendMessage(q);
  };

  return (
    <>
      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 lg:bottom-6 z-50 w-[calc(100vw-2rem)] max-w-sm flex flex-col bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-orange-500/10 to-transparent">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <FileText className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Consulta de Documentos</span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-muted transition-colors"
                >
                  Limpiar
                </button>
              )}
              <button onClick={() => setIsOpen(false)} aria-label="Cerrar chat" className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages — div nativo para que ref.scrollTop funcione */}
          <div ref={scrollRef} className="flex-1 h-72 overflow-y-auto">
            <div className="p-4 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center">
                    Consulta reglamentos, resoluciones y manuales FCP
                  </p>
                  <div className="space-y-1.5">
                    {SUGGESTED_QUESTIONS.map((q) => (
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
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                      msg.role === 'user'
                        ? 'bg-orange-500 text-white rounded-br-none'
                        : 'bg-muted text-foreground rounded-bl-none'
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.role === 'assistant' && msg.sources && (
                      <SourcesList sources={msg.sources} />
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl rounded-bl-none px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-destructive text-center bg-destructive/10 rounded-lg p-2">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Escribe tu pregunta..."
              disabled={isLoading}
              className="text-sm h-11"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              aria-label="Enviar mensaje"
              className="h-11 w-11 p-0 bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* FAB trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-20 right-4 lg:bottom-6 lg:right-4 z-50',
          'w-12 h-12 rounded-full shadow-lg flex items-center justify-center',
          'bg-gradient-to-br from-orange-500 to-amber-500 text-white',
          'hover:scale-110 active:scale-95 transition-all duration-200',
          isOpen && 'hidden lg:hidden'
        )}
        aria-label="Consultar documentos"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    </>
  );
}
