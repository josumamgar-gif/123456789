import React, { createContext, useContext, useEffect } from 'react'
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
const ACCOUNTING_VERSION = 2

const monthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`

const chargeDateFor = (year, month, dueDay) => {
  const day = Math.min(Math.max(1, dueDay || 1), new Date(year, month, 0).getDate())
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const isChargeDue = (dueDay, refDate = new Date()) => refDate.getDate() >= (dueDay || 1)

export function AppProvider({ children }) {
  const [income, setIncome] = useLocalStorage('income', INCOME_DEFAULT)
  const [fixedExpenses, setFixedExpenses] = useLocalStorage('fixedExpenses', FIXED_EXPENSES_DEFAULT)
  const [debts, setDebts] = useLocalStorage('debts', DEBTS_DEFAULT)
  const [vivienda, setVivienda] = useLocalStorage('vivienda', VIVIENDA_DEFAULT)
  const [crypto, setCrypto] = useLocalStorage('crypto', CRYPTO_DEFAULT)
  const [investments, setInvestments] = useLocalStorage('investments', null)
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
  const [bankBalance, setBankBalance] = useLocalStorage('bankBalance', 0)
  const [cashOnHand, setCashOnHand] = useLocalStorage('cashOnHand', 0)
  const [paycheckMonth, setPaycheckMonth] = useLocalStorage('paycheckMonth', null)
  const [bankBalanceMoves, setBankBalanceMoves] = useLocalStorage('bankBalanceMoves', [])
  const [cashBalanceMoves, setCashBalanceMoves] = useLocalStorage('cashBalanceMoves', [])
  const [monthlyHistory, setMonthlyHistory] = useLocalStorage('monthlyHistory', [])
  const [activeMonthKey, setActiveMonthKey] = useLocalStorage('activeMonthKey', null)
  const [accountingConfig, setAccountingConfig] = useLocalStorage('accountingConfig', { version: 0 })
  const [autoChargesDismissed, setAutoChargesDismissed] = useLocalStorage('autoChargesDismissed', [])

  const newMoveId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const clearMonthTracking = () => {
    setTransactions([])
    setBankBalanceMoves([])
    setCashBalanceMoves([])
  }

  const resetWalletsToZero = () => {
    setBankBalance(0)
    setCashOnHand(0)
    setPaycheckMonth(null)
  }

  const buildMonthSnapshot = (year, month) => {
    const monthTx = transactions.filter(t => {
      const d = new Date(t.date)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })
    const expenses = monthTx.filter(t => t.type === 'expense')
    const incomes = monthTx.filter(t => t.type === 'income')
    const byCategory = {}
    expenses.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
    })
    return {
      id: monthKey(year, month),
      year,
      month,
      totalExpenses: expenses.reduce((s, t) => s + t.amount, 0),
      totalIncome: incomes.reduce((s, t) => s + t.amount, 0),
      expenseCount: expenses.length,
      byCategory,
      bankBalanceEnd: bankBalance,
      cashOnHandEnd: cashOnHand,
      totalLiquidEnd: (bankBalance ?? 0) + (cashOnHand ?? 0), // snapshot al cerrar
      closedAt: new Date().toISOString(),
    }
  }

  const closeMonth = (year, month) => {
    const snapshot = buildMonthSnapshot(year, month)
    setMonthlyHistory(prev => [...prev.filter(s => s.id !== snapshot.id), snapshot].sort((a, b) => b.id.localeCompare(a.id)))
    clearMonthTracking()
    resetWalletsToZero()
    const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
    setActiveMonthKey(monthKey(nextMonth.year, nextMonth.month))
    return snapshot
  }

  const startFreshMonth = () => {
    clearMonthTracking()
    resetWalletsToZero()
    const now = new Date()
    setActiveMonthKey(monthKey(now.getFullYear(), now.getMonth() + 1))
  }

  const getMonthExpenseTotal = (year, month) => {
    const key = monthKey(year, month)
    const snap = monthlyHistory.find(s => s.id === key)
    if (snap) return snap.totalExpenses
    return transactions
      .filter(t => {
        const d = new Date(t.date)
        return d.getFullYear() === year && d.getMonth() + 1 === month && t.type === 'expense'
      })
      .reduce((s, t) => s + t.amount, 0)
  }

  useEffect(() => {
    if (accountingConfig.version >= ACCOUNTING_VERSION) return
    const prev = accountingConfig.version
    if (prev < 1) {
      startFreshMonth()
    } else {
      if (bankBalance === null) setBankBalance(0)
      if (cashOnHand === null) setCashOnHand(0)
      if (prev < 2) {
        clearMonthTracking()
        resetWalletsToZero()
      }
    }
    setAccountingConfig({
      version: ACCOUNTING_VERSION,
      startedAt: accountingConfig.startedAt || new Date().toISOString(),
    })
  }, [])

  useEffect(() => {
    if (categories.some(c => c.id === 'sorare')) return
    setCategories(prev => [...prev, { id: 'sorare', name: 'Sorare', icon: '⚽', color: '#7c4dff' }])
  }, [])

  useEffect(() => {
    if (investments !== null) return
    setInvestments((crypto || []).map(c => ({ ...c, type: c.type || 'crypto', active: c.active !== false })))
  }, [investments, crypto, setInvestments])

  const getWalletBalance = (wallet) => {
    const val = wallet === 'cash' ? cashOnHand : bankBalance
    return val ?? 0
  }

  const setWalletBalance = (wallet, value) => {
    if (wallet === 'cash') setCashOnHand(value)
    else setBankBalance(value)
  }

  const applyWalletBalanceDelta = (wallet, delta) => {
    if (!delta) return
    if (wallet === 'cash') {
      setCashOnHand(prev => (prev ?? 0) + delta)
    } else {
      setBankBalance(prev => (prev ?? 0) + delta)
    }
  }

  const recordWalletMove = (wallet, move) => {
    const entry = {
      id: move.id || newMoveId(),
      date: move.date || new Date().toISOString(),
      category: 'manual',
      ...move,
    }
    if (wallet === 'cash') setCashBalanceMoves(prev => [...prev, entry])
    else setBankBalanceMoves(prev => [...prev, entry])
    return entry.id
  }

  const removeWalletMoveById = (wallet, moveId) => {
    if (wallet === 'cash') setCashBalanceMoves(prev => prev.filter(m => m.id !== moveId))
    else setBankBalanceMoves(prev => prev.filter(m => m.id !== moveId))
  }

  const findWalletMove = (wallet, moveId) => {
    const list = wallet === 'cash' ? cashBalanceMoves : bankBalanceMoves
    return list.find(m => m.id === moveId)
  }

  const transactionBalanceEffect = (tx) => {
    if (!tx || tx.amount == null) return 0
    return tx.type === 'expense' ? -tx.amount : tx.amount
  }

  const getTxWallet = (tx) => tx?.paymentMethod || 'bank'

  const applyTransactionToWallet = (tx, { moveId, transactionId } = {}) => {
    const wallet = getTxWallet(tx)
    const effect = transactionBalanceEffect(tx)
    if (!effect) return null

    applyWalletBalanceDelta(wallet, effect)
    return recordWalletMove(wallet, {
      id: moveId,
      type: effect > 0 ? 'deposit' : 'withdraw',
      amount: Math.abs(effect),
      category: 'transaction',
      note: tx.description,
      transactionId: transactionId || tx.id,
    })
  }

  const removeTransactionMoves = (txId) => {
    ;['bank', 'cash'].forEach(wallet => {
      const list = wallet === 'cash' ? cashBalanceMoves : bankBalanceMoves
      list.filter(m => m.transactionId === txId).forEach(move => {
        const reverse = move.type === 'deposit' ? -move.amount : move.amount
        applyWalletBalanceDelta(wallet, reverse)
        removeWalletMoveById(wallet, move.id)
      })
    })
  }

  const setWalletBalanceExact = (wallet, amount, note = 'Fijar saldo') => {
    const val = parseFloat(amount)
    if (isNaN(val)) return false
    const old = getWalletBalance(wallet) ?? 0
    setWalletBalance(wallet, val)
    const delta = val - old
    if (delta !== 0) {
      recordWalletMove(wallet, {
        category: 'balance_set',
        type: delta > 0 ? 'deposit' : 'withdraw',
        amount: Math.abs(delta),
        note,
      })
    }
    return true
  }

  const adjustWalletBalance = (wallet, { amount, type = 'deposit', note = '', category = 'manual' }) => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return false
    const delta = type === 'withdraw' ? -amt : amt
    applyWalletBalanceDelta(wallet, delta)
    recordWalletMove(wallet, {
      category,
      type,
      amount: amt,
      note: note || (type === 'deposit' ? 'Entrada manual' : 'Salida manual'),
    })
    return true
  }

  const receivePaycheck = (confirmDuplicate = false) => {
    const amt = parseFloat(income)
    if (!amt || amt <= 0) return false
    const month = getCurrentMonth()
    if (paycheckMonth === month && !confirmDuplicate) return 'duplicate'
    if (!adjustWalletBalance('bank', { amount: amt, type: 'deposit', note: 'Nómina', category: 'paycheck' })) return false
    setPaycheckMonth(month)
    return true
  }

  const addCashDeposit = (amount) => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return false
    return adjustWalletBalance('cash', { amount: amt, type: 'deposit', note: 'Efectivo', category: 'cash_in' })
  }

  const deleteWalletMove = (wallet, moveId) => {
    const move = findWalletMove(wallet, moveId)
    if (!move) return false

    const reverse = move.type === 'deposit' ? -move.amount : move.amount
    applyWalletBalanceDelta(wallet, reverse)
    removeWalletMoveById(wallet, moveId)

    if (move.category === 'paycheck') setPaycheckMonth(null)
    if (move.transactionId) {
      const tx = transactions.find(t => t.id === move.transactionId)
      if (tx) {
        if (tx.autoSource?.type === 'fixed' || tx.autoSource?.type === 'debt') {
          dismissAutoCharge(tx.autoSource.type, tx.autoSource.id)
        }
        syncGoalFromTransactionDelete(tx)
      }
      setTransactions(prev => prev.filter(t => t.id !== move.transactionId))
    }
    return true
  }

  const recordSorareBankMove = (move) => {
    recordWalletMove('bank', { category: 'sorare', ...move })
  }

  // Computed: total monthly obligations
  const getCurrentMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  const dismissAutoCharge = (type, id) => {
    const key = `${getCurrentMonth()}:${type}:${id}`
    setAutoChargesDismissed(prev => (prev.includes(key) ? prev : [...prev, key]))
  }

  const isAutoChargeDismissed = (type, id) =>
    autoChargesDismissed.includes(`${getCurrentMonth()}:${type}:${id}`)

  const isDebtActiveInMonth = (debt, month) => {
    if (debt.type === 'prestamo') return (debt.paid || 0) < (debt.totalAmount || 0)
    if (debt.type === 'aplazado') return debt.months?.includes(month)
    return false
  }

  const getDueFixedExpenses = (refDate = new Date()) =>
    fixedExpenses.filter(e => e.active && isChargeDue(e.dueDay, refDate))

  const getDueDebts = (refDate = new Date()) => {
    const month = monthKey(refDate.getFullYear(), refDate.getMonth() + 1)
    return debts.filter(d => isDebtActiveInMonth(d, month) && isChargeDue(d.dueDay, refDate))
  }

  const getMonthlyObligations = (refDate = new Date()) => {
    let total = 0
    getDueFixedExpenses(refDate).forEach(e => { total += e.amount })
    getDueDebts(refDate).forEach(d => { total += d.monthlyQuota })
    return total
  }

  const hasAutoChargeThisMonth = (type, id, txList = transactions) => {
    if (isAutoChargeDismissed(type, id)) return true
    const prefix = getCurrentMonth()
    return txList.some(t =>
      t.autoSource?.type === type &&
      t.autoSource?.id === id &&
      t.date?.startsWith(prefix)
    )
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

  const addTransaction = (tx, { skipWalletApply = false } = {}) => {
    const id = tx.id || newMoveId()
    const amount = parseFloat(tx.amount)
    if (isNaN(amount) || amount <= 0) return false
    const paymentMethod = tx.paymentMethod || 'bank'
    const saved = {
      ...tx,
      id,
      amount,
      paymentMethod,
      category: tx.type === 'expense' ? tx.category : '',
    }
    if (!skipWalletApply) applyTransactionToWallet(saved, { transactionId: id })
    setTransactions(prev => [saved, ...prev])
    return true
  }

  const syncGoalFromTransactionDelete = (tx) => {
    if (tx?.autoSource?.type !== 'goal') return
    const goalId = tx.autoSource.id
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g
      const saved = g.savedAmount || 0
      if (tx.type === 'expense') return { ...g, savedAmount: Math.max(0, saved - tx.amount) }
      if (tx.type === 'income') return { ...g, savedAmount: Math.max(0, saved + tx.amount) }
      return g
    }))
  }

  const syncGoalFromTransactionUpdate = (oldTx, merged) => {
    if (oldTx?.autoSource?.type !== 'goal') return
    const goalId = oldTx.autoSource.id
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g
      let saved = g.savedAmount || 0
      if (oldTx.type === 'expense') saved -= oldTx.amount
      else if (oldTx.type === 'income') saved += oldTx.amount
      if (merged.type === 'expense') saved += merged.amount
      else if (merged.type === 'income') saved -= merged.amount
      return { ...g, savedAmount: Math.max(0, saved) }
    }))
  }

  const updateTransaction = (id, updates) => {
    const tx = transactions.find(t => t.id === id)
    if (!tx) return

    removeTransactionMoves(id)

    const merged = {
      ...tx,
      ...updates,
      amount: updates.amount != null ? parseFloat(updates.amount) : tx.amount,
      paymentMethod: updates.paymentMethod || tx.paymentMethod || 'bank',
      category: (updates.type ?? tx.type) === 'expense'
        ? (updates.category ?? tx.category)
        : '',
    }

    if (isNaN(merged.amount) || merged.amount <= 0) return

    syncGoalFromTransactionUpdate(tx, merged)
    applyTransactionToWallet(merged, { transactionId: id })
    setTransactions(prev => prev.map(t => t.id === id ? merged : t))
  }

  const deleteTransaction = (id, { skipMoveCleanup = false } = {}) => {
    const tx = transactions.find(t => t.id === id)
    if (tx) {
      if (tx.autoSource?.type === 'fixed' || tx.autoSource?.type === 'debt') {
        dismissAutoCharge(tx.autoSource.type, tx.autoSource.id)
      }
      syncGoalFromTransactionDelete(tx)
    }
    if (!skipMoveCleanup) removeTransactionMoves(id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const processAutoCharges = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    getDueFixedExpenses(now).forEach(e => {
      if (hasAutoChargeThisMonth('fixed', e.id)) return
      addTransaction({
        type: 'expense',
        amount: e.amount,
        description: e.name,
        category: e.category,
        date: chargeDateFor(year, month, e.dueDay),
        paymentMethod: e.paymentMethod || 'bank',
        autoSource: { type: 'fixed', id: e.id },
      })
    })

    getDueDebts(now).forEach(d => {
      if (hasAutoChargeThisMonth('debt', d.id)) return
      addTransaction({
        type: 'expense',
        amount: d.monthlyQuota,
        description: d.name,
        category: 'otros',
        date: chargeDateFor(year, month, d.dueDay),
        paymentMethod: d.paymentMethod || 'bank',
        autoSource: { type: 'debt', id: d.id },
      })
    })
  }

  useEffect(() => {
    processAutoCharges()
  }, [fixedExpenses, debts])

  const addGoal = (goal) => {
    const id = newMoveId()
    const initial = parseFloat(goal.initialSavings) || 0
    const { initialSavings, initialPaymentMethod, ...rest } = goal
    const newGoal = { ...rest, id, savedAmount: 0 }
    setGoals(prev => [...prev, newGoal])
    if (initial > 0) {
      addGoalSavings({ goalId: id, goal: newGoal, amount: initial, mode: 'add', paymentMethod: initialPaymentMethod || 'bank' })
    }
    return id
  }

  const updateGoal = (id, updates) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
  }

  const addGoalSavings = ({ goalId, goal: goalSnapshot, amount, mode = 'add', paymentMethod = 'bank' }) => {
    const goal = goalSnapshot || goals.find(g => g.id === goalId)
    if (!goal) return false

    const val = parseFloat(amount)
    if (isNaN(val)) return false

    const prevSaved = goal.savedAmount || 0
    let delta = 0
    let newSaved = prevSaved

    if (mode === 'add') {
      if (val <= 0) return false
      delta = val
      newSaved = prevSaved + val
    } else {
      if (val < 0) return false
      newSaved = val
      delta = val - prevSaved
    }

    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, savedAmount: newSaved } : g))

    const today = new Date().toISOString().split('T')[0]
    const desc = `Meta: ${goal.icon || '🎯'} ${goal.name}`

    if (delta > 0) {
      addTransaction({
        type: 'expense',
        amount: delta,
        description: desc,
        category: 'metas',
        date: today,
        paymentMethod,
        autoSource: { type: 'goal', id: goalId },
      })
    } else if (delta < 0) {
      addTransaction({
        type: 'income',
        amount: Math.abs(delta),
        description: `Ajuste ${desc}`,
        date: today,
        paymentMethod,
        autoSource: { type: 'goal', id: goalId },
      })
    }

    return true
  }

  const deleteGoal = (id) => {
    transactions
      .filter(t => t.autoSource?.type === 'goal' && t.autoSource.id === id)
      .forEach(t => deleteTransaction(t.id))
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const applySorareWalletDelta = (wallet, delta) => {
    if (!['cash', 'eth'].includes(wallet)) return
    setSorareBalances(prev => ({
      cash: prev?.cash ?? 0,
      eth: prev?.eth ?? 0,
      [wallet]: Math.max(0, (prev?.[wallet] ?? 0) + delta),
    }))
  }

  const getSorareTransactions = () =>
    transactions.filter(t => t.category === 'sorare' || t.autoSource?.type === 'sorare')

  const linkSorareGasto = ({ txType, amount, description, paymentMethod = 'bank', refId, skipWalletApply = false }) => {
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    addTransaction({
      type: txType,
      amount: val,
      description,
      category: 'sorare',
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      autoSource: { type: 'sorare', id: refId },
    }, { skipWalletApply })
  }

  const recordSorareMove = (move) => {
    setSorareBalanceMoves(prev => [...prev, {
      date: new Date().toISOString(),
      category: 'manual',
      ...move,
      id: move.id || newMoveId(),
    }])
  }

  const reverseCardPurchase = (card) => {
    if (!card?.paymentMethod) return
    const price = parseFloat(card.buyPrice) || 0
    if (card.paymentMethod === 'apple_pay' && price > 0) {
      applyWalletBalanceDelta('bank', price)
      const bankMove = bankBalanceMoves.find(m => m.cardId === card.id && m.category === 'sorare')
      if (bankMove) removeWalletMoveById('bank', bankMove.id)
      return
    }
    if (card.paymentMethod === 'cash' && price > 0) {
      applySorareWalletDelta('cash', price)
    }
    if (card.paymentMethod === 'eth') {
      const eth = parseFloat(card.buyEthAmount) || 0
      if (eth > 0) applySorareWalletDelta('eth', eth)
    }
  }

  const revertSorareSale = (id) => {
    const card = sorareCards.find(c => c.id === id)
    if (!card || card.status !== 'sold') return
    const price = parseFloat(card.sellPrice) || 0
    if (price > 0) {
      applySorareWalletDelta('cash', -price)
      setSorareBalanceMoves(prev => prev.filter(m => !(m.cardId === id && m.category === 'card_sell')))
    }
    updateSorareCard(id, { status: 'held', sellPrice: null, sellDate: null })
  }

  const updateSorareSellPrice = (id, newPrice) => {
    const card = sorareCards.find(c => c.id === id)
    if (!card || card.status !== 'sold') return false
    const oldPrice = parseFloat(card.sellPrice) || 0
    const price = parseFloat(newPrice) || 0
    if (price < 0) return false
    const delta = price - oldPrice
    if (delta !== 0) applySorareWalletDelta('cash', delta)
    updateSorareCard(id, { sellPrice: price })
    return true
  }

  const updateSorarePrize = (id, updates) => {
    const prize = sorarePrizes.find(p => p.id === id)
    if (!prize) return false
    const oldEth = parseFloat(prize.ethAmount) || 0
    const newEth = updates.ethAmount != null ? parseFloat(updates.ethAmount) : oldEth
    if (isNaN(newEth) || newEth < 0) return false
    const delta = newEth - oldEth
    if (delta !== 0) applySorareWalletDelta('eth', delta)
    setSorarePrizes(prev => prev.map(p => p.id === id ? { ...p, ...updates, ethAmount: newEth } : p))
    return true
  }

  const deleteSorarePrize = (id) => {
    const prize = sorarePrizes.find(p => p.id === id)
    if (prize) {
      const eth = parseFloat(prize.ethAmount) || 0
      if (eth > 0) applySorareWalletDelta('eth', -eth)
      setSorareBalanceMoves(prev => prev.filter(m => m.prizeId !== id))
    }
    setSorarePrizes(prev => prev.filter(p => p.id !== id))
  }

  const addSorareCard = (card) => {
    const id = newMoveId()
    const price = parseFloat(card.buyPrice) || 0
    const ethSpent = parseFloat(card.buyEthAmount) || 0
    const { paymentMethod, player } = card

    if (paymentMethod === 'cash' && price > 0) {
      applySorareWalletDelta('cash', -price)
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
      applySorareWalletDelta('eth', -ethSpent)
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
      applyWalletBalanceDelta('bank', -price)
      recordSorareBankMove({
        type: 'withdraw',
        amount: price,
        cardId: id,
        player,
        note: `Apple Pay: ${player}`,
      })
      linkSorareGasto({
        txType: 'expense',
        amount: price,
        description: `Sorare · ${player}`,
        paymentMethod: 'bank',
        refId: id,
        skipWalletApply: true,
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
      applySorareWalletDelta('cash', price)
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
    const id = newMoveId()
    const eth = parseFloat(prize.ethAmount) || 0
    if (eth > 0) {
      applySorareWalletDelta('eth', eth)
      recordSorareMove({
        category: 'prize',
        type: 'deposit',
        wallet: 'eth',
        amount: eth,
        prizeId: id,
        note: prize.description || 'Premio liga',
      })
    }
    setSorarePrizes(prev => [...prev, { ...prize, id, date: new Date().toISOString() }])
  }

  const adjustSorareBalance = ({ wallet, amount, type = 'deposit', note = '', linkToGastos = true }) => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0 || !['cash', 'eth'].includes(wallet)) return false
    const delta = type === 'withdraw' ? -amt : amt
    const moveId = newMoveId()
    applySorareWalletDelta(wallet, delta)
    recordSorareMove({
      id: moveId,
      category: 'manual',
      wallet,
      amount: amt,
      type,
      note: note || (type === 'deposit' ? 'Inyección' : 'Retirada'),
    })
    if (linkToGastos && wallet === 'cash') {
      linkSorareGasto({
        txType: type === 'deposit' ? 'expense' : 'income',
        amount: amt,
        description: note || (type === 'deposit' ? 'Inyección Sorare' : 'Retirada Sorare'),
        paymentMethod: 'bank',
        refId: moveId,
      })
    }
    return true
  }

  return (
    <AppContext.Provider value={{
      income, setIncome,
      fixedExpenses, setFixedExpenses,
      debts, setDebts,
      vivienda, setVivienda,
      crypto, setCrypto,
      investments, setInvestments,
      categories, setCategories,
      transactions, addTransaction, updateTransaction, deleteTransaction,
      bankBalance, cashOnHand,
      bankBalanceMoves, cashBalanceMoves,
      setWalletBalanceExact, adjustWalletBalance, deleteWalletMove,
      receivePaycheck, addCashDeposit, paycheckMonth,
      extraIncome, setExtraIncome,
      goals, addGoal, updateGoal, addGoalSavings, deleteGoal,
      sorareCards, addSorareCard, updateSorareCard, sellSorareCard, revertSorareSale, updateSorareSellPrice, deleteSorareCard,
      sorarePrizes, addSorarePrize, updateSorarePrize, deleteSorarePrize, setSorarePrizes,
      sorareCompetitions, setSorareCompetitions,
      sorareBalances, setSorareBalances,
      sorareBalanceMoves,
      adjustSorareBalance,
      getSorareTransactions,
      cryptoPrices, setCryptoPrices,
      getCurrentMonth,
      getMonthlyObligations,
      getDueFixedExpenses,
      getDueDebts,
      getMonthlyTransactions,
      getMonthlySpend,
      processAutoCharges,
      monthlyHistory, activeMonthKey,
      closeMonth, startFreshMonth, getMonthExpenseTotal, buildMonthSnapshot,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
