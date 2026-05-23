/**
 * Trade Management Hook
 * Manages all trade-related state and operations
 */

import {
    getTrades,
    saveTrades,
    getStartingBalance,
    saveStartingBalance,
    getDeposits,
    saveDeposits,
    getWithdrawals,
    saveWithdrawals,
    getAccountHistory,
    saveAccountHistory
} from '../utils/storage.js';

import {
    calculateCurrentEquity,
    generateEquityCurveData,
    getTradeStatistics
} from '../utils/calculations.js';

class TradeManager {
    constructor() {
        this.trades = getTrades();
        this.startingBalance = getStartingBalance() || 0;
        this.deposits = getDeposits();
        this.withdrawals = getWithdrawals();
        this.accountHistory = getAccountHistory();
        this.listeners = [];
    }

    /**
     * Subscribe to changes
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Notify all listeners
     */
    notify() {
        this.listeners.forEach(listener => listener(this.getState()));
    }

    /**
     * Add a new trade
     */
    addTrade(trade) {
        const newTrade = {
            id: Date.now(),
            ...trade,
            timestamp: new Date().toISOString()
        };
        
        this.trades.push(newTrade);
        this.updateAccountHistory();
        this.saveTrades();
        this.notify();
        
        return newTrade;
    }

    /**
     * Delete a trade
     */
    deleteTrade(id) {
        this.trades = this.trades.filter(t => t.id !== id);
        this.updateAccountHistory();
        this.saveTrades();
        this.notify();
    }

    /**
     * Update a trade
     */
    updateTrade(id, updates) {
        const trade = this.trades.find(t => t.id === id);
        if (trade) {
            Object.assign(trade, updates);
            this.updateAccountHistory();
            this.saveTrades();
            this.notify();
        }
    }

    /**
     * Add a deposit
     */
    addDeposit(amount, date = new Date().toISOString().split('T')[0]) {
        const deposit = {
            id: Date.now(),
            amount,
            date,
            timestamp: new Date().toISOString()
        };
        
        this.deposits.push(deposit);
        this.updateAccountHistory();
        this.saveDeposits();
        this.notify();
        
        return deposit;
    }

    /**
     * Add a withdrawal
     */
    addWithdrawal(amount, date = new Date().toISOString().split('T')[0]) {
        const withdrawal = {
            id: Date.now(),
            amount,
            date,
            timestamp: new Date().toISOString()
        };
        
        this.withdrawals.push(withdrawal);
        this.updateAccountHistory();
        this.saveWithdrawals();
        this.notify();
        
        return withdrawal;
    }

    /**
     * Set starting balance
     */
    setStartingBalance(balance) {
        this.startingBalance = balance;
        this.updateAccountHistory();
        this.saveStartingBalance();
        this.notify();
    }

    /**
     * Update account history
     */
    updateAccountHistory() {
        const equityData = generateEquityCurveData(
            this.trades,
            this.startingBalance,
            this.deposits,
            this.withdrawals
        );
        this.accountHistory = equityData;
        this.saveAccountHistory();
    }

    /**
     * Save all data
     */
    saveTrades() {
        saveTrades(this.trades);
    }

    saveDeposits() {
        saveDeposits(this.deposits);
    }

    saveWithdrawals() {
        saveWithdrawals(this.withdrawals);
    }

    saveStartingBalance() {
        saveStartingBalance(this.startingBalance);
    }

    saveAccountHistory() {
        saveAccountHistory(this.accountHistory);
    }

    /**
     * Get current state
     */
    getState() {
        const currentBalance = calculateCurrentEquity(
            this.trades,
            this.startingBalance,
            this.deposits,
            this.withdrawals
        );

        const stats = getTradeStatistics(this.trades, this.startingBalance);

        return {
            trades: this.trades,
            startingBalance: this.startingBalance,
            currentBalance,
            deposits: this.deposits,
            withdrawals: this.withdrawals,
            accountHistory: this.accountHistory,
            statistics: stats
        };
    }

    /**
     * Get trades by date range
     */
    getTradesByDateRange(startDate, endDate) {
        return this.trades.filter(trade => {
            const tradeDate = new Date(trade.date);
            return tradeDate >= startDate && tradeDate <= endDate;
        });
    }

    /**
     * Export data
     */
    exportData() {
        return this.getState();
    }

    /**
     * Clear all data
     */
    clearAllData() {
        this.trades = [];
        this.startingBalance = 10000;
        this.deposits = [];
        this.withdrawals = [];
        this.accountHistory = [];
        
        this.saveTrades();
        this.saveDeposits();
        this.saveWithdrawals();
        this.saveStartingBalance();
        this.saveAccountHistory();
        
        this.notify();
    }
}

// Export singleton instance
export const tradeManager = new TradeManager();
