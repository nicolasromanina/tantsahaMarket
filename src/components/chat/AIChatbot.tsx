import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownMessage } from '@/components/MarkdownMessage';
import { 
  Leaf, 
  X, 
  Send, 
  User, 
  Loader2, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Trash,
  Pencil,
  Menu,
  Maximize2,
  Minimize2,
  MessageSquare,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
};

type Message = { 
  role: 'user' | 'assistant'; 
  content: string;
  timestamp: Date;
  id: number;
  error?: boolean;
  retryCount?: number;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const MAX_MESSAGES_DISPLAY = 50;
const MAX_RETRIES = 3;

const SUGGESTED_QUESTIONS = [
  "Quels produits agricoles sont disponibles en ce moment ?",
  "Comment passer une commande sur la plateforme ?",
  "Est-ce que je peux vendre mes récoltes ici ?",
  "Quelles sont les zones de livraison couvertes ?",
  "Quels sont les prix du riz aujourd'hui ?",
  "Comment créer un compte producteur ?"
];

const storage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch { return null; }
  },
  set: (key: string, value: any) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } 
    catch (e) { console.error('LocalStorage error:', e); }
  }
};

export const AIChatbot = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = storage.get('tantsahabot_last_conversation');
    if (saved?.messages) {
      return saved.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
    return [{
      role: 'assistant',
      content: 'Salama tompoko! 🌾\n\nJe suis **TantsahaBot**, votre assistant pour le marché agricole malgache.\n\nJe peux vous aider avec :\n• La recherche de produits frais\n• Les commandes et paiements\n• La vente de vos récoltes\n• Les livraisons dans votre région',
      timestamp: new Date(),
      id: Date.now()
    }];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [feedback, setFeedback] = useState<{ [key: number]: 'like' | 'dislike' }>({});
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [hasNewMessageBadge, setHasNewMessageBadge] = useState(() => 
    !storage.get('tantsahabot_chat_opened')
  );
  const [showQuickActions, setShowQuickActions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior,
      block: 'end' 
    });
  }, []);

  // Optimisation du scroll pour mobile
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const timer = setTimeout(() => scrollToBottom('auto'), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMinimized, scrollToBottom]);

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(), 200);
    return () => clearTimeout(timer);
  }, [messages, isTyping, scrollToBottom]);

  // Focus automatique amélioré pour mobile
  useEffect(() => {
    if (isOpen && !isMinimized && isMobile) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        // Pour éviter le zoom automatique sur iOS
        inputRef.current?.setAttribute('inputmode', 'text');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMinimized, isMobile]);

  // Sauvegarde automatique
  useEffect(() => {
    if (messages.length > 1) {
      storage.set('tantsahabot_last_conversation', {
        messages: messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })),
        updatedAt: new Date().toISOString()
      });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      storage.set('tantsahabot_chat_opened', true);
      setHasNewMessageBadge(false);
      
      // Masquer les actions rapides après le premier message
      if (messages.length > 2) {
        setShowQuickActions(false);
      }
    }
  }, [isOpen, messages.length]);

  // Gestion du clavier virtuel mobile
  useEffect(() => {
    const handleResize = () => {
      if (isMobile && isOpen && !isMinimized) {
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, isOpen, isMinimized, scrollToBottom]);

  const clearChat = () => {
    setMessages([{
      role: 'assistant' as const,
      content: 'Salama tompoko! 🌾\n\nJe suis **TantsahaBot**, votre assistant pour le marché agricole malgache.\n\nJe peux vous aider avec :\n• La recherche de produits frais\n• Les commandes et paiements\n• La vente de vos récoltes\n• Les livraisons dans votre région',
      timestamp: new Date(),
      id: Date.now()
    }]);
    setFeedback({});
    storage.set('tantsahabot_last_conversation', null);
    setShowQuickActions(true);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = async (text: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Erreur de copie:', err);
    }
  };

  const handleFeedback = (messageId: number, type: 'like' | 'dislike') => {
    setFeedback(prev => ({ ...prev, [messageId]: type }));
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => {
      handleSubmit(new Event('submit') as any);
      setShowQuickActions(false);
    }, 100);
  };

  const retryMessage = useCallback((messageId: number) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex > 0) {
      const previousUserMessage = messages[messageIndex - 1];
      if (previousUserMessage?.role === 'user') {
        const errorMessage = messages[messageIndex];
        const retryCount = (errorMessage.retryCount || 0) + 1;
        if (retryCount <= MAX_RETRIES) {
          setMessages(prev => prev.filter((_, i) => i !== messageIndex));
          streamChat(previousUserMessage.content, retryCount);
        }
      }
    }
  }, [messages]);

  const regenerate = useCallback((messageId: number) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex > 0) {
      const previousUserMessage = messages[messageIndex - 1];
      if (previousUserMessage?.role === 'user') {
        setMessages(prev => prev.slice(0, messageIndex));
        streamChat(previousUserMessage.content);
      }
    }
  }, [messages]);

  const handleDelete = useCallback((messageId: number) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      setMessages(prev => prev.slice(0, messageIndex));
    }
  }, [messages]);

  const handleEdit = useCallback((messageId: number) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1 && messages[messageIndex].role === 'user') {
      setInput(messages[messageIndex].content);
      setMessages(prev => prev.slice(0, messageIndex));
      setTimeout(() => {
        inputRef.current?.focus();
        if (isMobile) {
          inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [messages, isMobile]);

  const streamChat = useCallback(async (userMessage: string, retryCount = 0) => {
    const userMsgId = Date.now();
    const newMessages: Message[] = [
      ...messages, 
      { 
        role: 'user', 
        content: userMessage,
        timestamp: new Date(),
        id: userMsgId
      }
    ];
    
    setMessages(newMessages);
    setIsLoading(true);
    setIsTyping(true);

    let assistantContent = '';
    let assistantMsgId = Date.now() + 1;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: newMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        throw new Error(resp.status >= 500 
          ? 'Le service est temporairement indisponible.' 
          : resp.status === 429 
            ? 'Trop de requêtes. Veuillez patienter.' 
            : `Erreur ${resp.status}`);
      }

      if (!resp.body) throw new Error('Aucune réponse du serveur');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '',
        timestamp: new Date(),
        id: assistantMsgId
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.trim() === '' || !line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: assistantContent };
                }
                return updated.slice(-MAX_MESSAGES_DISPLAY * 2);
              });
              
              // Scroll progressif pendant le streaming
              if (assistantContent.length % 20 === 0) {
                scrollToBottom('smooth');
              }
            }
          } catch {}
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erreur de connexion. Vérifiez votre internet.';

      setMessages(prev => {
        if (prev[prev.length - 1]?.content === '') prev.pop();
        return [...prev, { 
          role: 'assistant', 
          content: errorMessage,
          timestamp: new Date(),
          id: assistantMsgId,
          error: true,
          retryCount
        }];
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      scrollToBottom('smooth');
    }
  }, [messages, scrollToBottom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
    setInput('');
    setShowQuickActions(false);
    
    // Fermer le clavier virtuel sur mobile après envoi
    if (isMobile) {
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Sur mobile, permettre de fermer le clavier avec Escape
    if (e.key === 'Escape' && isMobile) {
      (e.target as HTMLElement).blur();
    }
  };

  const visibleMessages = useMemo(() => messages.slice(-MAX_MESSAGES_DISPLAY), [messages]);

  // Dimensions responsives améliorées
  const chatWidth = isMobile ? 'w-full' : isTablet ? 'w-[400px]' : 'w-[440px]';
  const chatHeight = isMobile && !isMinimized ? 'h-screen' : isFullscreen ? 'h-[85vh]' : 'h-[680px]';
  const minimizedHeight = 'h-16';

  // Bouton flottant pour mobile
  const FloatingButton = () => (
    <Button
      onClick={() => setIsOpen(true)}
      className={cn(
        "fixed z-50 rounded-full shadow-2xl",
        "bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800",
        "text-white border-4 border-white/40",
        "transition-all duration-300 hover:scale-110 hover:shadow-xl",
        isMobile 
          ? "bottom-6 right-6 h-16 w-16" 
          : "bottom-8 right-8 h-14 w-14",
        isOpen && "scale-0 opacity-0 pointer-events-none"
      )}
      size="icon"
    >
      <div className="relative">
        <Leaf className={cn(isMobile ? "h-8 w-8" : "h-7 w-7")} />
        <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-pulse" />
        {hasNewMessageBadge && (
          <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500">
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping" />
            <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">1</span>
          </span>
        )}
      </div>
    </Button>
  );

  // Version mobile en Sheet
  if (isMobile) {
    return (
      <>
        <FloatingButton />
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent 
            side="bottom" 
            className="h-[90vh] rounded-t-3xl px-0 pt-0"
          >
            <div className="flex flex-col h-full">
              {/* Header mobile */}
              <div className="px-5 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Leaf className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">TantsahaBot</h3>
                      <p className="text-xs opacity-90">Assistant agricole</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearChat}
                      className="text-white hover:bg-white/20 h-9 w-9"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-white/20 h-9 w-9"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <ScrollArea className="flex-1 px-4 py-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {visibleMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-3",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                          <Leaf className="h-5 w-5 text-green-700" />
                        </div>
                      )}

                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 shadow relative",
                        msg.role === 'user'
                          ? "bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-br-sm"
                          : msg.error
                            ? "bg-red-50 border border-red-200 text-red-900 rounded-bl-sm"
                            : "bg-white border border-green-100 rounded-bl-sm"
                      )}>
                        <MarkdownMessage
                          content={msg.content}
                          className="text-sm leading-relaxed"
                        />
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {formatTime(msg.timestamp)}
                            {msg.error && " • Échec"}
                          </span>
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(msg.content, msg.id)}
                            >
                              {copiedMessageId === msg.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                            {msg.role === 'user' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEdit(msg.id)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleDelete(msg.id)}
                                >
                                  <Trash className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {msg.role === 'user' && (
                        <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                        <Leaf className="h-5 w-5 text-green-700" />
                      </div>
                      <div className="bg-white border border-green-100 rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1.5">
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-300" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Quick questions - Version mobile compacte */}
              {showQuickActions && messages.length <= 2 && (
                <div className="px-4 pb-3 border-t border-gray-100 pt-3">
                  <ScrollArea className="w-full" orientation="horizontal">
                    <div className="flex gap-2 pb-2">
                      {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap rounded-full text-sm px-4 py-2 h-auto border-green-200 hover:border-green-400 hover:bg-green-50"
                          onClick={() => handleQuickQuestion(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Input area mobile */}
              <div className="p-4 bg-white border-t border-gray-200 safe-area-padding-bottom">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Écrivez votre message..."
                    disabled={isLoading}
                    className="flex-1 rounded-full px-4 py-3 text-base border-gray-300 focus:border-green-500"
                    inputMode="text"
                    enterKeyHint="send"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className={cn(
                      "rounded-full h-12 w-12 shrink-0",
                      input.trim() 
                        ? "bg-gradient-to-r from-green-600 to-emerald-700 hover:shadow-lg" 
                        : "bg-gray-200"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Version desktop/tablet
  return (
    <>
      <FloatingButton />

      {/* Fenêtre du chat desktop */}
      {isOpen && (
        <div className={cn(
          "fixed z-50 transition-all duration-500 ease-out",
          isFullscreen 
            ? "inset-4" 
            : isTablet 
              ? "bottom-8 right-8" 
              : "bottom-8 right-8",
          isMinimized ? "w-80" : chatWidth
        )}>
          <div className={cn(
            "flex flex-col shadow-2xl rounded-3xl overflow-hidden bg-white border border-green-200",
            "backdrop-blur-xl",
            isMinimized ? minimizedHeight : chatHeight,
            isFullscreen && "rounded-3xl"
          )}>
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-green-600 to-emerald-700 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Leaf className="h-7 w-7" />
                    </div>
                    <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-400 border-4 border-green-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      TantsahaBot
                      <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                        <span className="h-2 w-2 rounded-full bg-green-300 mr-1 animate-pulse" />
                        En ligne
                      </Badge>
                    </h3>
                    <p className="text-sm opacity-90">Assistant du marché agricole malgache</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="text-white hover:bg-white/20"
                        >
                          {isFullscreen ? (
                            <Minimize2 className="h-5 w-5" />
                          ) : (
                            <Maximize2 className="h-5 w-5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isFullscreen ? "Réduire" : "Plein écran"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsMinimized(!isMinimized)}
                          className="text-white hover:bg-white/20"
                        >
                          {isMinimized ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isMinimized ? "Agrandir" : "Réduire"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={clearChat}
                          className="text-white hover:bg-white/20"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Nouvelle conversation</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 px-6 py-6" ref={scrollAreaRef}>
                  <div className="max-w-2xl mx-auto space-y-6">
                    {visibleMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-4",
                          msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Leaf className="h-6 w-6 text-green-700" />
                          </div>
                        )}

                        <div className={cn(
                          "max-w-[75%] rounded-3xl px-5 py-4 shadow-lg relative group",
                          msg.role === 'user'
                            ? "bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-br-none"
                            : msg.error
                              ? "bg-red-50 border border-red-200 text-red-900 rounded-bl-none"
                              : "bg-white border border-green-100 rounded-bl-none"
                        )}>
                          <MarkdownMessage
                            content={msg.content}
                            className="text-sm leading-relaxed"
                          />

                          <div className="absolute -bottom-10 left-4 right-4 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 px-3 text-xs rounded-full"
                              onClick={() => copyToClipboard(msg.content, msg.id)}
                            >
                              {copiedMessageId === msg.id ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            {msg.role === 'assistant' && !msg.error && (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className={cn(
                                    "h-8 w-8",
                                    feedback[msg.id] === 'like' && "bg-green-100"
                                  )}
                                  onClick={() => handleFeedback(msg.id, 'like')}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className={cn(
                                    "h-8 w-8",
                                    feedback[msg.id] === 'dislike' && "bg-red-100"
                                  )}
                                  onClick={() => handleFeedback(msg.id, 'dislike')}
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 w-8"
                                  onClick={() => regenerate(msg.id)}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {msg.role === 'user' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(msg.id)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 w-8"
                                  onClick={() => handleDelete(msg.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {msg.error && msg.retryCount !== undefined && msg.retryCount < MAX_RETRIES && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 px-3 text-xs rounded-full shadow"
                                onClick={() => retryMessage(msg.id)}
                              >
                                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                Réessayer
                              </Button>
                            )}
                          </div>

                          <span className="block text-xs opacity-70 mt-3 text-right">
                            {formatTime(msg.timestamp)}
                            {msg.error && " • Échec"}
                          </span>
                        </div>

                        {msg.role === 'user' && (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex gap-4 justify-start">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Leaf className="h-6 w-6 text-green-700" />
                        </div>
                        <div className="bg-white border border-green-100 rounded-3xl rounded-bl-none px-6 py-4 shadow-lg">
                          <div className="flex gap-2">
                            <span className="h-3 w-3 bg-gray-400 rounded-full animate-bounce" />
                            <span className="h-3 w-3 bg-gray-400 rounded-full animate-bounce delay-150" />
                            <span className="h-3 w-3 bg-gray-400 rounded-full animate-bounce delay-300" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {showQuickActions && messages.length <= 2 && (
                  <div className="px-6 pb-4 border-t border-green-100 pt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-4">
                      Questions fréquentes
                    </p>
                    <div className={cn(
                      "grid gap-3",
                      isTablet ? "grid-cols-1" : "grid-cols-2"
                    )}>
                      {SUGGESTED_QUESTIONS.map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          className="justify-start text-left h-auto py-3 px-4 rounded-xl border-green-200 hover:border-green-400 hover:bg-green-50 whitespace-normal break-words text-sm"
                          onClick={() => handleQuickQuestion(q)}
                        >
                          <span className="line-clamp-2">{q}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-5 bg-white border-t border-green-100">
                  <form onSubmit={handleSubmit} className="flex gap-3">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Posez votre question sur les produits, livraisons..."
                      disabled={isLoading}
                      className="flex-1 rounded-full border-green-300 focus:border-green-500 py-5 text-base"
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className={cn(
                        "h-12 w-12 rounded-full shrink-0",
                        input.trim()
                          ? "bg-gradient-to-r from-green-600 to-emerald-700 hover:shadow-lg"
                          : "bg-gray-300"
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </form>
                  <p className="text-xs text-center text-gray-500 mt-4">
                    TantsahaBot peut parfois se tromper. Vérifiez les informations importantes.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};