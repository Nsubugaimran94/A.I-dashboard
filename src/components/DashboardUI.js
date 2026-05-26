/**
 * Dashboard UI Components Manager
 * Manages all dashboard UI elements
 */

import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters.js';

export class DashboardUI {
    /**
     * Render stat cards grid
     */
    static renderStatCards(stats) {
        const container = document.getElementById('stats-grid');
        if (!container) return;

        const cards = [
            {
                label: 'Current Balance',
                value: formatCurrency(stats.currentBalance),
                change: stats.percentageGain,
                icon: '💰'
            },
            {
                label: 'Total P&L',
                value: formatCurrency(stats.totalPL),
                change: stats.percentageGain,
                icon: '📊'
            },
            {
                label: 'Win Rate',
                value: formatPercentage(stats.winRate),
                change: null,
                icon: '🎯'
            },
            {
                label: 'Profit Factor',
                value: stats.profitFactor.toFixed(2),
                change: null,
                icon: '📈'
            }
        ];

        container.innerHTML = cards.map(card => `
            <div class="glass-card stat-card-premium">
                <div style="font-size: 1.5rem; margin-bottom: var(--spacing-md);">${card.icon}</div>
                <div class="stat-card-premium__label">${card.label}</div>
                <div class="stat-card-premium__value">${card.value}</div>
                ${card.change !== null ? `
                    <div class="stat-card-premium__change ${card.change >= 0 ? 'positive' : 'negative'}">
                        ${card.change >= 0 ? '📈' : '📉'} ${formatPercentage(card.change)}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    /**
     * Render trade history table
     */
    static renderTradeHistory(trades) {
        const container = document.getElementById('trade-history-container');
        if (!container) return;

        if (trades.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No trades yet. Add your first trade!</p>';
            return;
        }

        const sortedTrades = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = `
            <table class="trade-history">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Pair</th>
                        <th>P&L</th>
                        <th>Analysis</th>
                        <th>Note</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedTrades.map(trade => {
                        // Use profit_loss if available, fall back to result
                        const pnl = trade.profit_loss !== undefined ? trade.profit_loss : trade.result;
                        return `
                        <tr>
                            <td>${formatDate(trade.date)}</td>
                            <td><strong>${trade.pair.toUpperCase()}</strong></td>
                            <td class="${pnl >= 0 ? 'positive' : 'negative'}">
                                ${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}
                            </td>
                            <td>${trade.analysis}</td>
                            <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${trade.note || '-'}
                            </td>
                            <td>
                                <button class="btn-premium secondary btn-delete" data-id="${trade.id}" style="padding: var(--spacing-sm) var(--spacing-md); font-size: 0.75rem;">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    `;
                    }).join('')}
                </tbody>
            </table>
        `;

        // Add delete handlers
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (window.tradeManager) {
                    const id = parseInt(e.target.dataset.id);
                    if (confirm('Delete this trade?')) {
                        window.tradeManager.deleteTrade(id);
                    }
                }
            });
        });
    }

    /**
     * Render best/worst trades
     */
    static renderBestWorstTrades(stats) {
        const container = document.getElementById('best-worst-container');
        if (!container) return;

        // Get actual P&L values from stats
        const bestPnl = stats.bestTrade?.profit_loss !== undefined ? stats.bestTrade.profit_loss : (stats.bestTrade?.result || 0);
        const worstPnl = stats.worstTrade?.profit_loss !== undefined ? stats.worstTrade.profit_loss : (stats.worstTrade?.result || 0);

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
                <div class="glass-card">
                    <div class="stat-card-premium__label">Best Trade</div>
                    <div class="stat-card-premium__value" style="color: var(--success);">
                        +${formatCurrency(Math.abs(bestPnl))}
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: var(--spacing-md);">
                        ${stats.bestTrade?.pair || 'N/A'}
                    </div>
                </div>
                <div class="glass-card">
                    <div class="stat-card-premium__label">Worst Trade</div>
                    <div class="stat-card-premium__value" style="color: var(--danger);">
                        ${formatCurrency(worstPnl)}
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: var(--spacing-md);">
                        ${stats.worstTrade?.pair || 'N/A'}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render filter buttons
     */
    static renderFilterButtons() {
        const container = document.getElementById('filter-buttons-container');
        if (!container) return;

        const filters = [
            { label: '1 Day', value: 'day', days: 1 },
            { label: '1 Week', value: 'week', days: 7 },
            { label: '1 Month', value: 'month', days: 30 },
            { label: 'All Time', value: 'all', days: Infinity }
        ];

        container.innerHTML = `
            <div class="filter-buttons">
                ${filters.map(filter => `
                    <button class="filter-btn-premium ${filter.value === 'all' ? 'active' : ''}" data-filter="${filter.value}" data-days="${filter.days}">
                        ${filter.label}
                    </button>
                `).join('')}
            </div>
        `;

        // Add filter handlers
        container.querySelectorAll('.filter-btn-premium').forEach(btn => {
            btn.addEventListener('click', (e) => {
                container.querySelectorAll('.filter-btn-premium').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                if (window.filterCallback) {
                    const days = parseInt(e.target.dataset.days);
                    window.filterCallback(days);
                }
            });
        });
    }

    /**
     * Render account controls
     */
    static renderAccountControls() {
        const container = document.getElementById('account-controls-container');
        if (!container) return;

        container.innerHTML = `
            <div class="glass-card">
                <h3 style="margin-bottom: var(--spacing-lg); color: var(--primary);">Account Management</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                    <input type="number" id="deposit-amount" class="form-group-premium" placeholder="Deposit Amount" style="padding: var(--spacing-md); background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: var(--radius-md); color: var(--text);" />
                    <button class="btn-premium success" id="btn-deposit">Add Deposit</button>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
                    <input type="number" id="withdrawal-amount" class="form-group-premium" placeholder="Withdrawal Amount" style="padding: var(--spacing-md); background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: var(--radius-md); color: var(--text);" />
                    <button class="btn-premium danger" id="btn-withdrawal">Add Withdrawal</button>
                </div>
            </div>
        `;

        // Add handlers
        document.getElementById('btn-deposit')?.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('deposit-amount').value);
            if (amount > 0 && window.tradeManager) {
                window.tradeManager.addDeposit(amount);
                document.getElementById('deposit-amount').value = '';
            }
        });

        document.getElementById('btn-withdrawal')?.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('withdrawal-amount').value);
            if (amount > 0 && window.tradeManager) {
                window.tradeManager.addWithdrawal(amount);
                document.getElementById('withdrawal-amount').value = '';
            }
        });
    }

    /**
     * Render loading state
     */
    static renderLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: var(--spacing-xl); color: var(--text-secondary);">Loading...</div>';
        }
    }

    /**
     * Render empty state
     */
    static renderEmpty(containerId, message = 'No data available') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div style="text-align: center; padding: var(--spacing-xl); color: var(--text-secondary);">${message}</div>`;
        }
    }
}

export default DashboardUI;
