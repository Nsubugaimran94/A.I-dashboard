// Mobile viewport fix for keyboard
if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    window.addEventListener('resize', () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
}

// Authentication
let isAuthenticated = false;
let currentUser = null;

// Check authentication on page load
function checkAuthentication() {
    const authToken = localStorage.getItem("authToken");
    const userName = localStorage.getItem("userName");
    
    if (authToken && userName) {
        isAuthenticated = true;
        currentUser = userName;
        showDashboard();
    } else {
        showLogin();
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    
    if (!email || !password) {
        alert("Please fill in all fields");
        return;
    }
    
    // Simple authentication - store credentials in localStorage
    const authToken = btoa(email + ":" + password); // Base64 encode
    localStorage.setItem("authToken", authToken);
    localStorage.setItem("userName", email);
    
    isAuthenticated = true;
    currentUser = email;
    
    // Clear login form
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";
    
    showDashboard();
}

function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userName");
        
        isAuthenticated = false;
        currentUser = null;
        
        showLogin();
    }
}

function showLogin() {
    document.getElementById("loginSection").style.display = "flex";
    document.getElementById("dashboardSection").style.display = "none";
}

function showDashboard() {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("dashboardSection").style.display = "block";
    
    // Initialize dashboard with slight delay to ensure DOM is ready
    setTimeout(() => {
        initializeDashboard();
    }, 100);
}

function initializeDashboard() {
    try {
        // Set date inputs
        document.getElementById("tradeDate").value = today;
        if (document.getElementById("input-date")) {
            document.getElementById("input-date").value = today;
        }
        
        displayTrades();
        renderCalendar();
        updateDashboardStats();
        initCharts();
        updateAccountSize();
        generateAINews();
    } catch (error) {
        console.log("Dashboard elements not yet loaded, retrying...");
    }
}

let trades = JSON.parse(localStorage.getItem("trades")) || [];
let accountHistory = JSON.parse(localStorage.getItem("accountHistory")) || [];

const todayDate = new Date();
const today = formatDate(todayDate);
let selectedDate = null;
let calendarYear = todayDate.getFullYear();
let calendarMonth = todayDate.getMonth();

// Chart instances
let accountProfitLossChart;

// Check authentication on page load
window.addEventListener('load', checkAuthentication);


function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function addTrade() {
    const pair = document.getElementById("pair").value;
    const result = document.getElementById("result").value;
    const analysis = document.getElementById("analysis").value;
    const date = document.getElementById("tradeDate").value || today;

    if (!pair || !result || !analysis) {
        alert("Please fill in all fields");
        return;
    }

    const trade = {
        pair: pair,
        result: parseFloat(result),
        analysis: analysis,
        date: date
    };

    trades.push(trade);
    localStorage.setItem("trades", JSON.stringify(trades));

    selectedDate = date;
    displayTrades();
    renderCalendar();
    updateDashboardStats();
    updateCharts();
    updateAccountSize();

    document.getElementById("pair").value = "";
    document.getElementById("result").value = "";
    document.getElementById("tradeDate").value = today;
    document.getElementById("analysis").value = "";
}

// Dashboard Stats Functions
function updateDashboardStats() {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.result > 0).length;
    const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;
    const totalPL = trades.reduce((sum, t) => sum + t.result, 0);
    const avgTrade = totalTrades > 0 ? (totalPL / totalTrades).toFixed(2) : 0;

    document.getElementById("totalTrades").textContent = totalTrades;
    document.getElementById("winRate").textContent = winRate + "%";
    document.getElementById("totalPL").textContent = "$" + totalPL.toFixed(2);
    document.getElementById("avgTrade").textContent = "$" + avgTrade;
}

function initCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: {
                    color: '#e2e8f0',
                    font: { size: 12 }
                }
            }
        },
        scales: {
            y: {
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            },
            x: {
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            }
        }
    };

    // Account Profit/Loss Chart
    const chartCtx = document.getElementById('accountProfitLossChart').getContext('2d');
    accountProfitLossChart = new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Account Balance',
                data: [],
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: '#38bdf8'
            }]
        },
        options: { ...chartOptions, plugins: { ...chartOptions.plugins } }
    });

    updateCharts();
}

