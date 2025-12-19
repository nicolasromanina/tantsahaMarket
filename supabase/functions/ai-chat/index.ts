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
    productType?: 'fresh' | 'processed' | 'export' | 'all';
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
    category: string;
    alternatives: string[];
    seasonality: string;
    available: boolean;
    region?: string;
    unit?: string;
    priceRange?: string;
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
  
  // Intention d'achat
  if (lowerText.includes('commander') || lowerText.includes('acheter') || 
      lowerText.includes('order') || lowerText.includes('mividy') ||
      lowerText.includes('mila') || lowerText.includes('besoin')) {
    return 'purchase_intent';
  }
  
  // Intention de vente
  if (lowerText.includes('vendre') || lowerText.includes('vendeur') || 
      lowerText.includes('seller') || lowerText.includes('mpamokatra') ||
      lowerText.includes('manana') || lowerText.includes('offrir')) {
    return 'seller_inquiry';
  }
  
  // Demande de prix
  if (lowerText.includes('prix') || lowerText.includes('tarif') || 
      lowerText.includes('price') || lowerText.includes('vidiny') ||
      lowerText.includes('combien') || lowerText.includes('coût')) {
    return 'price_inquiry';
  }
  
  // Demande de livraison
  if (lowerText.includes('livraison') || lowerText.includes('delivery') || 
      lowerText.includes('handeha') || lowerText.includes('expédition') ||
      lowerText.includes('transport') || lowerText.includes('livrer')) {
    return 'delivery_inquiry';
  }
  
  // Demande de produit
  if (lowerText.includes('produit') || lowerText.includes('product') || 
      lowerText.includes('vokatra') || lowerText.includes('article') ||
      lowerText.includes('marchandise') || lowerText.includes('denrée')) {
    return 'product_inquiry';
  }
  
  // Disponibilité
  if (lowerText.includes('stock') || lowerText.includes('disponible') || 
      lowerText.includes('available') || lowerText.includes('tsy misy') ||
      lowerText.includes('manana ve') || lowerText.includes('en stock')) {
    return 'availability_inquiry';
  }
  
  // Contact
  if (lowerText.includes('contact') || lowerText.includes('appeler') || 
      lowerText.includes('appel') || lowerText.includes('téléphoner') ||
      lowerText.includes('mifandray') || lowerText.includes('adresse')) {
    return 'contact_request';
  }
  
  // Exportation
  if (lowerText.includes('export') || lowerText.includes('international') || 
      lowerText.includes('étranger') || lowerText.includes('mivoaka') ||
      lowerText.includes('overseas') || lowerText.includes('ship abroad')) {
    return 'export_inquiry';
  }
  
  // Produits frais vs transformés
  if (lowerText.includes('frais') || lowerText.includes('fresh') || 
      lowerText.includes('maitso') || lowerText.includes('cru') ||
      lowerText.includes('transformé') || lowerText.includes('processed') ||
      lowerText.includes('conservé') || lowerText.includes('canned')) {
    return 'product_type_inquiry';
  }
  
  // Basé sur l'historique de la session
  if (session.interests.length > 0 && !session.contactRequested) {
    return 'follow_up_qualification';
  }
  
  return 'general_query';
}

