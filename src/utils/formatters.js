/**
 * Formatters Module
 * Handles all data formatting and display logic
 */

/**
 * Format currency
 */
export function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 2) {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Format date
 */
export function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format date and time
 */
export function formatDateTime(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format trade result with color indicator
 */
export function formatTradeResult(result) {
    const sign = result >= 0 ? '+' : '';
    const color = result >= 0 ? 'green' : 'red';
    return {
        text: `${sign}${formatCurrency(result)}`,
        color,
        value: result
    };
}

/**
 * Format large numbers with K, M, B suffix
 */
export function formatLargeNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
}

/**
 * Get color based on value
 */
export function getColorByValue(value, threshold = 0) {
    if (value > threshold) return '#10b981'; // green
    if (value < threshold) return '#ef4444'; // red
    return '#94a3b8'; // neutral
}

/**
 * Format status badge
 */
export function getStatusBadge(value) {
    if (value > 0) {
        return { text: 'Profit 📈', class: 'badge-success' };
    }
    if (value < 0) {
        return { text: 'Loss 📉', class: 'badge-danger' };
    }
    return { text: 'Break Even', class: 'badge-neutral' };
}

/**
 * Format time since
 */
export function formatTimeSince(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return formatDate(date);
}

/**
 * Format decimal places
 */
export function formatDecimal(value, places = 2) {
    return Number(value).toFixed(places);
}

/**
 * Abbreviate pair name
 */
export function abbreviatePair(pair) {
    if (!pair) return 'N/A';
    return pair.slice(0, 6).toUpperCase();
}

/**
 * Format trade summary
 */
export function formatTradeSummary(trade) {
    return {
        pair: abbreviatePair(trade.pair),
        result: formatCurrency(trade.result),
        date: formatDate(trade.date),
        color: getColorByValue(trade.result),
        status: getStatusBadge(trade.result)
    };
}

/**
 * Format statistics for display
 */
export function formatStatistics(stats) {
    return {
        totalTrades: stats.totalTrades,
        winRate: formatPercentage(stats.winRate),
        bestTrade: formatCurrency(stats.bestTrade?.result || 0),
        worstTrade: formatCurrency(stats.worstTrade?.result || 0),
        averageTrade: formatCurrency(stats.averageTrade),
        profitFactor: stats.profitFactor.toFixed(2),
        totalPL: formatCurrency(stats.totalPL),
        currentBalance: formatCurrency(stats.currentBalance),
        percentageGain: formatPercentage(stats.percentageGain)
    };
}