function updateCharts() {
    if (!accountProfitLossChart) return;

    // Account Profit/Loss Chart
    let accountBalance = 0;
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    const chartLabels = sortedTrades.map((t, idx) => `Trade ${idx + 1}`);
    const chartData = sortedTrades.map(t => {
        accountBalance += t.result;
        return accountBalance;
    });

    accountProfitLossChart.data.labels = chartLabels;
    accountProfitLossChart.data.datasets[0].data = chartData;
    accountProfitLossChart.update();
}

// Tab Switching Function
function switchTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.chart-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Account Size Tracking Functions
function updateAccountSize() {
    // Calculate current account balance
    let currentBalance = 0;
    trades.forEach(t => {
        currentBalance += t.result;
    });
    
    // Get account history with resets
    let startingBalance = 0;
    let peakBalance = currentBalance;
    let resetCount = 0;
    
    if (accountHistory.length === 0 && trades.length > 0) {
        // Initialize account history
        let balance = 0;
        trades.forEach(trade => {
            balance += trade.result;
            accountHistory.push({
                date: trade.date,
                balance: balance
            });
            
            // Check for reset
            if (balance === 0 && balance < currentBalance) {
                resetCount++;
            }
            
            // Track peak
            if (balance > peakBalance) {
                peakBalance = balance;
            }
        });
    } else {
        // Update existing history with new trades
        let lastBalance = accountHistory.length > 0 ? accountHistory[accountHistory.length - 1].balance : 0;
        trades.forEach((trade, idx) => {
            const historyIndex = accountHistory.findIndex(h => h.date === trade.date && h.balance === lastBalance + trade.result);
            if (historyIndex === -1) {
                lastBalance += trade.result;
                accountHistory.push({
                    date: trade.date,
                    balance: lastBalance
                });
            }
        });
    }
    
    // Count resets
    accountHistory.forEach((entry, idx) => {
        if (entry.balance === 0 && idx > 0) {
            resetCount++;
        }
    });
    
    // Find starting balance
    startingBalance = accountHistory.length > 0 ? 0 : currentBalance;
    if (accountHistory.length > 0) {
        const firstEntry = accountHistory[0];
        startingBalance = firstEntry.balance - (trades[0]?.result || 0);
    }
    
    // Find peak balance
    peakBalance = Math.max(currentBalance, ...accountHistory.map(h => h.balance));
    
    // Update UI
    document.getElementById('currentAccountSize').textContent = '$' + currentBalance.toFixed(2);
    document.getElementById('startingBalance').textContent = '$' + startingBalance.toFixed(2);
    document.getElementById('peakBalance').textContent = '$' + peakBalance.toFixed(2);
    document.getElementById('resetCount').textContent = resetCount;
    
    // Update account history display
    displayAccountHistory();
    
    // Save to localStorage
    localStorage.setItem("accountHistory", JSON.stringify(accountHistory));
}

function displayAccountHistory() {
    const historyContainer = document.getElementById('accountSizeHistory');
    historyContainer.innerHTML = '';
    
    if (accountHistory.length === 0) {
        historyContainer.innerHTML = '<p style="text-align: center; color: #94a3b8;">No account history yet</p>';
        return;
    }
    
    accountHistory.forEach((entry, idx) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        const color = entry.balance >= 0 ? '#10b981' : '#ef4444';
        historyItem.innerHTML = `
            <span class="history-date">${entry.date}</span>
            <span class="history-balance" style="color: ${color};">$${entry.balance.toFixed(2)}</span>
        `;
        historyContainer.appendChild(historyItem);
    });
}