// Base de données complète des produits agricoles malgaches
const ALL_AGRICULTURAL_PRODUCTS = {
  // Céréales et grains
  cereals: [
    { name: 'riz', names: ['riz', 'vary', 'rice'], categories: ['céréale', 'base'] },
    { name: 'maïs', names: ['maïs', 'katsaka', 'corn'], categories: ['céréale', 'fourrage'] },
    { name: 'blé', names: ['blé', 'wheat'], categories: ['céréale'] },
    { name: 'avoine', names: ['avoine', 'oat'], categories: ['céréale', 'fourrage'] },
    { name: 'orge', names: ['orge', 'barley'], categories: ['céréale', 'brasserie'] },
    { name: 'millet', names: ['millet', 'petit mil'], categories: ['céréale'] },
    { name: 'sorgho', names: ['sorgho', 'sorghum'], categories: ['céréale', 'fourrage'] },
    { name: 'quinoa', names: ['quinoa'], categories: ['céréale', 'bio'] },
  ],
  
  // Légumes
  vegetables: [
    { name: 'tomate', names: ['tomate', 'tomato', 'voatabia'], categories: ['légume', 'frais'] },
    { name: 'oignon', names: ['oignon', 'onion', 'tongolo'], categories: ['légume', 'condiment'] },
    { name: 'pomme de terre', names: ['pomme de terre', 'patate', 'potato', 'ovy'], categories: ['légume', 'tubercule'] },
    { name: 'carotte', names: ['carotte', 'carrot', 'karaoty'], categories: ['légume', 'racine'] },
    { name: 'chou', names: ['chou', 'cabbage', 'lasary'], categories: ['légume', 'feuille'] },
    { name: 'laitue', names: ['laitue', 'salade', 'lettuce', 'salady'], categories: ['légume', 'feuille'] },
    { name: 'aubergine', names: ['aubergine', 'eggplant', 'baranjely'], categories: ['légume', 'frais'] },
    { name: 'courgette', names: ['courgette', 'zucchini', 'kôzety'], categories: ['légume'] },
    { name: 'concombre', names: ['concombre', 'cucumber', 'konkombra'], categories: ['légume'] },
    { name: 'poivron', names: ['poivron', 'bell pepper', 'pilipily maitso'], categories: ['légume', 'condiment'] },
    { name: 'piment', names: ['piment', 'chili', 'sakay'], categories: ['légume', 'condiment'] },
    { name: 'haricot vert', names: ['haricot vert', 'green bean', 'tsaramaso maitso'], categories: ['légume', 'légumineuse'] },
    { name: 'petits pois', names: ['petits pois', 'pea', 'tsaramaso kely'], categories: ['légume', 'légumineuse'] },
    { name: 'poireau', names: ['poireau', 'leek'], categories: ['légume'] },
    { name: 'céleri', names: ['céleri', 'celery'], categories: ['légume', 'aromatique'] },
    { name: 'radis', names: ['radis', 'radish'], categories: ['légume', 'racine'] },
    { name: 'betterave', names: ['betterave', 'beetroot', 'betiravy'], categories: ['légume', 'racine'] },
    { name: 'navet', names: ['navet', 'turnip'], categories: ['légume', 'racine'] },
    { name: 'épinard', names: ['épinard', 'spinach', 'épina'], categories: ['légume', 'feuille'] },
    { name: 'brocoli', names: ['brocoli', 'broccoli'], categories: ['légume'] },
    { name: 'chou-fleur', names: ['chou-fleur', 'cauliflower'], categories: ['légume'] },
  ],
  
  // Tubercules et racines
  tubers: [
    { name: 'manioc', names: ['manioc', 'cassava', 'mangahazo'], categories: ['tubercule', 'base'] },
    { name: 'patate douce', names: ['patate douce', 'sweet potato', 'ovim-bazaha'], categories: ['tubercule'] },
    { name: 'igname', names: ['igname', 'yam', 'ovy mahery'], categories: ['tubercule'] },
    { name: 'taro', names: ['taro', 'saonjo'], categories: ['tubercule'] },
    { name: 'gingembre', names: ['gingembre', 'ginger', 'sakamalao'], categories: ['tubercule', 'condiment'] },
    { name: 'curcuma', names: ['curcuma', 'turmeric', 'tamotamo'], categories: ['tubercule', 'condiment'] },
  ],
  
  // Fruits
  fruits: [
    { name: 'banane', names: ['banane', 'banana', 'akondro'], categories: ['fruit', 'tropical'] },
    { name: 'mangue', names: ['mangue', 'mango', 'manga'], categories: ['fruit', 'tropical'] },
    { name: 'litchi', names: ['litchi', 'lychee'], categories: ['fruit', 'tropical', 'export'] },
    { name: 'ananas', names: ['ananas', 'pineapple', 'mananasy'], categories: ['fruit', 'tropical'] },
    { name: 'papaye', names: ['papaye', 'papaya', 'voapaza'], categories: ['fruit', 'tropical'] },
    { name: 'goyave', names: ['goyave', 'guava', 'goavy'], categories: ['fruit'] },
    { name: 'citron', names: ['citron', 'lemon', 'limony'], categories: ['fruit', 'agrume'] },
    { name: 'orange', names: ['orange', 'orange', 'voasary'], categories: ['fruit', 'agrume'] },
    { name: 'pamplemousse', names: ['pamplemousse', 'grapefruit', 'pampla'], categories: ['fruit', 'agrume'] },
    { name: 'mandarine', names: ['mandarine', 'tangerine'], categories: ['fruit', 'agrume'] },
    { name: 'raisin', names: ['raisin', 'grape', 'voaloboka'], categories: ['fruit'] },
    { name: 'avocat', names: ['avocat', 'avocado', 'zavoka'], categories: ['fruit'] },
    { name: 'noix de coco', names: ['noix de coco', 'coconut', 'voaniho'], categories: ['fruit', 'tropical'] },
    { name: 'fruit de la passion', names: ['fruit de la passion', 'passion fruit', 'grenadille'], categories: ['fruit', 'tropical'] },
    { name: 'corossol', names: ['corossol', 'soursop', 'voanantsindrana'], categories: ['fruit'] },
    { name: 'jacquier', names: ['jacquier', 'jackfruit', 'voankazo be'], categories: ['fruit'] },
    { name: 'durian', names: ['durian'], categories: ['fruit'] },
    { name: 'ramboutan', names: ['ramboutan'], categories: ['fruit', 'tropical'] },
    { name: 'longane', names: ['longane'], categories: ['fruit'] },
    { name: 'mûre', names: ['mûre', 'blackberry'], categories: ['fruit', 'baie'] },
    { name: 'framboise', names: ['framboise', 'raspberry'], categories: ['fruit', 'baie'] },
    { name: 'fraise', names: ['fraise', 'strawberry', 'fresy'], categories: ['fruit', 'baie'] },
    { name: 'myrtille', names: ['myrtille', 'blueberry'], categories: ['fruit', 'baie'] },
  ],
  
  // Épices et aromates
  spices: [
    { name: 'vanille', names: ['vanille', 'vanilla'], categories: ['épice', 'export'] },
    { name: 'poivre', names: ['poivre', 'pepper', 'dipoavatra'], categories: ['épice'] },
    { name: 'cannelle', names: ['cannelle', 'cinnamon', 'kanelina'], categories: ['épice'] },
    { name: 'clou de girofle', names: ['clou de girofle', 'clove', 'girofle'], categories: ['épice', 'export'] },
    { name: 'cardamome', names: ['cardamome', 'cardamom'], categories: ['épice'] },
    { name: 'muscade', names: ['muscade', 'nutmeg'], categories: ['épice'] },
    { name: 'curry', names: ['curry'], categories: ['épice', 'mélange'] },
    { name: 'thym', names: ['thym', 'thyme'], categories: ['aromate'] },
    { name: 'romarin', names: ['romarin', 'rosemary'], categories: ['aromate'] },
    { name: 'basilic', names: ['basilic', 'basil', 'bonanitra'], categories: ['aromate'] },
    { name: 'persil', names: ['persil', 'parsley'], categories: ['aromate'] },
    { name: 'coriandre', names: ['coriandre', 'coriander'], categories: ['aromate'] },
    { name: 'menthe', names: ['menthe', 'mint', 'menta'], categories: ['aromate'] },
  ],
  
  // Produits d'exportation
  exports: [
    { name: 'café', names: ['café', 'coffee', 'kafe'], categories: ['boisson', 'export'] },
    { name: 'cacao', names: ['cacao', 'cocoa'], categories: ['export', 'transformation'] },
    { name: 'thé', names: ['thé', 'tea', 'dite'], categories: ['boisson', 'export'] },
    { name: 'poivre noir', names: ['poivre noir', 'black pepper'], categories: ['épice', 'export'] },
    { name: 'poivre blanc', names: ['poivre blanc', 'white pepper'], categories: ['épice', 'export'] },
    { name: 'poivre vert', names: ['poivre vert', 'green pepper'], categories: ['épice', 'export'] },
    { name: 'huile essentielle', names: ['huile essentielle', 'essential oil'], categories: ['export', 'transformation'] },
    { name: 'ylang-ylang', names: ['ylang-ylang', 'ilang-ilang'], categories: ['export', 'parfumerie'] },
    { name: 'vétiver', names: ['vétiver', 'vetiver'], categories: ['export', 'parfumerie'] },
  ],
  
  // Viandes et produits animaux
  meats: [
    { name: 'viande de zébu', names: ['viande de zébu', 'zébu', 'beef', 'hena omby'], categories: ['viande', 'bovin'] },
    { name: 'poulet', names: ['poulet', 'chicken', 'akoho'], categories: ['viande', 'volaille'] },
    { name: 'canard', names: ['canard', 'duck', 'gana'], categories: ['viande', 'volaille'] },
    { name: 'dinde', names: ['dinde', 'turkey'], categories: ['viande', 'volaille'] },
    { name: 'porc', names: ['porc', 'pork', 'hena kisoa'], categories: ['viande', 'porcin'] },
    { name: 'agneau', names: ['agneau', 'lamb', 'zaanimpito'], categories: ['viande', 'ovin'] },
    { name: 'chèvre', names: ['chèvre', 'goat', 'osy'], categories: ['viande', 'caprin'] },
    { name: 'lapin', names: ['lapin', 'rabbit', 'bitro'], categories: ['viande'] },
  ],
  
  // Produits de la mer
  seafood: [
    { name: 'poisson frais', names: ['poisson frais', 'fish', 'trondro maitso'], categories: ['mer', 'frais'] },
    { name: 'crevette', names: ['crevette', 'shrimp', 'crevette'], categories: ['mer', 'crustacé'] },
    { name: 'crabe', names: ['crabe', 'crab'], categories: ['mer', 'crustacé'] },
    { name: 'langouste', names: ['langouste', 'lobster'], categories: ['mer', 'crustacé', 'export'] },
    { name: 'poulpe', names: ['poulpe', 'octopus'], categories: ['mer', 'mollusque'] },
    { name: 'calamar', names: ['calamar', 'squid'], categories: ['mer', 'mollusque'] },
    { name: 'huître', names: ['huître', 'oyster'], categories: ['mer', 'mollusque'] },
    { name: 'moule', names: ['moule', 'mussel'], categories: ['mer', 'mollusque'] },
  ],
  
  // Produits laitiers et œufs
  dairy: [
    { name: 'lait', names: ['lait', 'milk', 'ronono'], categories: ['laitier'] },
    { name: 'fromage', names: ['fromage', 'cheese', 'fromazy'], categories: ['laitier', 'transformation'] },
    { name: 'yaourt', names: ['yaourt', 'yogurt'], categories: ['laitier', 'transformation'] },
    { name: 'beurre', names: ['beurre', 'butter', 'dibera'], categories: ['laitier', 'transformation'] },
    { name: 'crème', names: ['crème', 'cream'], categories: ['laitier', 'transformation'] },
    { name: 'œufs', names: ['œufs', 'eggs', 'atody'], categories: ['animal'] },
  ],
  
  // Légumineuses
  legumes: [
    { name: 'haricot sec', names: ['haricot sec', 'bean', 'tsaramaso maina'], categories: ['légumineuse', 'sec'] },
    { name: 'lentille', names: ['lentille', 'lentil', 'lentille'], categories: ['légumineuse'] },
    { name: 'pois chiche', names: ['pois chiche', 'chickpea'], categories: ['légumineuse'] },
    { name: 'pois cassé', names: ['pois cassé', 'split pea'], categories: ['légumineuse'] },
    { name: 'soja', names: ['soja', 'soybean', 'soja'], categories: ['légumineuse', 'transformation'] },
    { name: 'arachide', names: ['arachide', 'peanut', 'voanjo'], categories: ['légumineuse', 'oléagineux'] },
  ],
  
  // Oléagineux
  oilseeds: [
    { name: 'tournesol', names: ['tournesol', 'sunflower'], categories: ['oléagineux'] },
    { name: 'colza', names: ['colza', 'rapeseed'], categories: ['oléagineux'] },
    { name: 'sésame', names: ['sésame', 'sesame', 'sesame'], categories: ['oléagineux'] },
    { name: 'palmier à huile', names: ['palmier à huile', 'oil palm'], categories: ['oléagineux'] },
  ],
  
  // Produits transformés
  processed: [
    { name: 'confiture', names: ['confiture', 'jam', 'marmelady'], categories: ['transformé', 'fruit'] },
    { name: 'jus de fruit', names: ['jus de fruit', 'fruit juice'], categories: ['transformé', 'boisson'] },
    { name: 'conserves', names: ['conserves', 'canned food', 'konserba'], categories: ['transformé'] },
    { name: 'fruits secs', names: ['fruits secs', 'dried fruits'], categories: ['transformé', 'fruit'] },
    { name: 'légumes surgelés', names: ['légumes surgelés', 'frozen vegetables'], categories: ['transformé'] },
    { name: 'viande séchée', names: ['viande séchée', 'dried meat', 'kitoza'], categories: ['transformé', 'viande'] },
    { name: 'saucisse', names: ['saucisse', 'sausage', 'saucisse'], categories: ['transformé', 'viande'] },
    { name: 'charcuterie', names: ['charcuterie'], categories: ['transformé', 'viande'] },
  ],
  
  // Plantes médicinales
  medicinal: [
    { name: 'ravintsara', names: ['ravintsara'], categories: ['médicinal', 'huile essentielle'] },
    { name: 'niaouli', names: ['niaouli'], categories: ['médicinal', 'huile essentielle'] },
    { name: 'katrafay', names: ['katrafay'], categories: ['médicinal'] },
    { name: 'mandravasarotra', names: ['mandravasarotra'], categories: ['médicinal'] },
    { name: 'voandelaka', names: ['voandelaka'], categories: ['médicinal'] },
  ],
  
  // Fleurs et plantes ornementales
  flowers: [
    { name: 'orchidée', names: ['orchidée', 'orchid'], categories: ['ornemental', 'export'] },
    { name: 'rose', names: ['rose', 'rose'], categories: ['ornemental'] },
    { name: 'lys', names: ['lys', 'lily'], categories: ['ornemental'] },
    { name: 'protea', names: ['protea'], categories: ['ornemental', 'export'] },
    { name: 'gerbera', names: ['gerbera'], categories: ['ornemental'] },
  ]
};

