import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client-id, x-language, x-request-id, x-session-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

// Configuration
const CONFIG = {
  MAX_MESSAGES: 100,
  MAX_MESSAGE_LENGTH: 2000,
  MAX_TOTAL_CHARS: 8000,
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 2,
  RATE_LIMIT_WINDOW: 60000,
  RATE_LIMIT_MAX: 10,
  SUMMARY_THRESHOLD: 10,
  KEEP_RECENT_MESSAGES: 4,
  FAQ_CACHE_TTL: 300000, // 5 minutes
  SESSION_TTL: 1800000, // 30 minutes
} as const;

// Cache de rate limiting par IP
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

// Cache des réponses fréquentes
const faqCache = new Map<string, { response: string; timestamp: number }>();

// Cache des sessions utilisateur
const sessionCache = new Map<string, {
  id: string;
  clientId: string;
  createdAt: number;
  lastActivity: number;
  language: 'fr' | 'mg' | 'en';
  interests: string[];
  mentionedProducts: string[];
  preferences?: {
    region?: string;
    budget?: string;
    frequency?: string;
  };
}>();

// Logs structurés
interface ChatLog {
  timestamp: string;
  sessionId?: string;
  clientId?: string;
  ip?: string;
  intent?: string;
  messageCount: number;
  responseLength: number;
  latency: number;
  error?: string;
  errorType?: 'client' | 'server' | 'network';
  feedback?: 'positive' | 'negative';
  conversionEvent?: ConversionEvent;
}

interface ConversionEvent {
  productInterest?: string;
  contactRequested: boolean;
  accountSuggested: boolean;
  leadQualified: boolean;
}

interface StructuredResponse {
  tips: string[];
  suggestedProducts: Array<{
    name: string;
    alternatives: string[];
    seasonality: string;
    available: boolean;
  }>;
  nextSteps: string[];
  contactOptions?: string[];
  followUpQuestions?: string[];
}

// Fonction de validation de l'API Key
function validateApiKey(apiKey: string): boolean {
  return apiKey && apiKey.startsWith('lpak_') && apiKey.length > 30;
}

// Détection des questions sur la propriété
function isOwnershipQuestion(text: string): boolean {
  const ownershipKeywords = [
    'qui vous a créé', 'qui est ton propriétaire', 'qui t\'a fait',
    'qui t\'as créé', 'owner', 'créateur', 'propriétaire',
    'tantsahamarket est à qui', 'qui possède tantsahamarket',
    'vous appartenez à qui', 'à qui êtes-vous', 'qui est ton boss',
    'qui te dirige', 'qui t\'a programmé', 'qui t\'a développé',
    'votre créateur', 'ton maker', 'votre propriétaire'
  ];
  const lowerText = text.toLowerCase();
  return ownershipKeywords.some(keyword => lowerText.includes(keyword));
}

// Nettoyage des inputs
function sanitizeInput(text: string): string {
  return text
    .replace(/[<>]/g, '') // Supprime les balises HTML
    .slice(0, CONFIG.MAX_MESSAGE_LENGTH) // Limite la longueur
    .trim();
}

// Logs structurés
function logChat(data: ChatLog) {
  console.log(JSON.stringify({
    service: 'tantsaha-chatbot',
    level: data.error ? 'ERROR' : 'INFO',
    ...data,
  }));
}