function displayTrades() {
    const tradesContainer = document.getElementById("trades-container") || document.getElementById("trades");
    tradesContainer.innerHTML = "";

    const filteredTrades = selectedDate
        ? trades.filter(trade => trade.date === selectedDate)
        : trades;

    document.getElementById("selectedDateLabel").textContent = selectedDate
        ? `Trades for ${selectedDate}`
        : "All Trades";

    if (filteredTrades.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.classList.add("empty-message");
        emptyMessage.textContent = selectedDate
            ? "No trades on this day."
            : "No trades recorded yet.";
        tradesContainer.appendChild(emptyMessage);

        const countEl = document.getElementById("tradesCount");
        if (countEl) countEl.textContent = "0 trades";
        return;
    }

    const countEl = document.getElementById("tradesCount");
    if (countEl) countEl.textContent = `${filteredTrades.length} trade${filteredTrades.length !== 1 ? 's' : ''}`;

    for (let i = 0; i < filteredTrades.length; i++) {
        const trade = filteredTrades[i];
        const tradeIndex = trades.indexOf(trade);
        const tradeCard = document.createElement("div");
        tradeCard.classList.add("trade-card");

        const tradeInfo = document.createElement("div");
        tradeInfo.classList.add("trade-info");
        
        const resultColor = trade.result > 0 ? '#10b981' : '#ef4444';
        const resultSign = trade.result > 0 ? '+' : '';
        
        tradeInfo.innerHTML = `
            <h2>${trade.pair}</h2>
            <p><strong>P&L:</strong> <span style="color: ${resultColor}; font-weight: bold;">${resultSign}$${trade.result.toFixed(2)}</span></p>
            <p><strong>Analysis:</strong> ${trade.analysis}</p>
            <p><strong>Date:</strong> ${trade.date}</p>
        `;

        const tradeActions = document.createElement("div");
        tradeActions.classList.add("trade-actions");
        
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteTrade(tradeIndex);

        tradeActions.appendChild(deleteBtn);
        tradeCard.appendChild(tradeInfo);
        tradeCard.appendChild(tradeActions);
        tradesContainer.appendChild(tradeCard);
    }
}

function renderCalendar() {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const calendarMonthLabel = document.getElementById("calendarMonthLabel");
    const calendarGrid = document.getElementById("calendarGrid");
    
    if (!calendarMonthLabel || !calendarGrid) {
        console.log("Calendar elements not found");
        return;
    }

    calendarMonthLabel.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let html = "";
    weekdays.forEach(day => {
        html += `<div class="calendar-cell calendar-weekday">${day}</div>`;
    });

    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-cell empty"></div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
        const dayDate = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayTrades = trades.filter(trade => trade.date === dayDate).length;
        const isSelected = selectedDate === dayDate;

        html += `
            <button class="calendar-cell calendar-day ${isSelected ? "selected" : ""} ${dayTrades > 0 ? "has-trades" : ""}" onclick="selectCalendarDate('${dayDate}')">
                <span class="date-number">${day}</span>
                ${dayTrades > 0 ? `<span class="trade-count">${dayTrades}</span>` : ""}
            </button>
        `;
    }

    calendarGrid.innerHTML = html;
}

function changeMonth(offset) {
    calendarMonth += offset;
    if (calendarMonth > 11) {
        calendarMonth = 0;
        calendarYear += 1;
    } else if (calendarMonth < 0) {
        calendarMonth = 11;
        calendarYear -= 1;
    }
    renderCalendar();
}

function selectCalendarDate(date) {
    selectedDate = date;
    displayTrades();
    renderCalendar();
}

function clearSelectedDate() {
    selectedDate = null;
    displayTrades();
    renderCalendar();
}
function getNews() {

    const fakeNews = [
        "USD strengthens after economic data release",
        "Gold drops as risk appetite increases",
        "Federal Reserve hints at rate stability",
        "Crypto market shows volatility ahead of CPI data"
    ];

    const newsContainer = document.getElementById("news");

    newsContainer.innerHTML = "";

    for (let i = 0; i < fakeNews.length; i++) {

        const div = document.createElement("div");

        div.classList.add("news-item");

        div.innerText = fakeNews[i];

        newsContainer.appendChild(div);
    }
}