// Extrait les produits mentionnés
function extractMentionedProducts(text: string, session: any): string[] {
  const lowerText = text.toLowerCase();
  const mentioned: string[] = [];
  
  // Parcourir toutes les catégories
  for (const category of Object.values(ALL_AGRICULTURAL_PRODUCTS)) {
    for (const product of category) {
      for (const name of product.names) {
        if (lowerText.includes(name.toLowerCase())) {
          mentioned.push(product.name);
          if (!session.mentionedProducts.includes(product.name)) {
            session.mentionedProducts.push(product.name);
          }
          break;
        }
      }
    }
  }
  
  return mentioned;
}

// Obtenir les détails d'un produit
function getProductDetails(productName: string) {
  for (const category of Object.values(ALL_AGRICULTURAL_PRODUCTS)) {
    for (const product of category) {
      if (product.name === productName || product.names.includes(productName.toLowerCase())) {
        return product;
      }
    }
  }
  return null;
}

// Obtenir les produits par catégorie
function getProductsByCategory(category: string): any[] {
  const products = ALL_AGRICULTURAL_PRODUCTS[category as keyof typeof ALL_AGRICULTURAL_PRODUCTS];
  return products || [];
}

// Obtenir les alternatives de produits
function getProductAlternatives(productName: string): string[] {
  const product = getProductDetails(productName);
  if (!product) return [];
  
  const alternatives: string[] = [];
  const productCategory = Object.entries(ALL_AGRICULTURAL_PRODUCTS)
    .find(([_, products]) => products.some(p => p.name === productName));
  
  if (productCategory) {
    const [categoryName, categoryProducts] = productCategory;
    // Ajouter d'autres produits de la même catégorie
    categoryProducts.forEach(p => {
      if (p.name !== productName) {
        alternatives.push(p.name);
      }
    });
    
    // Ajouter des alternatives par similarité
    switch(categoryName) {
      case 'cereals':
        alternatives.push(...['maïs', 'blé', 'quinoa', 'sorgho']);
        break;
      case 'vegetables':
        alternatives.push(...['carotte', 'chou', 'laitue', 'courgette']);
        break;
      case 'fruits':
        if (productName.includes('mangue')) {
          alternatives.push(...['papaye', 'goyave', 'ananas']);
        } else if (productName.includes('litchi')) {
          alternatives.push(...['ramboutan', 'longane', 'fruit de la passion']);
        }
        break;
      case 'meats':
        if (productName.includes('zébu')) {
          alternatives.push(...['poulet', 'porc', 'agneau']);
        }
        break;
      case 'exports':
        alternatives.push(...['vanille', 'café', 'cacao', 'girofle']);
        break;
    }
  }
  
  return Array.from(new Set(alternatives)).slice(0, 6); // Limiter à 6 alternatives
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
  - Dernière intention : ${session.lastIntent || 'générale'}
  - Préférences : ${JSON.stringify(session.preferences || {})}`;
  
  return JSON.stringify([
    ...systemMessages,
    { role: 'assistant', content: summary },
    ...recentMessages,
  ]);
}

// Produits de saison à Madagascar (mis à jour complet)
const SEASONAL_PRODUCTS: Record<string, {products: string[], category: string}[]> = {
  janvier: [
    {products: ['litchi', 'mangue verte'], category: 'fruits'},
    {products: ['tomate', 'piment', 'aubergine'], category: 'légumes'},
    {products: ['riz', 'manioc'], category: 'céréales'},
    {products: ['vanille (récolte)'], category: 'export'}
  ],
  février: [
    {products: ['litchi', 'mangue', 'avocat'], category: 'fruits'},
    {products: ['haricot vert', 'carotte', 'chou'], category: 'légumes'},
    {products: ['riz (récolte)'], category: 'céréales'}
  ],
  mars: [
    {products: ['mangue', 'ananas', 'banane'], category: 'fruits'},
    {products: ['patate douce', 'igname', 'tomate'], category: 'tubercules'},
    {products: ['café (récolte)'], category: 'export'}
  ],
  avril: [
    {products: ['mangue', 'citron', 'papaye'], category: 'fruits'},
    {products: ['carotte', 'oignon', 'ail'], category: 'légumes'},
    {products: ['maïs'], category: 'céréales'}
  ],
  mai: [
    {products: ['orange', 'mandarine', 'pamplemousse'], category: 'agrumes'},
    {products: ['pomme de terre', 'chou', 'poireau'], category: 'légumes'},
    {products: ['vanille (préparation)'], category: 'export'}
  ],
  juin: [
    {products: ['litchi d\'hiver', 'grenadille', 'kaki'], category: 'fruits'},
    {products: ['ail', 'gingembre', 'curcuma'], category: 'tubercules'},
    {products: ['laitue', 'épinard'], category: 'légumes-feuilles'}
  ],
  juillet: [
    {products: ['grenadille', 'fruit de la passion', 'corossol'], category: 'fruits'},
    {products: ['poireau', 'navet', 'betterave'], category: 'légumes'},
    {products: ['clou de girofle'], category: 'export'}
  ],
  août: [
    {products: ['fraise', 'framboise', 'myrtille'], category: 'petits fruits'},
    {products: ['betterave', 'céleri', 'radis'], category: 'légumes'},
    {products: ['cacao'], category: 'export'}
  ],
  septembre: [
    {products: ['raisin', 'figue', 'prune'], category: 'fruits'},
    {products: ['aubergine', 'courgette', 'poivron'], category: 'légumes'},
    {products: ['thé'], category: 'export'}
  ],
  octobre: [
    {products: ['papaye', 'goyave', 'noix de coco'], category: 'fruits tropicaux'},
    {products: ['maïs', 'poivron', 'concombre'], category: 'légumes'},
    {products: ['girofle', 'vanille', 'poivre'], category: 'épices-export'}
  ],
  novembre: [
    {products: ['mangue précoce', 'pastèque', 'melon'], category: 'fruits'},
    {products: ['concombre', 'salade', 'tomate cerise'], category: 'légumes'},
    {products: ['clou de girofle', 'café', 'cacao'], category: 'export'}
  ],
  décembre: [
    {products: ['litchi', 'mangue', 'ananas'], category: 'fruits'},
    {products: ['tomate cerise', 'herbes aromatiques', 'piment'], category: 'légumes-aromatiques'},
    {products: ['litchi (export)', 'vanille', 'huiles essentielles'], category: 'export'}
  ]
};

// Alternatives de produits (étendu)
const PRODUCT_ALTERNATIVES: Record<string, string[]> = {
  // Céréales
  'riz': ['riz rouge', 'riz blanc', 'riz parfumé', 'riz gluant', 'maïs', 'blé', 'quinoa', 'sorgho'],
  'maïs': ['riz', 'blé', 'sorgho', 'millet'],
  'blé': ['riz', 'maïs', 'avoine', 'orge'],
  
  // Légumes
  'tomate': ['tomate cerise', 'tomate ronde', 'tomate allongée', 'aubergine', 'poivron', 'courgette'],
  'oignon': ['oignon rouge', 'oignon blanc', 'échalote', 'ail', 'poireau'],
  'pomme de terre': ['patate douce', 'igname', 'manioc', 'taro'],
  'carotte': ['betterave', 'navet', 'radis', 'panais'],
  
  // Fruits
  'mangue': ['papaye', 'goyave', 'ananas', 'avocat'],
  'litchi': ['ramboutan', 'longane', 'fruit de la passion', 'grenadille'],
  'banane': ['plantain', 'banane douce', 'banane plantain', 'fruit de la passion'],
  
  // Viandes
  'viande de zébu': ['poulet', 'porc', 'agneau', 'chèvre', 'lapin'],
  'poulet': ['canard', 'dinde', 'pintade', 'viande de zébu'],
  'poisson frais': ['crevette', 'crabe', 'calamar', 'poulpe'],
  
  // Exportations
  'vanille': ['extrait de vanille', 'vanille en gousse', 'vanille bourbon', 'arôme vanille'],
  'café': ['café arabica', 'café robusta', 'café moka', 'café bio'],
  'cacao': ['chocolat', 'poudre de cacao', 'beurre de cacao', 'fèves de cacao'],
  'girofle': ['clou de girofle moulu', 'girofle entier', 'huile de girofle'],
  
  // Légumineuses
  'haricot sec': ['lentille', 'pois chiche', 'soja', 'arachide'],
  'lentille': ['haricot sec', 'pois cassé', 'pois chiche'],
  
  // Produits laitiers
  'lait': ['lait en poudre', 'lait UHT', 'lait frais', 'lait de soja'],
  'fromage': ['fromage frais', 'fromage affiné', 'yaourt', 'fromage blanc'],
};

// Réponses FAQ en cache
const FAQ_RESPONSES = {
  ownership: {
    fr: "Je suis TantsahaBot, l'assistant intelligent de TantsahaMarket. J'ai été créé par l'équipe de TantsahaMarket pour aider les producteurs et acheteurs agricoles à Madagascar. Mon propriétaire est TantsahaMarket, la plateforme leader du commerce agricole malgache. 🚜",
    mg: "Izaho no TantsahaBot, mpanampy manan-tsaina ao amin'ny TantsahaMarket. Noforonin'ny ekipan'ny TantsahaMarket aho hanampy ny mpamokatra sy ny mpividy ara-pambolena eto Madagasikara. Ny tompoko dia TantsahaMarket, sehatra voalohany amin'ny varotra ara-pambolena malagasy. 🌱",
    en: "I am TantsahaBot, the intelligent assistant of TantsahaMarket. I was created by the TantsahaMarket team to help agricultural producers and buyers in Madagascar. My owner is TantsahaMarket, the leading agricultural commerce platform in Madagascar. 🌾"
  },
  contact: {
    fr: "📞 Pour contacter TantsahaMarket :\n• Téléphone : +261 34 11 815 03\n• Email : contact@tantsahamarket.mg\n• Site web : www.tantsahamarket.mg\n• Adresse : Antananarivo, Madagascar\n\nNous sommes disponibles du lundi au vendredi, 8h-17h.",
    mg: "📞 Mifandray amin'ny TantsahaMarket :\n• Telefaonina : +261 34 11 815 03\n• Mailaka : contact@tantsahamarket.mg\n• Tranonkala : www.tantsahamarket.mg\n• Adiresy : Antananarivo, Madagasikara\n\nManoa isan'ny alatsinainy ka hatramin'ny zomà 8h-17h.",
    en: "📞 Contact TantsahaMarket:\n• Phone: +261 34 11 815 03\n• Email: contact@tantsahamarket.mg\n• Website: www.tantsahamarket.mg\n• Address: Antananarivo, Madagascar\n\nWe're available Monday to Friday, 8AM-5PM."
  },
  products: {
    fr: "🎯 **PRODUITS DISPONIBLES SUR TANTSAHAMARKET** 🎯\n\n🌾 **Céréales & Grains** : Riz, maïs, blé, avoine, quinoa\n🥦 **Légumes** : Tomate, oignon, carotte, chou, laitue, aubergine\n🍎 **Fruits** : Mangue, litchi, banane, ananas, papaye, agrumes\n🥩 **Viandes** : Zébu, poulet, porc, agneau, chèvre\n🐟 **Produits de la mer** : Poisson, crevette, crabe, langouste\n🌿 **Épices & Export** : Vanille, café, cacao, girofle, poivre\n🥛 **Produits laitiers** : Lait, fromage, yaourt, beurre\n🥜 **Légumineuses** : Haricots, lentilles, arachides, soja\n🏵️ **Produits spéciaux** : Huiles essentielles, plantes médicinales, fleurs\n\n💡 *Demandez-moi des détails sur un produit spécifique !*",
    mg: "🎯 **VOKATRA HITA AO AMIN'NY TANTSAHAMARKET** 🎯\n\n🌾 **Vary sy voamena** : Vary, katsaka, varimbazaha, avoine, quinoa\n🥦 **Anana** : Voatsabia, tongolo, karaoty, lasary, salady, baranjely\n🍎 **Voankazo** : Manga, litchi, akondro, mananasy, voapaza, voasary\n🥩 **Hena** : Omby, akoho, kisoa, zanimpito, osy\n🐟 **Vokatra an-dranomasina** : Trondro, crevettes, foza, orambato\n🌿 **Zava-manitra sy fanondranana** : Vanila, kafe, kakaô, girofle, dipoavatra\n🥛 **Vokatra ronono** : Ronono, fromazy, yaourt, dibera\n🥜 **Zavamaniry an-tsaha** : Tsaramaso, lentille, voanjo, soja\n🏵️ **Vokatra manokana** : Menaka esansiela, zavamaniry fanafody, voninkazo\n\n💡 *Anontanio ny momba ny vokatra iray manokana!*",
    en: "🎯 **PRODUCTS AVAILABLE ON TANTSAHAMARKET** 🎯\n\n🌾 **Cereals & Grains** : Rice, corn, wheat, oats, quinoa\n🥦 **Vegetables** : Tomato, onion, carrot, cabbage, lettuce, eggplant\n🍎 **Fruits** : Mango, lychee, banana, pineapple, papaya, citrus\n🥩 **Meats** : Zebu, chicken, pork, lamb, goat\n🐟 **Seafood** : Fish, shrimp, crab, lobster\n🌿 **Spices & Exports** : Vanilla, coffee, cocoa, cloves, pepper\n🥛 **Dairy Products** : Milk, cheese, yogurt, butter\n🥜 **Legumes** : Beans, lentils, peanuts, soybeans\n🏵️ **Special Products** : Essential oils, medicinal plants, flowers\n\n💡 *Ask me for details about a specific product!*"
  }
};

// Réponses de fallback
const FALLBACK_RESPONSES = {
  fr: "Je rencontre des difficultés techniques. En attendant, voici quelques produits populaires :\n• Fruits de saison : litchis, mangues\n• Légumes : tomates, carottes\n• Viandes : zébu, poulet\n• Exportations : vanille, café\n\nContact : +261 34 11 815 03",
  mg: "Misy olana tekinika aho. Mandritra izany, ireto vokatra malaza :\n• Voankazo mety : litchis, manga\n• Anana : voatabia, karaoty\n• Hena : omby, akoho\n• Fanondranana : vanila, kafe\n\nFifandraisana : +261 34 11 815 03",
  en: "I'm experiencing technical issues. Meanwhile, here are popular products:\n• Seasonal fruits: litchis, mangoes\n• Vegetables: tomatoes, carrots\n• Meats: zebu, chicken\n• Exports: vanilla, coffee\n\nContact: +261 34 11 815 03"
};

// Structure de réponse
function createStructuredResponse(
  tips: string[], 
  products: Array<{
    name: string;
    category: string;
    alternatives: string[];
    seasonality: string;
    available: boolean;
    region?: string;
    unit?: string;
    priceRange?: string;
  }>,
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
  
  // Demander le type de produit si pertinent
  if (products.some(p => p.category === 'export') && !session.preferences?.productType) {
    followUpQuestions.push(
      language === 'fr' ? "Souhaitez-vous des produits frais ou transformés ?" :
      language === 'mg' ? "Vokatra maitso na efa voaova no tadiavinao ?" :
      "Do you want fresh or processed products?"
    );
  }
  
  return {
    tips,
    suggestedProducts: products,
    nextSteps,
    contactOptions: language === 'fr' ? 
      ["📞 Support : +261 34 11 815 03", "✉️ Email : contact@tantsahamarket.mg", "🌐 Site : www.tantsahamarket.mg"] :
      language === 'mg' ?
      ["📞 Fanohanana : +261 34 11 815 03", "✉️ Mailaka : contact@tantsahamarket.mg", "🌐 Tranonkala : www.tantsahamarket.mg"] :
      ["📞 Support : +261 34 11 815 03", "✉️ Email : contact@tantsahamarket.mg", "🌐 Website : www.tantsahamarket.mg"],
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
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('contact') || lowerQuestion.includes('appel') || lowerQuestion.includes('téléphone')) {
    const response = FAQ_RESPONSES.contact[language];
    faqCache.set(cacheKey, { response, timestamp: now });
    return response;
  }
  
  if (lowerQuestion.includes('produit') || lowerQuestion.includes('vokatra') || lowerQuestion.includes('product') ||
      lowerQuestion.includes('disponible') || lowerQuestion.includes('manana') || lowerQuestion.includes('available') ||
      lowerQuestion.includes('liste') || lowerQuestion.includes('catalogue') || lowerQuestion.includes('tout')) {
    const response = FAQ_RESPONSES.products[language];
    faqCache.set(cacheKey, { response, timestamp: now });
    return response;
  }
  
  return null;
}

// Obtenir les produits de saison
function getSeasonalProducts(month: string) {
  const seasonal = SEASONAL_PRODUCTS[month] || SEASONAL_PRODUCTS.janvier;
  return seasonal.flatMap(group => group.products);
}

// Obtenir les suggestions de produits basées sur l'intention
function getProductSuggestions(intent: string, mentionedProducts: string[], language: 'fr' | 'mg' | 'en') {
  const month = new Date().toLocaleString('fr-FR', { month: 'long' });
  const seasonal = getSeasonalProducts(month);
  
  const suggestions = [];
  
  // Si des produits sont mentionnés, les prioriser
  if (mentionedProducts.length > 0) {
    for (const productName of mentionedProducts.slice(0, 3)) {
      const details = getProductDetails(productName);
      if (details) {
        suggestions.push({
          name: details.name,
          category: details.categories[0] || 'général',
          alternatives: getProductAlternatives(productName).slice(0, 3),
          seasonality: seasonal.includes(productName) ? 'De saison' : 'Hors saison',
          available: true,
          region: 'Madagascar',
          unit: getUnitForProduct(productName),
          priceRange: getPriceRangeForProduct(productName, language)
        });
      }
    }
  }
  
  // Ajouter des suggestions basées sur l'intention
  if (suggestions.length < 3) {
    const intentSuggestions = getIntentBasedSuggestions(intent, language);
    suggestions.push(...intentSuggestions.slice(0, 3 - suggestions.length));
  }
  
  return suggestions;
}

// Obtenir l'unité pour un produit
function getUnitForProduct(productName: string): string {
  const product = productName.toLowerCase();
  
  if (product.includes('riz') || product.includes('maïs') || product.includes('blé') || 
      product.includes('haricot') || product.includes('lentille') || product.includes('arachide')) {
    return 'kg';
  }
  
  if (product.includes('viande') || product.includes('poisson') || product.includes('lait') || 
      product.includes('fromage') || product.includes('beurre')) {
    return 'kg';
  }
  
  if (product.includes('fruit') || product.includes('légume') || product.includes('tomate') || 
      product.includes('oignon') || product.includes('carotte')) {
    return 'kg ou cagette';
  }
  
  if (product.includes('vanille') || product.includes('café') || product.includes('cacao') || 
      product.includes('girofle') || product.includes('poivre')) {
    return 'kg';
  }
  
  if (product.includes('huile') || product.includes('essentielle')) {
    return 'ml ou litre';
  }
  
  return 'unité';
}

// Obtenir la fourchette de prix
function getPriceRangeForProduct(productName: string, language: 'fr' | 'mg' | 'en'): string {
  const product = productName.toLowerCase();
  
  // Prix indicatifs en Ariary malgache (MGA)
  const priceRanges = {
    fr: {
      'riz': '2 000 - 4 000 MGA/kg',
      'maïs': '1 500 - 3 000 MGA/kg',
      'tomate': '1 000 - 3 000 MGA/kg',
      'oignon': '1 500 - 3 500 MGA/kg',
      'pomme de terre': '1 500 - 3 000 MGA/kg',
      'carotte': '2 000 - 4 000 MGA/kg',
      'mangue': '800 - 2 000 MGA/kg',
      'litchi': '3 000 - 6 000 MGA/kg',
      'banane': '500 - 1 500 MGA/kg',
      'viande de zébu': '15 000 - 25 000 MGA/kg',
      'poulet': '8 000 - 15 000 MGA/kg',
      'poisson frais': '5 000 - 15 000 MGA/kg',
      'vanille': '300 000 - 800 000 MGA/kg',
      'café': '10 000 - 30 000 MGA/kg',
      'cacao': '8 000 - 20 000 MGA/kg',
      'girofle': '15 000 - 30 000 MGA/kg',
      'lait': '2 000 - 4 000 MGA/litre',
      'fromage': '10 000 - 25 000 MGA/kg',
      'œufs': '300 - 500 MGA/pièce'
    },
    mg: {
      'riz': '2 000 - 4 000 Ar/kg',
      'maïs': '1 500 - 3 000 Ar/kg',
      'tomate': '1 000 - 3 000 Ar/kg',
      'oignon': '1 500 - 3 500 Ar/kg',
      'pomme de terre': '1 500 - 3 000 Ar/kg',
      'carotte': '2 000 - 4 000 Ar/kg',
      'mangue': '800 - 2 000 Ar/kg',
      'litchi': '3 000 - 6 000 Ar/kg',
      'banane': '500 - 1 500 Ar/kg',
      'viande de zébu': '15 000 - 25 000 Ar/kg',
      'poulet': '8 000 - 15 000 Ar/kg',
      'poisson frais': '5 000 - 15 000 Ar/kg',
      'vanille': '300 000 - 800 000 Ar/kg',
      'café': '10 000 - 30 000 Ar/kg',
      'cacao': '8 000 - 20 000 Ar/kg',
      'girofle': '15 000 - 30 000 Ar/kg',
      'lait': '2 000 - 4 000 Ar/litre',
      'fromage': '10 000 - 25 000 Ar/kg',
      'œufs': '300 - 500 Ar/iraiky'
    },
    en: {
      'riz': '0.5 - 1 USD/kg',
      'maïs': '0.4 - 0.8 USD/kg',
      'tomate': '0.3 - 0.8 USD/kg',
      'oignon': '0.4 - 0.9 USD/kg',
      'pomme de terre': '0.4 - 0.8 USD/kg',
      'carotte': '0.5 - 1 USD/kg',
      'mangue': '0.2 - 0.5 USD/kg',
      'litchi': '0.8 - 1.5 USD/kg',
      'banane': '0.1 - 0.4 USD/kg',
      'viande de zébu': '4 - 6 USD/kg',
      'poulet': '2 - 4 USD/kg',
      'poisson frais': '1.3 - 4 USD/kg',
      'vanille': '80 - 200 USD/kg',
      'café': '2.5 - 7.5 USD/kg',
      'cacao': '2 - 5 USD/kg',
      'girofle': '3.8 - 7.5 USD/kg',
      'lait': '0.5 - 1 USD/litre',
      'fromage': '2.5 - 6 USD/kg',
      'œufs': '0.08 - 0.13 USD/piece'
    }
  };
  
  for (const [key, range] of Object.entries(priceRanges[language])) {
    if (product.includes(key)) {
      return range;
    }
  }
  
  return language === 'fr' ? 'Prix sur demande' :
         language === 'mg' ? 'Vidiny araka ny fangatahana' :
         'Price on request';
}

// Obtenir des suggestions basées sur l'intention
function getIntentBasedSuggestions(intent: string, language: 'fr' | 'mg' | 'en') {
  const month = new Date().toLocaleString('fr-FR', { month: 'long' });
  const seasonal = getSeasonalProducts(month);
  
  switch(intent) {
    case 'purchase_intent':
      return [
        {
          name: seasonal[0] || 'mangue',
          category: 'fruit',
          alternatives: getProductAlternatives(seasonal[0] || 'mangue').slice(0, 3),
          seasonality: 'De saison',
          available: true,
          region: 'Madagascar',
          unit: 'kg',
          priceRange: getPriceRangeForProduct(seasonal[0] || 'mangue', language)
        },
        {
          name: 'riz',
          category: 'céréale',
          alternatives: ['maïs', 'blé', 'quinoa'],
          seasonality: 'Toute l\'année',
          available: true,
          region: 'Madagascar',
          unit: 'kg',
          priceRange: getPriceRangeForProduct('riz', language)
        },
        {
          name: 'viande de zébu',
          category: 'viande',
          alternatives: ['poulet', 'porc', 'agneau'],
          seasonality: 'Toute l\'année',
          available: true,
          region: 'Madagascar',
          unit: 'kg',
          priceRange: getPriceRangeForProduct('viande de zébu', language)
        }
      ];
      
    case 'export_inquiry':
      return [
        {
          name: 'vanille',
          category: 'export',
          alternatives: ['café', 'cacao', 'girofle'],
          seasonality: 'Spécialité',
          available: true,
          region: 'Madagascar',
          unit: 'kg',
          priceRange: getPriceRangeForProduct('vanille', language)
        },
        {
          name: 'litchi',
          category: 'fruit-export',
          alternatives: ['mangue', 'ananas', 'fruit de la passion'],
          seasonality: seasonal.includes('litchi') ? 'De saison' : 'Hors saison',
          available: seasonal.includes('litchi'),
          region: 'Madagascar',
          unit: 'kg',
          priceRange: getPriceRangeForProduct('litchi', language)
        },
        {
          name: 'huile essentielle',
          category: 'export',
          alternatives: ['ylang-ylang', 'vétiver', 'ravintsara'],
          seasonality: 'Toute l\'année',
          available: true,
          region: 'Madagascar',
          unit: 'ml',
          priceRange: language === 'fr' ? 'Prix variable selon qualité' :
                     language === 'mg' ? 'Miovaova arakaraka ny kalitao' :
                     'Variable price depending on quality'
        }
      ];
      
    case 'product_inquiry':
    default:
      return [
        {
          name: seasonal[0] || 'mangue',
          category: 'fruit',
          alternatives: getProductAlternatives(seasonal[0] || 'mangue').slice(0, 3),
          seasonality: 'De saison',
          available: true,
          region: 'Madagascar',
          unit: 'kg',
          priceRange: getPriceRangeForProduct(seasonal[0] || 'mangue', language)
        },
        {
          name: 'tomate',
          category: 'légume',
          alternatives: ['aubergine', 'poivron', 'courgette'],
          seasonality: 'Toute l\'année',
          available: true,
          region: 'Madagascar',
          unit: 'kg',
          priceRange: getPriceRangeForProduct('tomate', language)
        },
        {
          name: 'poulet',
          category: 'volaille',
          alternatives: ['canard', 'dinde', 'viande de zébu'],
          seasonality: 'Toute l\'année',
          available: true,
          region: 'Madagascar',
          unit: 'kg',
          priceRange: getPriceRangeForProduct('poulet', language)
        }
      ];
  }
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
    const seasonalProducts = getSeasonalProducts(month);
    const userRegion = session.preferences?.region || 'non spécifiée';
    
    const systemPrompt = {
      fr: `Tu es TantsahaBot, l'assistant expert de TantsahaMarket, plateforme leader du commerce agricole à Madagascar.

BASE DE DONNÉES COMPLÈTE DES PRODUITS AGRICOLES MALGACHES :
🌾 **CÉRÉALES** : Riz, maïs, blé, avoine, orge, millet, sorgho, quinoa
🥦 **LÉGUMES** : Tomate, oignon, pomme de terre, carotte, chou, laitue, aubergine, courgette, concombre, poivron, piment, haricots, petits pois
🍠 **TUBERCULES** : Manioc, patate douce, igname, taro, gingembre, curcuma
🍎 **FRUITS** : Banane, mangue, litchi, ananas, papaye, goyave, agrumes, raisins, avocat, noix de coco, fruits tropicaux
🌿 **ÉPICES & AROMATES** : Vanille, poivre, cannelle, girofle, cardamome, thym, romarin, basilic, coriandre, menthe
☕ **PRODUITS D'EXPORT** : Café, cacao, thé, vanille, girofle, poivre, huiles essentielles, ylang-ylang
🥩 **VIANDES** : Zébu, poulet, porc, agneau, chèvre, lapin, canard, dinde
🐟 **PRODUITS DE LA MER** : Poisson, crevette, crabe, langouste, poulpe, calamar, huîtres, moules
🥛 **PRODUITS LAITIERS** : Lait, fromage, yaourt, beurre, crème, œufs
🥜 **LÉGUMINEUSES** : Haricots, lentilles, pois chiches, soja, arachides
🌻 **OLÉAGINEUX** : Tournesol, colza, sésame, palmier à huile
🏭 **PRODUITS TRANSFORMÉS** : Confitures, jus, conserves, fruits secs, légumes surgelés, viandes séchées
🌿 **PLANTES MÉDICINALES** : Ravintsara, niaouli, katrafay, mandravasarotra
🏵️ **FLEURS** : Orchidées, roses, lys, protea, gerbera

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
1. CONNAISSANCE PRODUITS : Utiliser la base de données complète ci-dessus
2. QUALIFICATION : Détecter si besoin produit frais/transformé/export
3. PERSONNALISATION : Adapter aux produits de saison et région
4. SUGGESTIONS : Proposer alternatives et compléments

RÈGLES :
- Mentionner catégorie du produit
- Indiquer saisonnalité
- Proposer 2-3 alternatives
- Donner unité de mesure appropriée
- Pour export : mentionner certifications possibles (bio, fair trade)
- Pour viandes : mentionner coupes disponibles
- Pour produits frais : conseils conservation
- Max 1 produit par catégorie dans réponse

OBJECTIF : Guider vers produit le plus adapté parmi toute l'offre agricole malgache.`,

  mg: `Hianao no TantsahaBot, mpanampy manam-pahaizana momba ny TantsahaMarket, sehatra lehibe indrindra amin'ny varotra ara-pambolena eto Madagasikara.

BASE DE DONNÉES FENO AMIN'NY VOKATRA ARA-PAMBOLENA MALAGASY :
🌾 **VARY SY VOAMENA** : Vary, katsaka, varimbazaha, avoine, orge, millet, sorgho, quinoa
🥦 **ANANA** : Voatsabia, tongolo, ovy, karaoty, lasary, salady, baranjely, kôzety, konkombra, pilipily, sakay, tsaramaso, petit pois
🍠 **VOAMBA** : Mangahazo, ovimbazaha, ovy mahery, saonjo, sakamalao, tamotamo
🍎 **VOANKAZO** : Akondro, manga, litchi, mananasy, voapaza, goavy, voasary, voaloboka, zavoka, voaniho, voankazo tropikaly
🌿 **ZAVA-MANITRA** : Vanila, dipoavatra, kanelina, girofle, cardamome, thym, romarin, bonanitra, coriandre, menta
☕ **FANONDRANANA** : Kafe, kakaô, dite, vanila, girofle, dipoavatra, menaka esansiela, ilang-ilang
🥩 **HENA** : Omby, akoho, kisoa, zanimpito, osy, bitro, gana, dinde
🐟 **VOKATRA AN-DRANOMASINA** : Trondro, crevettes, foza, orambato, poulpe, calamar, oyster, mussel
🥛 **VOKATRA RONONO** : Ronono, fromazy, yaourt, dibera, crème, atody
🥜 **ZAVAMANIRY AN-TSAHA** : Tsaramaso, lentille, pois chiche, soja, voanjo
🌻 **VOAMENA MENAKA** : Tournesol, colza, sesame, palmier à huile
🏭 **VOKATRA VOAOVA** : Marmelady, ranom-boankazo, konserba, voankazo maina, anana mangatsiaka, kitoza
🌿 **ZAVAMANIRY FANAFODY** : Ravintsara, niaouli, katrafay, mandravasarotra
🏵️ **VONINKAZO** : Orchidée, rose, lys, protea, gerbera

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

NY ANJARA ASAO :
1. FAMPANDROSOANA : Ampiasao ny base de données feno etsy ambony
2. FANADINANA : Hita ve ilaina vokatra maitso/voaova/fanondranana
3. FANAMARINANA : Ampifanaraho amin'ny vokatra mety sy faritra
4. SOSO-KEVITRA : Atolory safidy sy fanampiny

FEPETRA :
- Lazao sokajin'ny vokatra
- Asongadio ny mety amin'izao fotoana izao
- Atolory safidy 2-3
- Omeo refy mety
- Ho an'ny fanondranana : lazao fijerin-toerana azo atao (bio, fair trade)
- Ho an'ny hena : lazao fizarana azo atao
- Ho an'ny vokatra maitso : toro-hevitra momba ny fitehirizana
- Faribolana vokatra iray isaky ny sokajy ao amin'ny valiny

TANJONA : Toroy ny vokatra mety indrindra amin'ny tanan'ny vokatra ara-pambolena malagasy rehetra.`,

  en: `You are TantsahaBot, the expert assistant of TantsahaMarket, the leading agricultural commerce platform in Madagascar.

COMPLETE DATABASE OF MALAGASY AGRICULTURAL PRODUCTS:
🌾 **CEREALS** : Rice, corn, wheat, oats, barley, millet, sorghum, quinoa
🥦 **VEGETABLES** : Tomato, onion, potato, carrot, cabbage, lettuce, eggplant, zucchini, cucumber, bell pepper, chili, beans, peas
🍠 **TUBERS** : Cassava, sweet potato, yam, taro, ginger, turmeric
🍎 **FRUITS** : Banana, mango, lychee, pineapple, papaya, guava, citrus, grapes, avocado, coconut, tropical fruits
🌿 **SPICES & HERBS** : Vanilla, pepper, cinnamon, cloves, cardamom, thyme, rosemary, basil, coriander, mint
☕ **EXPORT PRODUCTS** : Coffee, cocoa, tea, vanilla, cloves, pepper, essential oils, ylang-ylang
🥩 **MEATS** : Zebu, chicken, pork, lamb, goat, rabbit, duck, turkey
🐟 **SEAFOOD** : Fish, shrimp, crab, lobster, octopus, squid, oysters, mussels
🥛 **DAIRY PRODUCTS** : Milk, cheese, yogurt, butter, cream, eggs
🥜 **LEGUMES** : Beans, lentils, chickpeas, soybeans, peanuts
🌻 **OILSEEDS** : Sunflower, rapeseed, sesame, oil palm
🏭 **PROCESSED PRODUCTS** : Jams, juices, canned goods, dried fruits, frozen vegetables, dried meats
🌿 **MEDICINAL PLANTS** : Ravintsara, niaouli, katrafay, mandravasarotra
🏵️ **FLOWERS** : Orchids, roses, lilies, protea, gerbera

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

YOUR ROLE:
1. PRODUCT KNOWLEDGE: Use the complete database above
2. QUALIFICATION: Detect if need fresh/processed/export product
3. PERSONALIZATION: Adapt to seasonal products and region
4. SUGGESTIONS: Propose alternatives and complements

RULES:
- Mention product category
- Indicate seasonality
- Propose 2-3 alternatives
- Give appropriate unit of measure
- For export: mention possible certifications (organic, fair trade)
- For meats: mention available cuts
- For fresh products: storage advice
- Max 1 product per category in response

GOAL: Guide to the most suitable product among all Malagasy agricultural offerings.`
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