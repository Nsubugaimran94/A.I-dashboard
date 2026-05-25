/**
 * Professional Equity Tracking Dashboard
 * Main Application Module
 */

import { tradeManager } from './hooks/useTrades.js';
import { EquityCurveChart } from './components/EquityCurveChart.js';
import { DashboardUI } from './components/DashboardUI.js';
import { filterTradesByDateRange, getTradeStatistics } from './utils/calculations.js';

class TradingDashboardApp {
    constructor() {
        this.equityChart = null;
        this.currentFilter = 'all';
        this.supabaseClient = window.supabaseClient || null;
        this.userId = localStorage.getItem('userId');
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        console.log('🚀 Initializing Professional Equity Tracking Dashboard...');
        
        this.setupEventListeners();
        this.subscribeToUpdates();
        this.updateHeaderBalance();
        this.render();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Trade form submission
        const tradeForm = document.getElementById('trade-form-premium');
        if (tradeForm) {
            tradeForm.addEventListener('submit', (e) => this.handleAddTrade(e));
        }

        // Account controls
        DashboardUI.renderAccountControls();

        // Filter buttons
        DashboardUI.renderFilterButtons();

        // Set global filter callback
        window.filterCallback = (days) => this.handleFilterChange(days);

        // Set global trade manager
        window.tradeManager = tradeManager;
    }

    /**
     * Subscribe to trade manager updates
     */
    subscribeToUpdates() {
        tradeManager.subscribe((state) => {
            // Header balance already updated by script.js updateAccountSize()
            this.render();
        });
    }

    /**
     * Handle add trade form submission
     */
    handleAddTrade(e) {
        e.preventDefault();

        const pair = document.getElementById('input-pair')?.value;
        const result = parseFloat(document.getElementById('input-result')?.value);
        const date = document.getElementById('input-date')?.value || new Date().toISOString().split('T')[0];
        const analysis = document.getElementById('input-analysis')?.value;
        const note = document.getElementById('input-note')?.value;

        if (!pair || !result || !analysis) {
            alert('Please fill in all required fields');
            return;
        }

        const trade = tradeManager.addTrade({
            pair: pair.toUpperCase(),
            result,
            date,
            analysis,
            note: note || ''
        });

        // Save to Supabase
        this.saveTradeToSupabase(trade);

        // Clear form
        document.getElementById('input-pair').value = '';
        document.getElementById('input-result').value = '';
        document.getElementById('input-note').value = '';
        document.getElementById('input-analysis').value = '';
        document.getElementById('input-date').value = new Date().toISOString().split('T')[0];
    }

    /**
     * Save trade to Supabase
     */
    async saveTradeToSupabase(trade) {
        if (!this.supabaseClient || !this.userId) {
            console.log('⚠️ Supabase not available, trade saved to localStorage only');
            return;
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('trades')
                .insert([
                    {
                        user_id: this.userId,
                        pair: trade.pair,
                        result: trade.result,
                        analysis: trade.analysis,
                        date: trade.date,
                        note: trade.note || '',
                        created_at: new Date().toISOString()
                    }
                ]);
            
            if (error) {
                console.error('❌ Error saving trade to Supabase:', error);
            } else {
                console.log('✅ Trade saved to Supabase:', trade);
            }
        } catch (error) {
            console.error('❌ Supabase save exception:', error);
        }
    }

    /**
     * Handle filter change
     */
    handleFilterChange(days) {
        const state = tradeManager.getState();
        let filteredTrades = state.trades;

        if (days !== Infinity) {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            filteredTrades = filterTradesByDateRange(state.trades, startDate, endDate);
        }

        this.renderChartAndStats(filteredTrades, state.startingBalance);
    }

    /**
     * Render chart and statistics
     */
    async renderChartAndStats(trades, startingBalance) {
        const { generateEquityCurveData } = await import('./utils/calculations.js');
        
        const equityData = generateEquityCurveData(
            trades,
            startingBalance,
            tradeManager.deposits,
            tradeManager.withdrawals
        );

        // Update equity curve chart
        if (!this.equityChart) {
            this.equityChart = new EquityCurveChart('equity-curve-canvas');
            this.equityChart.init(equityData);
        } else {
            this.equityChart.update(equityData);
        }

        // Update statistics
        const stats = getTradeStatistics(trades, startingBalance);
        DashboardUI.renderBestWorstTrades(stats);
    }

    /**
     * Main render function
     */
    async render() {
        const state = tradeManager.getState();

        // Render best/worst trades
        DashboardUI.renderBestWorstTrades(state.statistics);

        // Render trade history
        DashboardUI.renderTradeHistory(state.trades);

        // Render equity chart
        const { generateEquityCurveData } = await import('./utils/calculations.js');
        const equityData = generateEquityCurveData(
            state.trades,
            state.startingBalance,
            state.deposits,
            state.withdrawals
        );

        if (!this.equityChart) {
            this.equityChart = new EquityCurveChart('equity-curve-canvas');
            this.equityChart.init(equityData);
        } else {
            this.equityChart.update(equityData);
        }

        // Render filter buttons
        DashboardUI.renderFilterButtons();

        // Render account controls
        DashboardUI.renderAccountControls();
    }

    /**
     * Export data
     */
    exportData() {
        return tradeManager.exportData();
    }

    /**
     * Clear all data
     */
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
            tradeManager.clearAllData();
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new TradingDashboardApp();
    });
} else {
    window.app = new TradingDashboardApp();
}

export default TradingDashboardApp;