// Market News AI Panel - Real API Integration (FOREX FOCUSED)
let aiNewsData = [];
let currentNewsFilter = 'all';

// NewsAPI.org configuration
const NEWS_API_KEY = '5a6b7c47b1b4406da40384385e1f0711'; // get your own free key at https://newsapi.org
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

// Fallback sample news data
const SAMPLE_FOREX_NEWS = [
    {
        headline: "USD Strengthens on Better-Than-Expected Economic Data",
        description: "The US dollar rallied to a 4-month high following stronger-than-anticipated economic growth figures",
        source: "Reuters",
        sentiment: "bullish",
        markets: ["EURUSD", "GBPUSD"]
    },
    {
        headline: "ECB Signals Cautious Approach on Rate Cuts",
        description: "European Central Bank maintains hawkish stance despite economic headwinds in Eurozone",
        source: "Bloomberg",
        sentiment: "bearish",
        markets: ["EUR"]
    },
    {
        headline: "Bank of Japan Extends Stimulus Program",
        description: "BoJ announces extension of quantitative easing measures to support recovery",
        source: "Financial Times",
        sentiment: "bearish",
        markets: ["USDJPY"]
    },
    {
        headline: "GBP Gains on UK Employment Report Beat",
        description: "Sterling strengthens after UK unemployment falls to lowest level in decades",
        source: "CNBC",
        sentiment: "bullish",
        markets: ["GBPUSD"]
    },
    {
        headline: "AUD Falls on Weak China Economic Data",
        description: "Australian dollar declines following disappointing manufacturing data from China",
        source: "Reuters",
        sentiment: "bearish",
        markets: ["AUDUSD"]
    }
];

// Major Forex Pairs
const forexPairs = [
    'EURUSD', 'GBPUSD', 'USDCAD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'USDCHF',
    'EURJPY', 'GBPJPY', 'EURGBP', 'EURJPY', 'AUDCAD', 'AUDNZD',
    'CADCHF', 'CHFJPY', 'EURNZD', 'EURCAD', 'GBPCHF', 'NZDJPY'
];

// Currency to country/interest rate body mapping
const currencyDetails = {
    'EUR': { country: 'Eurozone', central_bank: 'ECB', keywords: ['euro', 'ecb', 'eurozone'] },
    'GBP': { country: 'UK', central_bank: 'BoE', keywords: ['pound', 'sterling', 'bank of england', 'boe'] },
    'USD': { country: 'USA', central_bank: 'Fed', keywords: ['dollar', 'federal reserve', 'fed', 'usd'] },
    'JPY': { country: 'Japan', central_bank: 'BoJ', keywords: ['yen', 'japan', 'boj'] },
    'AUD': { country: 'Australia', central_bank: 'RBA', keywords: ['australian', 'australia', 'aud', 'rba'] },
    'NZD': { country: 'New Zealand', central_bank: 'RBNZ', keywords: ['zealand', 'nzd', 'rbnz'] },
    'CAD': { country: 'Canada', central_bank: 'BoC', keywords: ['canada', 'canadian', 'boc'] },
    'CHF': { country: 'Switzerland', central_bank: 'SNB', keywords: ['swiss', 'switzerland', 'chf', 'snb'] }
};

// Sentiment keywords for AI analysis
const sentimentKeywords = {
    bullish: ['surge', 'rally', 'gain', 'rise', 'bullish', 'bull', 'boost', 'beat', 'outperform', 'soar', 'jump', 'strong', 'positive', 'growth', 'stimulus', 'strength', 'upside', 'higher', 'increased', 'support'],
    bearish: ['fall', 'drop', 'decline', 'bearish', 'bear', 'weakness', 'crash', 'plunge', 'miss', 'slump', 'loss', 'negative', 'concern', 'threat', 'tension', 'pressure', 'lower', 'downside', 'weakness', 'resistance']
};

