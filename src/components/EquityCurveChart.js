/**
 * Equity Curve Chart Component
 * Professional line chart for account balance visualization
 */

import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters.js';

export class EquityCurveChart {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.chart = null;
        this.options = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#38bdf8',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: (context) => {
                            const data = context[0]?.raw || {};
                            return `${formatDate(data.date) || 'Trade'}`;
                        },
                        label: (context) => {
                            const data = context.raw || {};
                            const lines = [];
                            
                            if (data.balance !== undefined) {
                                lines.push(`Balance: ${formatCurrency(data.balance)}`);
                            }
                            if (data.tradeResult !== undefined) {
                                const sign = data.tradeResult >= 0 ? '+' : '';
                                lines.push(`Result: ${sign}${formatCurrency(data.tradeResult)}`);
                            }
                            if (data.pair) {
                                lines.push(`Pair: ${data.pair}`);
                            }
                            
                            return lines;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: true,
                        color: 'rgba(56, 189, 248, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 12,
                            weight: 500
                        },
                        maxRotation: 0
                    }
                },
                y: {
                    display: true,
                    grid: {
                        display: true,
                        color: 'rgba(56, 189, 248, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 12,
                            weight: 500
                        },
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            ...options
        };
    }

    /**
     * Initialize the chart
     */
    init(data) {
        const canvas = document.getElementById(this.containerId);
        if (!canvas) {
            console.error(`❌ Canvas element with id '${this.containerId}' not found`);
            return null;
        }

        const ctx = canvas.getContext('2d');
        
        // Ensure we have valid data
        if (!data || data.length === 0) {
            console.warn('⚠️ No data provided to equity curve chart, using placeholder');
            data = [{ date: new Date().toISOString().split('T')[0], balance: 0, trades: 0 }];
        }

        console.log('📊 Chart Init - Data points:', data.length, 'First:', data[0], 'Last:', data[data.length-1]);

        // Calculate gradient for profit/loss zones
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
        gradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.1)');
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0.05)');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map((d, i) => d.date || i),
                datasets: [{
                    label: 'Account Equity',
                    data: data,
                    borderColor: '#38bdf8',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: (context) => {
                        // Show points on trades
                        const data = context.raw;
                        return (data.tradeResult || data.eventType) ? 6 : 0;
                    },
                    pointBackgroundColor: (context) => {
                        const data = context.raw;
                        if (data.tradeResult) {
                            return data.tradeResult > 0 ? '#10b981' : '#ef4444';
                        } else if (data.eventType === 'deposit') {
                            return '#3b82f6';
                        } else if (data.eventType === 'withdrawal') {
                            return '#f59e0b';
                        }
                        return 'transparent';
                    },
                    pointBorderColor: (context) => {
                        const data = context.raw;
                        if (data.tradeResult) {
                            return data.tradeResult > 0 ? '#10b981' : '#ef4444';
                        } else if (data.eventType === 'deposit') {
                            return '#3b82f6';
                        } else if (data.eventType === 'withdrawal') {
                            return '#f59e0b';
                        }
                        return 'transparent';
                    },
                    pointBorderWidth: 2,
                    pointHoverRadius: 8,
                    segment: {
                        borderColor: (ctx) => {
                            const startValue = ctx.p1DataIndex >= 0 ? data[ctx.p1DataIndex].balance : 0;
                            const endValue = ctx.p2DataIndex >= 0 ? data[ctx.p2DataIndex].balance : 0;
                            
                            if (endValue > startValue) {
                                return '#10b981'; // Green for profit
                            } else if (endValue < startValue) {
                                return '#ef4444'; // Red for loss
                            }
                            return '#38bdf8'; // Cyan for neutral
                        }
                    }
                }]
            },
            options: this.options
        });

        return this.chart;
    }

    /**
     * Update chart data
     */
    update(data) {
        if (!this.chart) {
            return this.init(data);
        }

        const gradient = this.chart.ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
        gradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.1)');
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0.05)');

        this.chart.data.labels = data.map((d, i) => i);
        this.chart.data.datasets[0].data = data;
        this.chart.data.datasets[0].backgroundColor = gradient;

        this.chart.update('active');
    }

    /**
     * Destroy chart
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}

export default EquityCurveChart;
