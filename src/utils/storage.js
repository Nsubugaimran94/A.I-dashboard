/**
 * Storage Management Module - SUPABASE ONLY
 * No localStorage - everything goes to Supabase
 * This module keeps data in memory until it's persisted to Supabase
 */

let inMemoryTrades = [];
let inMemoryDeposits = [];
let inMemoryWithdrawals = [];
let inMemoryStartingBalance = 10000;
let inMemoryAccountHistory = [];

/**
 * Save trades (memory only - Supabase handled separately)
 */
export function saveTrades(trades) {
    inMemoryTrades = trades;
    return true;
}

/**
 * Get trades from memory
 */
export function getTrades() {
    return inMemoryTrades;
}

/**
 * Save account balance (memory only)
 */
export function saveAccountBalance(balance) {
    return true;
}

/**
 * Get account balance from memory
 */
export function getAccountBalance() {
    return 0;
}

/**
 * Save starting balance (memory only)
 */
export function saveStartingBalance(balance) {
    inMemoryStartingBalance = balance;
    return true;
}

/**
 * Get starting balance from memory
 */
export function getStartingBalance() {
    return inMemoryStartingBalance;
}

/**
 * Save account history (memory only)
 */
export function saveAccountHistory(history) {
    inMemoryAccountHistory = history;
    return true;
}

/**
 * Get account history from memory
 */
export function getAccountHistory() {
    return inMemoryAccountHistory;
}

/**
 * Save deposits (memory only - Supabase handled separately)
 */
export function saveDeposits(deposits) {
    inMemoryDeposits = deposits;
    return true;
}

/**
 * Get deposits from memory
 */
export function getDeposits() {
    return inMemoryDeposits;
}

/**
 * Save withdrawals (memory only - Supabase handled separately)
 */
export function saveWithdrawals(withdrawals) {
    inMemoryWithdrawals = withdrawals;
    return true;
}

/**
 * Get withdrawals from memory
 */
export function getWithdrawals() {
    return inMemoryWithdrawals;
}

/**
 * Clear all data from memory
 */
export function clearAllData() {
    inMemoryTrades = [];
    inMemoryDeposits = [];
    inMemoryWithdrawals = [];
    inMemoryStartingBalance = 10000;
    inMemoryAccountHistory = [];
    return true;
}

/**
 * Export all data
 */
export function exportAllData() {
    return {
        trades: inMemoryTrades,
        accountBalance: 0,
        startingBalance: inMemoryStartingBalance,
        accountHistory: inMemoryAccountHistory,
        deposits: inMemoryDeposits,
        withdrawals: inMemoryWithdrawals
    };
}