function analyzeSentiment(text) {
    const lowerText = text.toLowerCase();
    let bullishCount = sentimentKeywords.bullish.filter(keyword => lowerText.includes(keyword)).length;
    let bearishCount = sentimentKeywords.bearish.filter(keyword => lowerText.includes(keyword)).length;
    
    if (bullishCount > bearishCount) return 'bullish';
    if (bearishCount > bullishCount) return 'bearish';
    return 'neutral';
}

function extractForexPairs(text) {
    const lowerText = text.toLowerCase();
    const foundPairs = [];
    
    // Check for direct pair mentions
    forexPairs.forEach(pair => {
        const pairLower = pair.toLowerCase();
        if (lowerText.includes(pairLower)) {
            foundPairs.push(pair);
        }
    });
    
    // Check for currency codes
    const currencyCodes = ['eur', 'gbp', 'usd', 'jpy', 'aud', 'nzd', 'cad', 'chf'];
    const foundCurrencies = [];
    
    currencyCodes.forEach(code => {
        if (lowerText.includes(code) && !foundCurrencies.includes(code)) {
            foundCurrencies.push(code.toUpperCase());
        }
    });
    
    return foundPairs.length > 0 ? foundPairs : (foundCurrencies.length > 0 ? foundCurrencies : ['GENERAL']);
}

function getDirectionalBias(sentiment) {
    if (sentiment === 'bullish') return 'LONG 🟢';
    if (sentiment === 'bearish') return 'SHORT 🔴';
    return 'NEUTRAL ⚪';
}

function getImpactLevel(source, sentiment) {
    const highImpactSources = ['reuters', 'bloomberg', 'cnbc', 'financial times', 'wall street journal', 'fed', 'ecb', 'boe', 'rba', 'boj'];
    const isHighSource = highImpactSources.some(src => source.toLowerCase().includes(src));
    
    if (isHighSource && (sentiment === 'bullish' || sentiment === 'bearish')) return 'high';
    if (sentiment === 'bullish' || sentiment === 'bearish') return 'medium';
    return 'low';
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
}

async function generateAINews() {
    const container = document.getElementById('aiNewsContainer');
    container.innerHTML = '<div class="ai-news-empty">Loading forex market news...</div>';
    
    try {
        // Try to fetch from NewsAPI
        const searchQueries = 'forex OR "currency markets" OR "forex pairs" OR EUR/USD OR GBP/USD OR USD/JPY OR USD/CAD OR AUD/USD OR economic data OR central bank OR interest rates OR inflation OR employment';
        const response = await fetch(
            `${NEWS_API_URL}?q=${encodeURIComponent(searchQueries)}&sortBy=publishedAt&language=en&pageSize=30&apiKey=${NEWS_API_KEY}`,
            { method: 'GET', mode: 'cors' }
        );
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'error') {
            throw new Error(data.message || 'Unknown API error');
        }
        
        if (!data.articles || data.articles.length === 0) {
            // Use fallback data if no articles
            loadFallbackNews();
            return;
        }
        
        aiNewsData = data.articles.map(article => {
            const sentiment = analyzeSentiment(article.title + ' ' + (article.description || ''));
            return {
                headline: article.title,
                description: article.description || '',
                analysis: `${article.description || 'Market analysis'}`,
                source: article.source.name,
                timestamp: formatTimeAgo(article.publishedAt),
                image: article.urlToImage,
                url: article.url,
                sentiment: sentiment,
                directionalBias: getDirectionalBias(sentiment),
                impact: getImpactLevel(article.source.name, sentiment),
                markets: extractForexPairs(article.title + ' ' + (article.description || ''))
            };
        });
        
        displayAINews();
    } catch (error) {
        console.error('News API Error:', error);
        // Load fallback data on error
        loadFallbackNews();
    }
}

