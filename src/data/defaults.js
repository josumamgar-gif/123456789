// Fixed monthly expenses — tus datos reales
export const FIXED_EXPENSES_DEFAULT = [
  { id: 'gym', name: 'Gimnasio', amount: 60, category: 'salud', active: true },
  { id: 'movistar', name: 'Movistar+', amount: 10, category: 'suscripciones', active: true },
  { id: 'replit', name: 'Replit', amount: 20, category: 'suscripciones', active: true },
  { id: 'digi', name: 'Digi', amount: 10, category: 'comunicacion', active: true },
]

// Deudas reales
export const DEBTS_DEFAULT = [
  {
    id: 'aplazado1',
    name: 'Aplazado 1',
    totalAmount: 850,
    monthlyQuota: 283,
    months: ['2025-06', '2025-07', '2025-08'],
    type: 'aplazado',
  },
  {
    id: 'aplazado2',
    name: 'Aplazado 2',
    totalAmount: 850,
    monthlyQuota: 283,
    months: ['2025-07', '2025-08', '2025-09'],
    type: 'aplazado',
  },
  {
    id: 'prestamo',
    name: 'Préstamo personal',
    totalAmount: 7000,
    monthlyQuota: 209.8,
    paid: 1466,
    endDate: '2028-09-14',
    type: 'prestamo',
  },
  {
    id: 'seguro_coche',
    name: 'Seguro coche',
    totalAmount: 690,
    monthlyQuota: 230,
    months: ['2025-07', '2025-08', '2025-09'],
    type: 'aplazado',
  },
]

// Cuenta vivienda — datos reales
export const VIVIENDA_DEFAULT = {
  currentAmount: 11300,
  yearlyContributed: 1000,
  yearlyMax: 8500,
  annualReturn: 22,
}

// Cripto — arranca vacío, tú añades
export const CRYPTO_DEFAULT = []

// Categorías de gasto predefinidas
export const CATEGORIES_DEFAULT = [
  { id: 'alimentacion', name: 'Alimentación', icon: '🛒', color: '#3b6ff0' },
  { id: 'gasolina', name: 'Gasolina', icon: '⛽', color: '#1e9e56' },
  { id: 'ropa', name: 'Ropa', icon: '👕', color: '#c9870a' },
  { id: 'salud', name: 'Salud / Óptica', icon: '👁️', color: '#0988b0' },
  { id: 'ocio', name: 'Ocio', icon: '🎮', color: '#7c4dff' },
  { id: 'viajes', name: 'Viajes', icon: '✈️', color: '#dc3535' },
  { id: 'suscripciones', name: 'Suscripciones', icon: '📱', color: '#666' },
  { id: 'comunicacion', name: 'Comunicación', icon: '📡', color: '#0988b0' },
  { id: 'hogar', name: 'Hogar', icon: '🏠', color: '#c96010' },
  { id: 'restaurantes', name: 'Restaurantes', icon: '🍽️', color: '#c9870a' },
  { id: 'otros', name: 'Otros', icon: '📦', color: '#aaa' },
]

// Sorare competitions
export const SORARE_COMPETITIONS = [
  'All-Star', 'Challenger', 'Manager',
  'Champion Europe', 'Champion Americas',
  'Contender', 'Under 23', 'Rookie',
  'Rare Global', 'Super Rare Global', 'Unique Global', 'Limited Global',
  'La Liga', 'Premier League', 'Bundesliga', 'Serie A', 'Ligue 1',
  'MLS', 'Champions League', 'Europa League',
]

export const SORARE_RARITIES = ['limited', 'rare', 'super_rare', 'unique']

export const RARITY_LABELS = {
  limited: 'Limited',
  rare: 'Rare',
  super_rare: 'Super Rare',
  unique: 'Única',
}

export const INCOME_DEFAULT = 2400

export const INVESTMENT_RECS = [
  { symbol: 'BTC', name: 'Bitcoin', reason: 'Reserva de valor, alta liquidez', risk: 'medio' },
  { symbol: 'ETH', name: 'Ethereum', reason: 'Ecosistema DeFi sólido', risk: 'medio' },
  { symbol: 'SOL', name: 'Solana', reason: 'Alta velocidad, bajo coste transacción', risk: 'alto' },
  { symbol: 'USDC', name: 'USDC Staking', reason: 'Estable, yield 4-6% APY', risk: 'bajo' },
  { symbol: 'MSTR', name: 'MicroStrategy', reason: 'Exposición BTC vía bolsa', risk: 'alto' },
]
