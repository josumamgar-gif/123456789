import React, { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  FIXED_EXPENSES_DEFAULT,
  DEBTS_DEFAULT,
  VIVIENDA_DEFAULT,
  CRYPTO_DEFAULT,
  CATEGORIES_DEFAULT,
  INCOME_DEFAULT,
} from '../data/defaults'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [income, setIncome] = useLocalStorage('income', INCOME_DEFAULT)
  const [fixedExpenses, setFixedExpenses] = useLocalStorage('fixedExpenses', FIXED_EXPENSES_DEFAULT)
  const [debts, setDebts] = useLocalStorage('debts', DEBTS_DEFAULT)
  const [vivienda, setVivienda] = useLocalStorage('vivienda', VIVIENDA_DEFAULT)
  const [crypto, setCrypto] = useLocalStorage('crypto', CRYPTO_DEFAULT)
  const [categories, setCategories] = useLocalStorage('categories', CATEGORIES_DEFAULT)
  const [transactions, setTransactions] = useLocalStorage('transactions', [])
  const [extraIncome, setExtraIncome] = useLocalStorage('extraIncome', [])
  const [goals, setGoals] = useLocalStorage('goals', [])
  const [sorareCards, setSorareCards] = useLocalStorage('sorareCards', [])
  const [sorarePrizes, setSorarePrizes] = useLocalStorage('sorarePrizes', [])
  const [sorareCompetitions, setSorareCompetitions] = useLocalStorage('sorareCompetitions', [])
  const [sorareBalances, setSorareBalances] = useLocalStorage('sorareBalances', { cash: 0, eth: 0 })
  const [sorareBalanceMoves, setSorareBalanceMoves] = useLocalStorage('sorareBalanceMoves', [])
  const [cryptoPrices, setCryptoPrices] = useLocalStorage('cryptoPrices', {})

  // Computed: total monthly obligations
  const getCurrentMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  const getMonthlyObligations = () => {
    const month = getCurrentMonth()
    let total = 0

    // Fixed expenses
    fixedExpenses.filter(e => e.active).forEach(e => total += e.amount)

    // Debt quotas active this month
    debts.forEach(d => {
      if (d.type === 'aplazado') {
        if (d.months && d.months.includes(month)) total += d.monthlyQuota
      } else if (d.type === 'prestamo') {
        total += d.monthlyQuota
      }
    })

    return total
  }

  const getMonthlyTransactions = (year, month) => {
    return transactions.filter(t => {
      const d = new Date(t.date)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })
  }

  const getMonthlySpend = (year, month) => {
    return getMonthlyTransactions(year, month)
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const addTransaction = (tx) => {
    setTransactions(prev => [{ ...tx, id: Date.now().toString() }, ...prev])
  }

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const addGoal = (goal) => {
    setGoals(prev => [...prev, { ...goal, id: Date.now().toString(), savedAmount: 0 }])
  }

  const updateGoal = (id, updates) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
  }

  const deleteGoal = (id) => {
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const newMoveId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const applyWalletDelta = (wallet, delta) => {
    if (!['cash', 'eth'].includes(wallet)) return
    setSorareBalances(prev => ({
      cash: prev?.cash ?? 0,
      eth: prev?.eth ?? 0,
      [wallet]: Math.max(0, (prev?.[wallet] ?? 0) + delta),
    }))
  }

  const recordSorareMove = (move) => {
    setSorareBalanceMoves(prev => [...prev, {
      id: newMoveId(),
      date: new Date().toISOString(),
      category: 'manual',
      ...move,
    }])
  }

  const reverseCardPurchase = (card) => {
    if (!card?.paymentMethod || card.paymentMethod === 'apple_pay') return
    const price = parseFloat(card.buyPrice) || 0
    if (card.paymentMethod === 'cash' && price > 0) {
      applyWalletDelta('cash', price)
    }
    if (card.paymentMethod === 'eth') {
      const eth = parseFloat(card.buyEthAmount) || 0
      if (eth > 0) applyWalletDelta('eth', eth)
    }
  }

  const addSorareCard = (card) => {
    const id = Date.now().toString()
    const price = parseFloat(card.buyPrice) || 0
    const ethSpent = parseFloat(card.buyEthAmount) || 0
    const { paymentMethod, player } = card

    if (paymentMethod === 'cash' && price > 0) {
      applyWalletDelta('cash', -price)
      recordSorareMove({
        category: 'card_buy',
        type: 'withdraw',
        wallet: 'cash',
        amount: price,
        paymentMethod: 'cash',
        cardId: id,
        player,
        note: `Compra: ${player}`,
      })
    } else if (paymentMethod === 'eth' && ethSpent > 0) {
      applyWalletDelta('eth', -ethSpent)
      recordSorareMove({
        category: 'card_buy',
        type: 'withdraw',
        wallet: 'eth',
        amount: ethSpent,
        paymentMethod: 'eth',
        cardId: id,
        player,
        note: `Compra ETH: ${player}${price ? ` (${price}€)` : ''}`,
      })
    } else if (paymentMethod === 'apple_pay' && price > 0) {
      recordSorareMove({
        category: 'card_buy',
        type: 'withdraw',
        wallet: 'apple_pay',
        amount: price,
        paymentMethod: 'apple_pay',
        cardId: id,
        player,
        note: `Apple Pay: ${player}`,
      })
    }

    setSorareCards(prev => [...prev, {
      ...card,
      id,
      purchaseDate: new Date().toISOString(),
      status: 'held',
    }])
  }

  const updateSorareCard = (id, updates) => {
    setSorareCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const sellSorareCard = (id, sellPrice, creditToCash = true) => {
    const price = parseFloat(sellPrice) || 0
    const card = sorareCards.find(c => c.id === id)
    updateSorareCard(id, {
      status: 'sold',
      sellPrice: price,
      sellDate: new Date().toISOString(),
    })
    if (creditToCash && price > 0) {
      applyWalletDelta('cash', price)
      recordSorareMove({
        category: 'card_sell',
        type: 'deposit',
        wallet: 'cash',
        amount: price,
        cardId: id,
        player: card?.player,
        note: `Venta: ${card?.player || 'Carta'}`,
      })
    }
  }

  const deleteSorareCard = (id) => {
    const card = sorareCards.find(c => c.id === id)
    if (card) reverseCardPurchase(card)
    setSorareCards(prev => prev.filter(c => c.id !== id))
  }

  const addSorarePrize = (prize) => {
    const eth = parseFloat(prize.ethAmount) || 0
    if (eth > 0) {
      applyWalletDelta('eth', eth)
      recordSorareMove({
        category: 'prize',
        type: 'deposit',
        wallet: 'eth',
        amount: eth,
        note: prize.description || 'Premio liga',
      })
    }
    setSorarePrizes(prev => [...prev, { ...prize, id: Date.now().toString(), date: new Date().toISOString() }])
  }

  const adjustSorareBalance = ({ wallet, amount, type = 'deposit', note = '' }) => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0 || !['cash', 'eth'].includes(wallet)) return false
    const delta = type === 'withdraw' ? -amt : amt
    applyWalletDelta(wallet, delta)
    recordSorareMove({
      category: 'manual',
      wallet,
      amount: amt,
      type,
      note,
    })
    return true
  }

  return (
    <AppContext.Provider value={{
      income, setIncome,
      fixedExpenses, setFixedExpenses,
      debts, setDebts,
      vivienda, setVivienda,
      crypto, setCrypto,
      categories, setCategories,
      transactions, addTransaction, deleteTransaction,
      extraIncome, setExtraIncome,
      goals, addGoal, updateGoal, deleteGoal,
      sorareCards, addSorareCard, updateSorareCard, sellSorareCard, deleteSorareCard,
      sorarePrizes, addSorarePrize, setSorarePrizes,
      sorareCompetitions, setSorareCompetitions,
      sorareBalances, setSorareBalances,
      sorareBalanceMoves,
      adjustSorareBalance,
      cryptoPrices, setCryptoPrices,
      getCurrentMonth,
      getMonthlyObligations,
      getMonthlyTransactions,
      getMonthlySpend,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
