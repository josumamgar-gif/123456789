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
  { id: 'metas', name: 'Metas / Ahorro', icon: '🎯', color: '#4a6cf7' },
  { id: 'sorare', name: 'Sorare', icon: '⚽', color: '#7c4dff' },
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

export const SORARE_BALANCES_DEFAULT = { cash: 0, eth: 0 }

export const SORARE_PAYMENT_METHODS = ['cash', 'eth', 'apple_pay']

export const SORARE_PAYMENT_LABELS = {
  cash: 'Cash Sorare',
  eth: 'ETH',
  apple_pay: 'Apple Pay',
}

export const SORARE_RARITIES = ['limited', 'rare', 'super_rare', 'unique']

export const SORARE_EDITIONS = ['classic', 'in_season']

export const EDITION_LABELS = {
  classic: 'Classic',
  in_season: 'In Season',
}

export const EDITION_STYLE = {
  classic: { bg: 'rgba(91,100,120,0.12)', c: 'var(--text2)', border: 'var(--border2)' },
  in_season: { bg: 'rgba(74,108,247,0.12)', c: 'var(--accent)', border: 'var(--accent)' },
}

export const RARITY_LABELS = {
  limited: 'Limited',
  rare: 'Rare',
  super_rare: 'Super Rare',
  unique: 'Única',
}

// Limited=Naranja, Rare=Rojo, Super Rare=Azul, Unique=Morado
export const RARITY_STYLE = {
  limited:    { bg: 'rgba(212,96,10,0.12)',  c: '#d4600a' },
  rare:       { bg: 'rgba(224,61,61,0.12)',  c: '#e03d3d' },
  super_rare: { bg: 'rgba(59,111,240,0.12)', c: '#3b6ff0' },
  unique:     { bg: 'rgba(124,77,255,0.12)', c: '#7c4dff' },
}

export const INVESTMENT_TYPES = [
  { id: 'crypto', label: 'Cripto', icon: '₿' },
  { id: 'stock', label: 'Acciones', icon: '📈' },
  { id: 'fund', label: 'Fondos', icon: '🏦' },
]

export const INVESTMENT_TYPE_LABELS = {
  crypto: 'Cripto',
  stock: 'Acciones',
  fund: 'Fondos',
}

export const INCOME_DEFAULT = 2400

export const TX_PAYMENT_METHODS = ['bank', 'cash']

export const TX_PAYMENT_LABELS = {
  bank: 'Banco',
  cash: 'Efectivo',
}

export const WALLET_MOVE_LABELS = {
  transaction: 'Apunte',
  manual: 'Ajuste manual',
  sorare: 'Sorare',
  balance_set: 'Fijar saldo',
  paycheck: 'Nómina',
  cash_in: 'Efectivo',
}

export const INVESTMENT_RECS = [
  { symbol: 'BTC', name: 'Bitcoin', reason: 'Reserva de valor, alta liquidez', risk: 'medio' },
  { symbol: 'ETH', name: 'Ethereum', reason: 'Ecosistema DeFi sólido', risk: 'medio' },
  { symbol: 'SOL', name: 'Solana', reason: 'Alta velocidad, bajo coste transacción', risk: 'alto' },
  { symbol: 'USDC', name: 'USDC Staking', reason: 'Estable, yield 4-6% APY', risk: 'bajo' },
  { symbol: 'MSTR', name: 'MicroStrategy', reason: 'Exposición BTC vía bolsa', risk: 'alto' },
]