function loadFallbackNews() {
    // Use sample data as fallback
    aiNewsData = SAMPLE_FOREX_NEWS.map(news => {
        const timestamp = new Date();
        timestamp.setHours(timestamp.getHours() - Math.floor(Math.random() * 24));
        
        return {
            headline: news.headline,
            description: news.description,
            analysis: news.description,
            source: news.source,
            timestamp: formatTimeAgo(timestamp.toISOString()),
            image: null,
            url: '#',
            sentiment: news.sentiment,
            directionalBias: getDirectionalBias(news.sentiment),
            impact: getImpactLevel(news.source, news.sentiment),
            markets: news.markets,
            isSample: true
        };
    });
    
    displayAINews();
}

function displayAINews() {
    const container = document.getElementById('aiNewsContainer');
    container.innerHTML = '';
    
    // Check if using sample data
    const usingSampleData = aiNewsData.length > 0 && aiNewsData[0].isSample;
    if (usingSampleData) {
        const sampleNotice = document.createElement('div');
        sampleNotice.className = 'ai-news-sample-notice';
        sampleNotice.innerHTML = '<span>📢 Using sample data (API not available)</span>';
        container.appendChild(sampleNotice);
    }
    
    let filteredNews = aiNewsData;
    if (currentNewsFilter !== 'all') {
        filteredNews = aiNewsData.filter(item => item.impact === currentNewsFilter);
    }
    
    if (filteredNews.length === 0) {
        container.innerHTML = '<div class="ai-news-empty">No news items found for this filter. Try another one!</div>';
        return;
    }
    
    filteredNews.forEach(news => {
        const newsEl = document.createElement('div');
        newsEl.className = `ai-news-item ${news.sentiment}`;
        
        const sentimentEmoji = {
            'bullish': '📈',
            'bearish': '📉',
            'neutral': '➡️'
        }[news.sentiment];
        
        const impactColor = {
            'high': 'High ⚡',
            'medium': 'Medium •',
            'low': 'Low'
        }[news.impact];
        
        // Extract forex pair for display
        const pairDisplay = news.markets.length > 0 && news.markets[0] !== 'GENERAL' 
            ? news.markets.slice(0, 2).join(' / ') 
            : 'Multi-Pair';
        
        newsEl.innerHTML = `
            <div class="ai-news-content">
                <p class="ai-news-headline">${news.headline}</p>
                <p class="ai-news-analysis">${news.analysis}</p>
                <div class="ai-news-meta">
                    <span class="ai-news-meta-item">📍 ${news.source}</span>
                    <span class="ai-news-meta-item">🕐 ${news.timestamp}</span>
                    <span class="ai-news-meta-item">💱 Pairs: ${news.markets.join(', ')}</span>
                </div>
                ${news.url && news.url !== '#' ? `<a href="${news.url}" target="_blank" class="ai-news-link">Read Full Article →</a>` : ''}
            </div>
            <div class="ai-news-badge">
                <div class="bias-badge">${news.directionalBias}</div>
                <div class="sentiment-badge ${news.sentiment}">${sentimentEmoji}</div>
                <div class="impact-badge ${news.impact}">${impactColor}</div>
            </div>
        `;
        
        container.appendChild(newsEl);
    });
}

function filterNewsByImpact(impact) {
    currentNewsFilter = impact;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayAINews();
}

// Delete Trade Function
function deleteTrade(index) {
    if (confirm("Are you sure you want to delete this trade?")) {
        trades.splice(index, 1);
        accountHistory = []; // Reset account history
        localStorage.setItem("trades", JSON.stringify(trades));
        localStorage.setItem("accountHistory", JSON.stringify(accountHistory));
        displayTrades();
        renderCalendar();
        updateDashboardStats();
        updateCharts();
        updateAccountSize();
    }
}

// Initialize AI News on page load
window.addEventListener('load', () => {
    generateAINews();
});
function upgradeAccount() {
    document.getElementById("aiNewsPanel").classList.add("active");
    alert("✨ Premium Activated! AI News Analysis unlocked!");
}