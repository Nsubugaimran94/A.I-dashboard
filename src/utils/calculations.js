/**
 * Calculations Module
 * Handles all trading calculations and statistics
 */

/**
 * Calculate current equity/balance
 */
export function calculateCurrentEquity(trades, startingBalance, deposits, withdrawals) {
    const tradesPL = trades.reduce((sum, trade) => sum + (trade.result || 0), 0);
    const totalDeposits = deposits.reduce((sum, dep) => sum + (dep.amount || 0), 0);
    const totalWithdrawals = withdrawals.reduce((sum, wd) => sum + (wd.amount || 0), 0);
    
    return startingBalance + tradesPL + totalDeposits - totalWithdrawals;
}

/**
 * Calculate total profit/loss
 */
export function calculateTotalPL(trades) {
    return trades.reduce((sum, trade) => sum + (trade.result || 0), 0);
}

/**
 * Calculate win rate percentage
 */
export function calculateWinRate(trades) {
    if (trades.length === 0) return 0;
    const wins = trades.filter(t => t.result > 0).length;
    return (wins / trades.length) * 100;
}

/**
 * Calculate best trade
 */
export function calculateBestTrade(trades) {
    if (trades.length === 0) return { result: 0, pair: 'N/A', date: null };
    const best = trades.reduce((max, trade) => 
        trade.result > max.result ? trade : max
    );
    return best;
}

/**
 * Calculate worst trade
 */
export function calculateWorstTrade(trades) {
    if (trades.length === 0) return { result: 0, pair: 'N/A', date: null };
    const worst = trades.reduce((min, trade) => 
        trade.result < min.result ? trade : min
    );
    return worst;
}

/**
 * Calculate percentage gain/loss
 */
export function calculatePercentageGain(currentBalance, startingBalance) {
    if (startingBalance === 0) return 0;
    return ((currentBalance - startingBalance) / Math.abs(startingBalance)) * 100;
}

/**
 * Calculate average trade
 */
export function calculateAverageTrade(trades) {
    if (trades.length === 0) return 0;
    const totalPL = trades.reduce((sum, trade) => sum + (trade.result || 0), 0);
    return totalPL / trades.length;
}

/**
 * Calculate profit factor
 */
export function calculateProfitFactor(trades) {
    const wins = trades
        .filter(t => t.result > 0)
        .reduce((sum, t) => sum + t.result, 0);
    
    const losses = Math.abs(trades
        .filter(t => t.result < 0)
        .reduce((sum, t) => sum + t.result, 0));
    
    if (losses === 0) return wins > 0 ? Infinity : 0;
    return wins / losses;
}

/**
 * Calculate drawdown
 */
export function calculateDrawdown(equityHistory) {
    if (equityHistory.length === 0) return 0;
    
    let maxBalance = equityHistory[0];
    let maxDrawdown = 0;
    
    for (let i = 1; i < equityHistory.length; i++) {
        const currentBalance = equityHistory[i];
        if (currentBalance > maxBalance) {
            maxBalance = currentBalance;
        }
        const drawdown = ((maxBalance - currentBalance) / maxBalance) * 100;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    }
    
    return maxDrawdown;
}

/**
 * Generate equity curve data
 */
export function generateEquityCurveData(trades, startingBalance, deposits, withdrawals) {
    let balance = startingBalance;
    const equityData = [{ date: new Date().toISOString().split('T')[0], balance, trades: 0 }];
    
    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedTrades.forEach((trade, index) => {
        balance += trade.result;
        equityData.push({
            date: trade.date,
            balance,
            trades: index + 1,
            tradeResult: trade.result,
            pair: trade.pair
        });
    });
    
    // Add deposits and withdrawals
    const allEvents = [
        ...deposits.map(d => ({ ...d, type: 'deposit', date: d.date })),
        ...withdrawals.map(w => ({ ...w, type: 'withdrawal', date: w.date }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    allEvents.forEach(event => {
        if (event.type === 'deposit') {
            balance += event.amount;
        } else {
            balance -= event.amount;
        }
    });
    
    return equityData;
}

/**
 * Get daily summary
 */
export function getDailySummary(trades) {
    const summary = {};
    
    trades.forEach(trade => {
        const date = trade.date;
        if (!summary[date]) {
            summary[date] = { trades: 0, pnl: 0, wins: 0, losses: 0 };
        }
        summary[date].trades += 1;
        summary[date].pnl += trade.result;
        if (trade.result > 0) {
            summary[date].wins += 1;
        } else if (trade.result < 0) {
            summary[date].losses += 1;
        }
    });
    
    return summary;
}

/**
 * Filter trades by date range
 */
export function filterTradesByDateRange(trades, startDate, endDate) {
    return trades.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate >= startDate && tradeDate <= endDate;
    });
}

/**
 * Get statistics for a trade set
 */
export function getTradeStatistics(trades, startingBalance) {
    const totalPL = calculateTotalPL(trades);
    const currentBalance = startingBalance + totalPL;
    
    return {
        totalTrades: trades.length,
        winRate: calculateWinRate(trades),
        bestTrade: calculateBestTrade(trades),
        worstTrade: calculateWorstTrade(trades),
        averageTrade: calculateAverageTrade(trades),
        profitFactor: calculateProfitFactor(trades),
        totalPL,
        currentBalance,
        percentageGain: calculatePercentageGain(currentBalance, startingBalance)
    };
}
