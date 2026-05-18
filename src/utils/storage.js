/**
 * Storage Management Module
 * Handles all localStorage operations for persistent data management
 */

const STORAGE_KEYS = {
    TRADES: 'trading_trades',
    ACCOUNT_BALANCE: 'trading_account_balance',
    STARTING_BALANCE: 'trading_starting_balance',
    ACCOUNT_HISTORY: 'trading_account_history',
    DEPOSITS: 'trading_deposits',
    WITHDRAWALS: 'trading_withdrawals'
};

/**
 * Save trades to localStorage
 */
export function saveTrades(trades) {
    try {
        localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
        return true;
    } catch (error) {
        console.error('Error saving trades:', error);
        return false;
    }
}

/**
 * Get trades from localStorage
 */
export function getTrades() {
    try {
        const trades = localStorage.getItem(STORAGE_KEYS.TRADES);
        return trades ? JSON.parse(trades) : [];
    } catch (error) {
        console.error('Error retrieving trades:', error);
        return [];
    }
}

/**
 * Save account balance to localStorage
 */
export function saveAccountBalance(balance) {
    try {
        localStorage.setItem(STORAGE_KEYS.ACCOUNT_BALANCE, JSON.stringify(balance));
        return true;
    } catch (error) {
        console.error('Error saving account balance:', error);
        return false;
    }
}

/**
 * Get account balance from localStorage
 */
export function getAccountBalance() {
    try {
        const balance = localStorage.getItem(STORAGE_KEYS.ACCOUNT_BALANCE);
        return balance ? JSON.parse(balance) : 0;
    } catch (error) {
        console.error('Error retrieving account balance:', error);
        return 0;
    }
}

/**
 * Save starting balance to localStorage
 */
export function saveStartingBalance(balance) {
    try {
        localStorage.setItem(STORAGE_KEYS.STARTING_BALANCE, JSON.stringify(balance));
        return true;
    } catch (error) {
        console.error('Error saving starting balance:', error);
        return false;
    }
}

/**
 * Get starting balance from localStorage
 */
export function getStartingBalance() {
    try {
        const balance = localStorage.getItem(STORAGE_KEYS.STARTING_BALANCE);
        return balance ? JSON.parse(balance) : 0;
    } catch (error) {
        console.error('Error retrieving starting balance:', error);
        return 0;
    }
}

/**
 * Save account history
 */
export function saveAccountHistory(history) {
    try {
        localStorage.setItem(STORAGE_KEYS.ACCOUNT_HISTORY, JSON.stringify(history));
        return true;
    } catch (error) {
        console.error('Error saving account history:', error);
        return false;
    }
}

/**
 * Get account history
 */
export function getAccountHistory() {
    try {
        const history = localStorage.getItem(STORAGE_KEYS.ACCOUNT_HISTORY);
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('Error retrieving account history:', error);
        return [];
    }
}

/**
 * Save deposits
 */
export function saveDeposits(deposits) {
    try {
        localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits));
        return true;
    } catch (error) {
        console.error('Error saving deposits:', error);
        return false;
    }
}

/**
 * Get deposits
 */
export function getDeposits() {
    try {
        const deposits = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
        return deposits ? JSON.parse(deposits) : [];
    } catch (error) {
        console.error('Error retrieving deposits:', error);
        return [];
    }
}

/**
 * Save withdrawals
 */
export function saveWithdrawals(withdrawals) {
    try {
        localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));
        return true;
    } catch (error) {
        console.error('Error saving withdrawals:', error);
        return false;
    }
}

/**
 * Get withdrawals
 */
export function getWithdrawals() {
    try {
        const withdrawals = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
        return withdrawals ? JSON.parse(withdrawals) : [];
    } catch (error) {
        console.error('Error retrieving withdrawals:', error);
        return [];
    }
}

/**
 * Clear all trading data (for reset functionality)
 */
export function clearAllData() {
    try {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        return true;
    } catch (error) {
        console.error('Error clearing data:', error);
        return false;
    }
}

/**
 * Export all data
 */
export function exportAllData() {
    return {
        trades: getTrades(),
        accountBalance: getAccountBalance(),
        startingBalance: getStartingBalance(),
        accountHistory: getAccountHistory(),
        deposits: getDeposits(),
        withdrawals: getWithdrawals()
    };
}
