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

  const addSorareCard = (card) => {
    setSorareCards(prev => [...prev, {
      ...card,
      id: Date.now().toString(),
      purchaseDate: new Date().toISOString(),
      status: 'held',
    }])
  }

  const updateSorareCard = (id, updates) => {
    setSorareCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteSorareCard = (id) => {
    setSorareCards(prev => prev.filter(c => c.id !== id))
  }

  const addSorarePrize = (prize) => {
    setSorarePrizes(prev => [...prev, { ...prize, id: Date.now().toString(), date: new Date().toISOString() }])
  }

  const adjustSorareBalance = ({ wallet, amount, type = 'deposit', note = '' }) => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0 || !['cash', 'eth'].includes(wallet)) return false
    const delta = type === 'withdraw' ? -amt : amt
    setSorareBalances(prev => {
      const current = prev?.[wallet] ?? 0
      const next = Math.max(0, current + delta)
      return { cash: prev?.cash ?? 0, eth: prev?.eth ?? 0, [wallet]: next }
    })
    setSorareBalanceMoves(prev => [...prev, {
      id: Date.now().toString(),
      wallet,
      amount: amt,
      type,
      note,
      date: new Date().toISOString(),
    }])
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
      sorareCards, addSorareCard, updateSorareCard, deleteSorareCard,
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