// Vérification de la structure des messages
function validateMessages(messages: any[]): { valid: boolean; error?: string } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: 'Messages must be an array' };
  }

  if (messages.length > CONFIG.MAX_MESSAGES) {
    return { valid: false, error: `Too many messages (max ${CONFIG.MAX_MESSAGES})` };
  }

  let totalChars = 0;
  
  for (const [i, msg] of messages.entries()) {
    // Vérifier le rôle
    if (!['user', 'assistant', 'system'].includes(msg.role)) {
      return { valid: false, error: `Invalid role at message ${i}: ${msg.role}` };
    }

    // Vérifier le contenu
    if (typeof msg.content !== 'string') {
      return { valid: false, error: `Invalid content type at message ${i}` };
    }

    // Nettoyer le contenu
    msg.content = sanitizeInput(msg.content);

    if (msg.content.trim().length === 0) {
      return { valid: false, error: `Empty content at message ${i}` };
    }

    if (msg.content.length > CONFIG.MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Message ${i} too long (max ${CONFIG.MAX_MESSAGE_LENGTH} chars)` };
    }

    totalChars += msg.content.length;
    if (totalChars > CONFIG.MAX_TOTAL_CHARS) {
      return { valid: false, error: `Total message length exceeds ${CONFIG.MAX_TOTAL_CHARS} chars` };
    }
  }

  return { valid: true };
}

// Rate limiting amélioré
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitCache.get(ip);

  if (!record || now > record.resetTime) {
    const resetTime = now + CONFIG.RATE_LIMIT_WINDOW;
    rateLimitCache.set(ip, {
      count: 1,
      resetTime,
    });
    return { allowed: true, remaining: CONFIG.RATE_LIMIT_MAX - 1, resetTime };
  }

  if (record.count >= CONFIG.RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: CONFIG.RATE_LIMIT_MAX - record.count, resetTime: record.resetTime };
}

// Gestion des sessions
function getOrCreateSession(sessionId: string, clientId: string, language: 'fr' | 'mg' | 'en') {
  const now = Date.now();
  let session = sessionCache.get(sessionId);

  if (!session || now - session.lastActivity > CONFIG.SESSION_TTL) {
    session = {
      id: sessionId,
      clientId,
      createdAt: now,
      lastActivity: now,
      language,
      interests: [],
      mentionedProducts: [],
    };
    sessionCache.set(sessionId, session);
  } else {
    session.lastActivity = now;
  }

  // Nettoyer les anciennes sessions
  for (const [key, sess] of sessionCache.entries()) {
    if (now - sess.lastActivity > CONFIG.SESSION_TTL) {
      sessionCache.delete(key);
    }
  }

  return session;
}

// Détection automatique de langue améliorée
function detectLanguage(text: string): 'fr' | 'mg' | 'en' {
  const frKeywords = ['bonjour', 'merci', 'produit', 'commander', 'livraison', 'prix', 'quantité'];
  const mgKeywords = ['salama', 'misaotra', 'vokatra', 'vidiny', 'entana', 'habetsahana', 'handeha'];
  const enKeywords = ['hello', 'thank', 'product', 'order', 'delivery', 'price', 'quantity'];
  
  const lowerText = text.toLowerCase();
  
  let frScore = mgKeywords.some(keyword => lowerText.includes(keyword)) ? 0 : 1;
  let mgScore = frKeywords.some(keyword => lowerText.includes(keyword)) ? 0 : 1;
  let enScore = 1;
  
  frKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) frScore++;
  });
  
  mgKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) mgScore++;
  });
  
  enKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) enScore++;
  });
  
  if (mgScore > frScore && mgScore > enScore) return 'mg';
  if (frScore > enScore) return 'fr';
  return 'en';
}

// Détection d'intention améliorée
function detectIntent(text: string, session: any): string {
  const lowerText = text.toLowerCase();
  
  if (isOwnershipQuestion(text)) {
    return 'ownership_inquiry';
  }
  
  if (lowerText.includes('commander') || lowerText.includes('acheter') || 
      lowerText.includes('order') || lowerText.includes('mividy')) {
    return 'purchase_intent';
  }
  
  if (lowerText.includes('vendre') || lowerText.includes('vendeur') || 
      lowerText.includes('seller') || lowerText.includes('mpamokatra')) {
    return 'seller_inquiry';
  }
  
  if (lowerText.includes('prix') || lowerText.includes('tarif') || 
      lowerText.includes('price') || lowerText.includes('vidiny')) {
    return 'price_inquiry';
  }
  
  if (lowerText.includes('livraison') || lowerText.includes('delivery') || 
      lowerText.includes('handeha')) {
    return 'delivery_inquiry';
  }
  
  if (lowerText.includes('produit') || lowerText.includes('product') || 
      lowerText.includes('vokatra')) {
    return 'product_inquiry';
  }
  
  if (lowerText.includes('stock') || lowerText.includes('disponible') || 
      lowerText.includes('available')) {
    return 'availability_inquiry';
  }
  
  if (lowerText.includes('contact') || lowerText.includes('appeler') || 
      lowerText.includes('appel')) {
    return 'contact_request';
  }
  
  // Basé sur l'historique de la session
  if (session.interests.length > 0 && !session.contactRequested) {
    return 'follow_up_qualification';
  }
  
  return 'general_query';
}

// Extrait les produits mentionnés
function extractMentionedProducts(text: string, session: any): string[] {
  const products = [
    'riz', 'tomate', 'oignon', 'pomme de terre', 'viande', 'poisson',
    'litchi', 'mangue', 'vanille', 'café', 'cacao', 'girofle',
    'manioc', 'maïs', 'haricot', 'carotte', 'salade', 'piment'
  ];
  
  const mentioned: string[] = [];
  const lowerText = text.toLowerCase();
  
  products.forEach(product => {
    if (lowerText.includes(product)) {
      mentioned.push(product);
      if (!session.mentionedProducts.includes(product)) {
        session.mentionedProducts.push(product);
      }
    }
  });
  
  return mentioned;
}

// Résumer l'historique
function summarizeHistory(messages: any[], session: any): string {
  const systemMessages = messages.filter(m => m.role === 'system');
  const recentMessages = messages.slice(-CONFIG.KEEP_RECENT_MESSAGES);
  
  // Créer un résumé basé sur la session
  const summary = `Résumé de la conversation avec l'utilisateur ${session.clientId} :
  - Intérêts détectés : ${session.interests.join(', ') || 'aucun'}
  - Produits mentionnés : ${session.mentionedProducts.join(', ') || 'aucun'}
  - Langue préférée : ${session.language}
  - Dernière intention : ${session.lastIntent || 'générale'}`;
  
  return JSON.stringify([
    ...systemMessages,
    { role: 'assistant', content: summary },
    ...recentMessages,
  ]);
}

// Produits de saison à Madagascar (pré-chargés)
const SEASONAL_PRODUCTS: Record<string, string[]> = {
  janvier: ['litchis', 'mangues vertes', 'tomates', 'piments'],
  février: ['litchis', 'mangues', 'avocats', 'haricots verts'],
  mars: ['mangues', 'ananas', 'patates douces', 'ignames'],
  avril: ['mangues', 'citrons', 'carottes', 'oignons'],
  mai: ['oranges', 'mandarines', 'pommes de terre', 'choux'],
  juin: ['letchis d\'hiver', 'grenadilles', 'ail', 'gingembre'],
  juillet: ['grenadilles', 'kakis', 'poireaux', 'navets'],
  août: ['fraises', 'framboises', 'betteraves', 'céleri'],
  septembre: ['raisins', 'figues', 'aubergines', 'courgettes'],
  octobre: ['papayes', 'goyaves', 'maïs', 'poivrons', 'girofles', 'vanille'],
  novembre: ['mangues de début', 'pastèques', 'concombres', 'salades', 'clous de girofle', 'café', 'cacao','girofles'],
  décembre: ['litchis', 'mangues', 'tomates cerises', 'herbes aromatiques', 'litchis', 'café', 'cacao','girofles'],
};

// Alternatives de produits (pré-chargées)
const PRODUCT_ALTERNATIVES: Record<string, string[]> = {
  'riz': ['riz rouge', 'riz blanc', 'riz parfumé', 'riz gluant', 'maïs', 'blé'],
  'tomate': ['tomate cerise', 'tomate ronde', 'tomate allongée', 'aubergine', 'poivron'],
  'oignon': ['oignon rouge', 'oignon blanc', 'échalote', 'ail', 'poireau'],
  'pomme de terre': ['patate douce', 'igname', 'manioc', 'taro'],
  'viande': ['poulet', 'poisson', 'zebu', 'porc', 'œufs'],
  'produit d\'export': ['vanille', 'café', 'cacao', 'clous de girofle', 'litchi'],
};

// Réponses FAQ en cache
const FAQ_RESPONSES = {
  ownership: {
    fr: "Je suis TantsahaBot, l'assistant intelligent de TantsahaMarket. J'ai été créé par l'équipe de TantsahaMarket pour aider les producteurs et acheteurs agricoles à Madagascar. Mon propriétaire est TantsahaMarket, la plateforme leader du commerce agricole malgache. 🚜",
    mg: "Izaho no TantsahaBot, mpanampy manan-tsaina ao amin'ny TantsahaMarket. Noforonin'ny ekipan'ny TantsahaMarket aho hanampy ny mpamokatra sy ny mpividy ara-pambolena eto Madagasikara. Ny tompoko dia TantsahaMarket, sehatra voalohany amin'ny varotra ara-pambolena malagasy. 🌱",
    en: "I am TantsahaBot, the intelligent assistant of TantsahaMarket. I was created by the TantsahaMarket team to help agricultural producers and buyers in Madagascar. My owner is TantsahaMarket, the leading agricultural commerce platform in Madagascar. 🌾"
  },
  contact: {
<<<<<<< HEAD
    fr: "📞 Pour contacter TantsahaMarket :\n• Téléphone : +261 34 11 815 03\n• Email : contact@tantsahamarket.mg\n• Site web : www.tantsahamarket.mg\n• Adresse : Antananarivo, Madagascar\n\nNous sommes disponibles du lundi au vendredi, 8h-17h.",
    mg: "📞 Mifandray amin'ny TantsahaMarket :\n• Telefaonina : +261 34 11 815 03\n• Mailaka : contact@tantsahamarket.mg\n• Tranonkala : www.tantsahamarket.mg\n• Adiresy : Antananarivo, Madagasikara\n\nManoa isan'ny alatsinainy ka hatramin'ny zomà 8h-17h.",
    en: "📞 Contact TantsahaMarket:\n• Phone: +261 34 11 815 03\n• Email: contact@tantsahamarket.mg\n• Website: www.tantsahamarket.mg\n• Address: Antananarivo, Madagascar\n\nWe're available Monday to Friday, 8AM-5PM."
=======
    fr: "📞 Pour contacter TantsahaMarket :\n• Téléphone : +261 34 XX XX XXX\n• Email : contact@tantsahamarket.mg\n• Site web : www.tantsahamarket.mg\n• Adresse : Antananarivo, Madagascar\n\nNous sommes disponibles du lundi au vendredi, 8h-17h.",
    mg: "📞 Mifandray amin'ny TantsahaMarket :\n• Telefaonina : +261 34 XX XX XXX\n• Mailaka : contact@tantsahamarket.mg\n• Tranonkala : www.tantsahamarket.mg\n• Adiresy : Antananarivo, Madagasikara\n\nManoa isan'ny alatsinainy ka hatramin'ny zomà 8h-17h.",
    en: "📞 Contact TantsahaMarket:\n• Phone: +261 34 XX XX XXX\n• Email: contact@tantsahamarket.mg\n• Website: www.tantsahamarket.mg\n• Address: Antananarivo, Madagascar\n\nWe're available Monday to Friday, 8AM-5PM."
>>>>>>> e7fdfac14f6361615f7db7d19baa6f43ee10bcef
  }
};

// Réponses de fallback
const FALLBACK_RESPONSES = {
  fr: "Je rencontre des difficultés techniques. En attendant, voici quelques produits populaires cette saison : litchis, mangues, vanille, riz. Vous pouvez aussi contacter notre équipe au +261 34 XX XX XXX.",
  mg: "Misy olana tekinika aho. Mandritra izany, ireto vokatra malaza amin'ity vaniny ity : litchis, manga, vanila, vary. Azonao atao koa ny mifandray amin'ny ekipanay amin'ny +261 34 XX XX XXX.",
  en: "I'm experiencing technical issues. Meanwhile, here are popular products this season: litchis, mangoes, vanilla, rice. You can also contact our team at +261 34 XX XX XXX."
};

// Structure de réponse
function createStructuredResponse(
  tips: string[], 
  products: Array<{name: string, alternatives: string[], seasonality: string, available: boolean}>,
  nextSteps: string[],
  language: 'fr' | 'mg' | 'en',
  session: any
): StructuredResponse {
  
  // Générer des questions de suivi basées sur le contexte
  const followUpQuestions = [];
  
  if (products.length > 0 && !session.preferences?.region) {
    followUpQuestions.push(
      language === 'fr' ? "Dans quelle région souhaitez-vous recevoir la livraison ?" :
      language === 'mg' ? "Amin'ny faritra aiza no tianao handraisana ny entana ?" :
      "In which region would you like to receive delivery?"
    );
  }
  
  if (session.mentionedProducts.length > 0 && !session.preferences?.quantity) {
    followUpQuestions.push(
      language === 'fr' ? "Quelle quantité approximative recherchez-vous ?" :
      language === 'mg' ? "Habetsahana ahoana no tadiavinao ?" :
      "What approximate quantity are you looking for?"
    );
  }
  
  return {
    tips,
    suggestedProducts: products,
    nextSteps,
    contactOptions: language === 'fr' ? 
      ["📞 Appeler le support: +261 34 XX XX XXX", "✉️ Email: contact@tantsahamarket.mg"] :
      language === 'mg' ?
      ["📞 Antsoy ny fanohanana: +261 34 XX XX XXX", "✉️ Mailaka: contact@tantsahamarket.mg"] :
      ["📞 Call support: +261 34 XX XX XXX", "✉️ Email: contact@tantsahamarket.mg"],
    followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : undefined
  };
}

// Vérifier le cache FAQ
function checkFaqCache(question: string, language: 'fr' | 'mg' | 'en'): string | null {
  const cacheKey = `${language}_${question.substring(0, 50).toLowerCase()}`;
  const cached = faqCache.get(cacheKey);
  const now = Date.now();
  
  if (cached && now - cached.timestamp < CONFIG.FAQ_CACHE_TTL) {
    return cached.response;
  }
  
  // Vérifier les questions fréquentes
  if (question.toLowerCase().includes('contact') || question.toLowerCase().includes('appel')) {
    const response = FAQ_RESPONSES.contact[language];
    faqCache.set(cacheKey, { response, timestamp: now });
    return response;
  }
  
  return null;
}

serve(async (req) => {
  const startTime = Date.now();
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const clientId = req.headers.get('x-client-id') || 'anonymous';
  const sessionId = req.headers.get('x-session-id') || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const preferredLanguage = req.headers.get('x-language') as 'fr' | 'mg' | 'en' | null;
  
  // Gestion CORS pour OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    // Endpoint de santé
    const url = new URL(req.url);
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        sessions: sessionCache.size,
        rateLimitEntries: rateLimitCache.size,
        cacheEntries: faqCache.size
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    logChat({
      timestamp: new Date().toISOString(),
      sessionId,
      clientId,
      ip: clientIp,
      intent: 'method_not_allowed',
      messageCount: 0,
      responseLength: 0,
      latency: Date.now() - startTime,
      error: 'Method not allowed',
      errorType: 'client',
    });
    
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Vérification rate limiting
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    logChat({
      timestamp: new Date().toISOString(),
      sessionId,
      clientId,
      ip: clientIp,
      intent: 'rate_limit',
      messageCount: 0,
      responseLength: 0,
      latency: Date.now() - startTime,
      error: 'Rate limit exceeded',
      errorType: 'client',
    });
    
    return new Response(JSON.stringify({ 
      error: 'Trop de requêtes. Veuillez réessayer dans une minute.',
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    }), {
      status: 429,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'X-RateLimit-Limit': CONFIG.RATE_LIMIT_MAX.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
      },
    });
  }

  let abortController: AbortController | null = null;
  let conversionEvent: ConversionEvent | undefined;
  
  try {
    const body = await req.json().catch(() => {
      throw new Error('Corps de requête invalide (JSON attendu)');
    });

    // Validation des messages
    if (!body.messages || !Array.isArray(body.messages)) {
      throw new Error('Champ "messages" manquant ou invalide');
    }

    const validation = validateMessages(body.messages);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurée');
    }

    if (!validateApiKey(LOVABLE_API_KEY)) {
      throw new Error('LOVABLE_API_KEY invalide');
    }

    // Détection de la langue et gestion de session
    const lastUserMessage = body.messages
      .filter((m: any) => m.role === 'user')
      .pop();
    
    const detectedLanguage = lastUserMessage 
      ? detectLanguage(lastUserMessage.content)
      : 'fr';
    
    const language = preferredLanguage || detectedLanguage;
    
    // Gestion de session
    const session = getOrCreateSession(sessionId, clientId, language);
    session.language = language;

    // Détection d'intention
    const intent = detectIntent(lastUserMessage?.content || '', session);
    session.lastIntent = intent;

    // Vérifier les questions fréquentes en cache
    if (lastUserMessage && intent === 'ownership_inquiry') {
      const response = FAQ_RESPONSES.ownership[language];
      
      logChat({
        timestamp: new Date().toISOString(),
        sessionId: session.id,
        clientId,
        ip: clientIp,
        intent: 'ownership_inquiry',
        messageCount: body.messages.length,
        responseLength: response.length,
        latency: Date.now() - startTime,
      });
      
      return new Response(JSON.stringify({
        choices: [{
          message: {
            role: "assistant",
            content: response
          }
        }],
        sessionId: session.id,
        cacheHit: true
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': CONFIG.RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
          'X-Session-Id': session.id,
        },
      });
    }

    // Vérifier le cache FAQ
    const cachedResponse = lastUserMessage ? checkFaqCache(lastUserMessage.content, language) : null;
    if (cachedResponse) {
      logChat({
        timestamp: new Date().toISOString(),
        sessionId: session.id,
        clientId,
        ip: clientIp,
        intent,
        messageCount: body.messages.length,
        responseLength: cachedResponse.length,
        latency: Date.now() - startTime,
      });
      
      return new Response(JSON.stringify({
        choices: [{
          message: {
            role: "assistant",
            content: cachedResponse
          }
        }],
        sessionId: session.id,
        cacheHit: true
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': CONFIG.RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
          'X-Session-Id': session.id,
        },
      });
    }

    // Extraire les produits mentionnés et mettre à jour la session
    if (lastUserMessage) {
      const mentionedProducts = extractMentionedProducts(lastUserMessage.content, session);
      if (mentionedProducts.length > 0) {
        mentionedProducts.forEach(product => {
          if (!session.interests.includes(product)) {
            session.interests.push(product);
          }
        });
      }
    }

    // Détection de conversion
    conversionEvent = {
      productInterest: session.interests.length > 0 ? session.interests[0] : undefined,
      contactRequested: intent === 'contact_request',
      accountSuggested: false, // Sera mis à jour plus tard
      leadQualified: session.interests.length > 0 && 
                    (session.preferences?.region || session.preferences?.quantity)
    };

    // Résumer l'historique si trop long
    let processedMessages = body.messages;
    if (body.messages.length > CONFIG.SUMMARY_THRESHOLD) {
      processedMessages = JSON.parse(summarizeHistory(body.messages, session));
    }

    // Générer le system prompt adapté
    const month = new Date().toLocaleString('fr-FR', { month: 'long' });
    const seasonalProducts = SEASONAL_PRODUCTS[month] || SEASONAL_PRODUCTS.janvier;
    const userRegion = session.preferences?.region || 'non spécifiée';
    
    const systemPrompt = {
      fr: `Tu es TantsahaBot, l'assistant expert de TantsahaMarket, plateforme leader du commerce agricole à Madagascar.

CONTEXTE UTILISATEUR :
- Session : ${session.id} (client: ${clientId})
- Région : ${userRegion}
- Intérêts précédents : ${session.interests.join(', ') || 'aucun'}
- Produits mentionnés : ${session.mentionedProducts.join(', ') || 'aucun'}

CONTEXTE ACTUEL :
- Mois : ${month}
- Produits de saison : ${seasonalProducts.join(', ')}
- Intention détectée : ${intent}
- Langue : français

TON RÔLE (CONVERSION FOCUS) :
1. QUALIFICATION DU LEAD :
   - Poser 1-2 questions pour qualifier : région, quantité, délai
   - Noter : ${JSON.stringify(session.preferences || {})}
   - Si lead qualifié, proposer création de compte

2. PERSONNALISATION :
   - Adapter les suggestions à : ${userRegion}
   - Prioriser : ${session.interests.join(', ') || 'produits de saison'}
   - Mentionner alternatives pour : ${session.mentionedProducts.join(', ') || 'produits demandés'}

3. STRUCTURE DE RÉPONSE (MAX 3-4 points/section) :
   • CONSEILS PERSONNALISÉS (basés sur région/intérêts)
   • PRODUITS SUGGÉRÉS (avec prix indicatifs si disponibles)
   • PROCHAINES ÉTAPES (appel à l'action clair)

4. DÉTECTION BESOIN :
   SI produit mentionné → demander :
   - "Quelle variété préférez-vous ?"
   - "Pour quelle région ?"
   - "Quelle quantité approximative ?"
   - "Pour quand ?"

RÈGLES STRICTES :
- Langue : français uniquement
- Ton : chaleureux, professionnel, orienté solution
- Émojis : max 2 par réponse
- Privauté : jamais partager ${session.id} ou ${clientId}
- Hors-sujet : "Je suis spécialisé dans l'agriculture. Puis-je vous aider avec des produits ?"

OBJECTIF : Qualifier le lead et proposer la création de compte si pertinent.`,
      
      mg: `Hianao no TantsahaBot, mpanampy manam-pahaizana momba ny TantsahaMarket, sehatra lehibe indrindra amin'ny varotra ara-pambolena eto Madagasikara.

TOETRA MPAMPIASA :
- Fihaonambe : ${session.id} (mpampiasa: ${clientId})
- Faritra : ${userRegion}
- Zana-tsaina teo aloha : ${session.interests.join(', ') || 'tsy misy'}
- Vokatra nolazaina : ${session.mentionedProducts.join(', ') || 'tsy misy'}

TOE-JAVATRA AFAKETSY :
- Volana : ${month}
- Vokatra mety amin'izao fotoana izao : ${seasonalProducts.join(', ')}
- Tanjona hita : ${intent}
- Fiteny : malagasy

NY ANJARA ASAO (MIHENTONA AMIN'NY FIVIDIANANA) :
1. FANOMBANANA NY FILANA :
   - Anontanio fanontaniana 1-2 : faritra, habetsahana, fotoana
   - Notio : ${JSON.stringify(session.preferences || {})}
   - Raha voamarina ny filana, toloro famoronana kaonty

2. FANAMARINANA MANOKANA :
   - Ampifanaraho amin'ny : ${userRegion}
  - Asongady aloha : ${session.interests.join(', ') || 'vokatra mety amin\'izao fotoana izao'}
   - Lazao safidy ho an'ny : ${session.mentionedProducts.join(', ') || 'vokatra angatahina'}

3. ENDRIKY NY VALINY (FARIBOLANA 3-4 isa/ampahany) :
   • TORO-HEVITRA MANOKANA (mifototra amin'ny faritra/zana-tsaina)
   • VOKATRA SOSO-KEVITRA (miaraka amin'ny vidiny raha azo atao)
   • DINGANA MANARAKA (asa antso mazava)

4. FANADINANA NY FILANA :
   RAHA nolazaina vokatra → anontanio :
   - "Karazana inona no tianao ?"
   - "Ho an'ny faritra aiza ?"
   - "Habetsahana ahoana ?"
   - "Amin'ny daty inona ?"

FEPETRA MAFY :
- Fiteny : malagasy ihany
- Fomba : mafana fo, matihanina, mifantoka amin'ny vahaolana
- Emoji : faribolana 2 isa ho an'ny valiny iray
- Tsiambaratelo : aza mizara ${session.id} na ${clientId}
- Lohahevitra ivelany : "Mifantoka amin'ny fambolena aho. Afaka manampy anao amin'ny vokatra ve aho?"

TANJONA : Hanombana ny filana ary holaro famoronana kaonty raha mety.`,
      
      en: `You are TantsahaBot, the expert assistant of TantsahaMarket, the leading agricultural commerce platform in Madagascar.

USER CONTEXT:
- Session: ${session.id} (client: ${clientId})
- Region: ${userRegion}
- Previous interests: ${session.interests.join(', ') || 'none'}
- Mentioned products: ${session.mentionedProducts.join(', ') || 'none'}

CURRENT CONTEXT:
- Month: ${month}
- Seasonal products: ${seasonalProducts.join(', ')}
- Detected intent: ${intent}
- Language: English

YOUR ROLE (CONVERSION FOCUS):
1. LEAD QUALIFICATION:
   - Ask 1-2 qualifying questions: region, quantity, timeframe
   - Note: ${JSON.stringify(session.preferences || {})}
   - If lead qualified, suggest account creation

2. PERSONALIZATION:
   - Adapt suggestions to: ${userRegion}
   - Prioritize: ${session.interests.join(', ') || 'seasonal products'}
   - Mention alternatives for: ${session.mentionedProducts.join(', ') || 'requested products'}

3. RESPONSE STRUCTURE (MAX 3-4 points/section):
   • PERSONALIZED TIPS (based on region/interests)
   • SUGGESTED PRODUCTS (with indicative prices if available)
   • NEXT STEPS (clear call to action)

4. NEED DETECTION:
   IF product mentioned → ask:
   - "Which variety do you prefer?"
   - "For which region?"
   - "What approximate quantity?"
   - "For when?"

STRICT RULES:
- Language: English only
- Tone: warm, professional, solution-oriented
- Emojis: max 2 per response
- Privacy: never share ${session.id} or ${clientId}
- Off-topic: "I specialize in agriculture. Can I help you with products?"

GOAL: Qualify the lead and suggest account creation when relevant.`
    }[language];

    // Configuration avec timeout
    abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController!.abort(), CONFIG.TIMEOUT_MS);

    // Préparer les headers avec retry logic
    const fetchWithRetry = async (retryCount = 0): Promise<Response> => {
      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-1.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              ...processedMessages,
            ],
            stream: true,
            temperature: 0.7,
            max_output_tokens: 1024,
            top_p: 0.95,
          }),
          signal: abortController?.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Retry only for network errors and 5xx
          if (retryCount < CONFIG.MAX_RETRIES && 
              (response.status >= 500 || response.status === 429)) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return fetchWithRetry(retryCount + 1);
          }
          
          const errorText = await response.text();
          throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        
        if (retryCount < CONFIG.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchWithRetry(retryCount + 1);
        }
        
        throw error;
      }
    };

    // Vérifier si le client supporte le streaming
    const acceptHeader = req.headers.get('accept') || '';
    const supportsStreaming = acceptHeader.includes('text/event-stream') || 
                             body.stream !== false;

    if (supportsStreaming) {
      const response = await fetchWithRetry();
      
      // Mettre à jour l'événement de conversion
      if (conversionEvent) {
        conversionEvent.accountSuggested = response.headers.get('content-type')?.includes('suggest-account') || false;
      }
      
      // Log succès
      logChat({
        timestamp: new Date().toISOString(),
        sessionId: session.id,
        clientId,
        ip: clientIp,
        intent,
        messageCount: processedMessages.length,
        responseLength: 0, // streaming
        latency: Date.now() - startTime,
        conversionEvent,
      });

      // Streaming direct avec headers enrichis
      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/event-stream',
          'X-RateLimit-Limit': CONFIG.RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
          'X-Session-Id': session.id,
          'X-Client-Id': clientId,
          'X-Session-TTL': CONFIG.SESSION_TTL.toString(),
          'X-Session-Interests': session.interests.join(','),
          'X-Lead-Qualified': conversionEvent?.leadQualified?.toString() || 'false',
        },
      });
    } else {
      // Fallback non-streaming
      const response = await fetchWithRetry();
      const data = await response.json();
      
      // Mettre à jour l'événement de conversion
      if (conversionEvent) {
        conversionEvent.accountSuggested = data.choices?.[0]?.message?.content?.includes('compte') || 
                                          data.choices?.[0]?.message?.content?.includes('account') || false;
      }
      
      // Log succès
      logChat({
        timestamp: new Date().toISOString(),
        sessionId: session.id,
        clientId,
        ip: clientIp,
        intent,
        messageCount: processedMessages.length,
        responseLength: JSON.stringify(data).length,
        latency: Date.now() - startTime,
        conversionEvent,
      });

      return new Response(JSON.stringify({
        ...data,
        sessionInfo: {
          sessionId: session.id,
          interests: session.interests,
          mentionedProducts: session.mentionedProducts,
          preferences: session.preferences,
          leadQualified: conversionEvent?.leadQualified,
          suggestedAccount: conversionEvent?.accountSuggested
        }
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': CONFIG.RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
          'X-Session-Id': session.id,
          'X-Client-Id': clientId,
          'X-Session-TTL': CONFIG.SESSION_TTL.toString(),
        },
      });
    }

  } catch (error) {
    clearTimeout(abortController ? undefined : undefined);
    
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const errorType = errorMessage.includes('timeout') ? 'network' : 
                     errorMessage.includes('API Error') ? 'server' : 'client';

    // Log erreur
    logChat({
      timestamp: new Date().toISOString(),
      sessionId,
      clientId,
      ip: clientIp,
      intent: 'error',
      messageCount: 0,
      responseLength: 0,
      latency,
      error: errorMessage,
      errorType,
      conversionEvent,
    });

    // Message d'erreur adapté
    let userMessage = FALLBACK_RESPONSES[preferredLanguage || 'fr'];
    let status = 500;

    if (errorMessage.includes('timeout')) {
      userMessage = 'La requête a pris trop de temps. Veuillez réessayer.';
      status = 408;
    } else if (errorMessage.includes('Rate limit')) {
      userMessage = 'Trop de requêtes. Veuillez patienter.';
      status = 429;
    } else if (errorMessage.includes('Validation') || errorMessage.includes('JSON')) {
      userMessage = errorMessage;
      status = 400;
    } else if (errorMessage.includes('LOVABLE_API_KEY')) {
      userMessage = 'Erreur de configuration du service.';
      status = 500;
    }

    // En mode développement, inclure plus de détails
    const isDevelopment = Deno.env.get('DENO_ENV') === 'development';
    
    return new Response(JSON.stringify({ 
      error: userMessage,
      details: isDevelopment ? errorMessage : undefined,
      sessionId,
      fallback: true
    }), {
      status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': CONFIG.RATE_LIMIT_MAX.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
        'X-Session-Id': sessionId,
        'X-Error-Type': errorType,
      },
    });
  }
});