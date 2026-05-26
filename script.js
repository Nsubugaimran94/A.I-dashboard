const supabaseUrl = "https://qzhiseywodahrtqcdtpe.supabase.co";

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6aGlzZXl3b2RhaHJ0cWNkdHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NDgxMDgsImV4cCI6MjA5NDQyNDEwOH0.8ApFcHsPCtN0Tdp1uWyIDahHgeT_mO6bB6yi5hVjKKo";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
window.supabaseClient = supabaseClient;

// ============================================================
// PWA SERVICE WORKER REGISTRATION
// ============================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/public/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registered successfully:', registration);
            })
            .catch((error) => {
                console.warn('⚠️ Service Worker registration failed:', error);
            });
    });
}

// Supabase Auth Functions
async function supabaseSignUp(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin,
            }
        });

        if (error) {
            console.error("Signup error:", error);
            return { success: false, message: error.message };
        } else {
            return { success: true, message: "Account created successfully! You can now login." };
        }
    } catch (error) {
        console.error("Signup exception:", error);
        return { success: false, message: error.message };
    }
}

async function supabaseLogin(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error("Login error:", error);
            if (error.message.includes("Invalid login credentials")) {
                return { success: false, message: "❌ Invalid email or password. Please check your credentials." };
            } else if (error.message.includes("Email not confirmed")) {
                return { success: false, message: "Please confirm your email before logging in." };
            } else {
                return { success: false, message: error.message };
            }
        } else {
            isAuthenticated = true;
            currentUser = email;
            localStorage.setItem("authToken", data.session.access_token);
            localStorage.setItem("userName", email);
            localStorage.setItem("userId", data.user.id);
            return { success: true, message: "Login successful!" };
        }
    } catch (error) {
        console.error("Login exception:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Initialize user starting balance on account creation
 * Inserts a user_balance record into Supabase with balance = 0
 */
async function initializeUserBalance(userId) {
    try {
        // Insert into user_balance table in Supabase
        const { data, error } = await supabaseClient
            .from('user_balance')
            .insert([{ user_id: userId, balance: 0 }])
            .select();
        
        if (error) {
            console.error('❌ Error initializing user balance in Supabase:', error);
            // Fallback to localStorage if Supabase fails
            localStorage.setItem("userStartingBalance", "0");
            return false;
        }
        
        console.log('✅ User balance initialized to $0 in Supabase for user:', userId);
        return true;
    } catch (error) {
        console.error('❌ Exception initializing user balance:', error);
        localStorage.setItem("userStartingBalance", "0");
        return false;
    }
}

/**
 * Load user balance data on login
 * Fetches balance from Supabase user_balance table
 */
async function loadUserBalance(userId) {
    try {
        // Load user's balance from Supabase
        const { data, error } = await supabaseClient
            .from('user_balance')
            .select('balance')
            .eq('user_id', userId)
            .single();
        
        if (error) {
            console.warn('⚠️ Could not load balance from Supabase:', error);
            // Fallback: Check localStorage, then default to 0
            const cachedBalance = localStorage.getItem("userStartingBalance");
            const balance = parseFloat(cachedBalance || "0");
            
            STARTING_BALANCE = balance; // CRITICAL: Update global STARTING_BALANCE
            
            if (window.tradeManager) {
                window.tradeManager.startingBalance = balance;
                window.tradeManager.saveStartingBalance();
            }
            return true;
        }
        
        // Successfully loaded balance from Supabase
        const balance = data?.balance || 0;
        STARTING_BALANCE = Number(balance); // CRITICAL: Update global STARTING_BALANCE with actual user balance
        
        console.log('✅ User balance loaded from Supabase:', balance, 'for user:', userId);
        
        // Update tradeManager with loaded balance
        if (window.tradeManager) {
            window.tradeManager.startingBalance = Number(balance);
            window.tradeManager.saveStartingBalance();
        }
        
        // Cache in localStorage as backup
        localStorage.setItem("userStartingBalance", String(balance));
        
        return true;
    } catch (error) {
        console.error('❌ Exception loading user balance:', error);
        // Fallback
        const cachedBalance = localStorage.getItem("userStartingBalance") || "0";
        STARTING_BALANCE = parseFloat(cachedBalance);
        if (window.tradeManager) {
            window.tradeManager.startingBalance = parseFloat(cachedBalance);
            window.tradeManager.saveStartingBalance();
        }
        return false;
    }
}

/**
 * Update user balance in Supabase
 * Called after any balance-changing operation (trade, deposit, withdrawal)
 */
async function updateUserBalanceInSupabase(newBalance) {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        console.warn('⚠️ No user ID, cannot update balance');
        return false;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('user_balance')
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .select();
        
        if (error) {
            console.error('❌ Error updating balance in Supabase:', error);
            return false;
        }
        
        console.log('✅ Balance updated in Supabase:', newBalance);
        return true;
    } catch (error) {
        console.error('❌ Exception updating balance:', error);
        return false;
    }
}
    // Mobile viewport fix for keyboard
if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    window.addEventListener('resize', () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
}

// Supabase Data Functions
async function saveTradeToSupabase(trade) {
    const userId = localStorage.getItem("userId");
    if (!userId) return false;
    
    try {
        const { data, error } = await supabaseClient
            .from('trades')
            .insert([
                {
                    user_id: userId,
                    pair: trade.pair,
                    profit_loss: Number(trade.result), // Store P&L as profit_loss field
                    result: Number(trade.result), // Keep for backward compatibility
                    analysis: trade.analysis,
                    date: trade.date,
                    note: trade.note || '',
                    created_at: new Date().toISOString()
                }
            ]);
        
        if (error) {
            console.error('❌ Error saving trade:', error);
            return false;
        }
        
        // Trigger instant balance update
        updateAccountSizeUI();
        
        console.log('✅ Trade saved to Supabase with P&L:', trade);
        return true;
    } catch (error) {
        console.error('❌ Error saving trade to Supabase:', error);
        return false;
    }
}

async function loadTradesFromSupabase() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('trades')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        
        if (error) {
            console.error('❌ Error loading trades:', error);
            return;
        }
        
        if (data) {
            // Ensure all numeric fields are properly converted to numbers
            // Use profit_loss if available, fall back to result for backward compatibility
            trades = data.map(trade => ({
                ...trade,
                result: Number(trade.result || trade.profit_loss || 0),
                profit_loss: Number(trade.profit_loss || trade.result || 0)
            }));
            
            if (window.tradeManager) {
                window.tradeManager.trades = trades;
                window.tradeManager.saveTrades();
                window.tradeManager.notify();
            }
            displayTrades();
            renderCalendar();
            updateDashboardStats();
            updateCharts();
            updateAccountSize();
        }
    } catch (error) {
        console.error('❌ Error loading trades from Supabase:', error);
    }
}

async function deleteTradeFromSupabase(id) {
    try {
        const { error } = await supabaseClient
            .from('trades')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('Error deleting trade:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error deleting trade from Supabase:', error);
        return false;
    }
}

async function saveDepositToSupabase(deposit) {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        console.log('⚠️ No user ID, deposit saved locally only');
        return false;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('deposits')
            .insert([
                {
                    user_id: userId,
                    amount: Number(deposit.amount), // Ensure stored as number, not string
                    date: deposit.date,
                    created_at: new Date().toISOString()
                }
            ]);
        
        if (error) {
            console.error('❌ Error saving deposit to Supabase:', error);
            return false;
        }
        console.log('✅ Deposit saved to Supabase:', deposit);
        return true;
    } catch (error) {
        console.error('❌ Error saving deposit to Supabase:', error);
        return false;
    }
}

async function saveWithdrawalToSupabase(withdrawal) {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        console.log('⚠️ No user ID, withdrawal saved locally only');
        return false;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .insert([
                {
                    user_id: userId,
                    amount: Number(withdrawal.amount), // Ensure stored as number, not string
                    date: withdrawal.date,
                    created_at: new Date().toISOString()
                }
            ]);
        
        if (error) {
            console.error('❌ Error saving withdrawal to Supabase:', error);
            return false;
        }
        console.log('✅ Withdrawal saved to Supabase:', withdrawal);
        return true;
    } catch (error) {
        console.error('❌ Error saving withdrawal to Supabase:', error);
        return false;
    }
}

// Authentication
let isAuthenticated = false;
let currentUser = null;

// Check authentication on page load
async function checkAuthentication() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (session && session.user) {
        isAuthenticated = true;
        currentUser = session.user.email;
        localStorage.setItem("authToken", session.access_token);
        localStorage.setItem("userName", session.user.email);
        localStorage.setItem("userId", session.user.id);
        await loadUserBalance(session.user.id);
        showDashboard();
        await loadTradesFromSupabase();
    } else {
        showLogin();
    }
}

// Form handling
function switchToLogin() {
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("loginTab").style.borderBottom = "3px solid #38bdf8";
    document.getElementById("loginTab").style.color = "#38bdf8";
    document.getElementById("signupTab").style.borderBottom = "3px solid transparent";
    document.getElementById("signupTab").style.color = "#94a3b8";
}

function switchToSignup() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "block";
    document.getElementById("loginTab").style.borderBottom = "3px solid transparent";
    document.getElementById("loginTab").style.color = "#94a3b8";
    document.getElementById("signupTab").style.borderBottom = "3px solid #38bdf8";
    document.getElementById("signupTab").style.color = "#38bdf8";
}

async function handleSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("signupConfirm").value;

    if (!email || !password || !confirmPassword) {
        alert("Please fill in all fields");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    const result = await supabaseSignUp(email, password);
    
    if (result.success) {
        // Get the user ID for the newly created account
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
            await initializeUserBalance(user.id);
        }
        alert(result.message);
        // Clear form
        document.getElementById("signupForm").reset();
        // Switch to login
        switchToLogin();
        // Auto-fill email for convenience
        document.getElementById("loginEmail").value = email;
    } else {
        alert("Signup failed: " + result.message);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        alert("Please fill in all fields");
        return;
    }

    const result = await supabaseLogin(email, password);
    
    if (result.success) {
        const userId = localStorage.getItem("userId");
        if (userId) {
            await loadUserBalance(userId);
        }
        alert(result.message);
        showDashboard();
        await loadTradesFromSupabase();
    } else {
        alert("Login failed: " + result.message);
    }
}

function toggleAuthMode() {
    const toggle = document.getElementById("loginToggle");
    const modeLabel = document.getElementById("authToggleLabel");
    const submitBtn = document.getElementById("authSubmitBtn");
    const toggleLink = document.getElementById("authModeToggle");
    
    if (toggle.checked) {
        // Sign up mode
        modeLabel.textContent = "Sign Up Mode";
        submitBtn.textContent = "Create Account";
        toggleLink.textContent = "Already have account? Login";
    } else {
        // Login mode
        modeLabel.textContent = "Login Mode";
        submitBtn.textContent = "Login";
        toggleLink.textContent = "New user? Create account";
    }
}

// Add click handler for toggle link
window.addEventListener('load', function() {
    const toggleLink = document.getElementById("authModeToggle");
    if (toggleLink) {
        toggleLink.addEventListener('click', function(e) {
            e.preventDefault();
            const toggle = document.getElementById("loginToggle");
            toggle.checked = !toggle.checked;
            toggleAuthMode();
        });
    }
});

async function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
            alert("Error logging out: " + error.message);
            return;
        }
        
        localStorage.removeItem("authToken");
        localStorage.removeItem("userName");
        localStorage.removeItem("userId");
        localStorage.removeItem("userStartingBalance");
        
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
    
    // Initialize dashboard with longer delay to ensure DOM is ready
    setTimeout(() => {
        initializeDashboard();
        // updateAccountSize() is already called in initializeDashboard() - NO DUPLICATE
    }, 300);
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

let trades = window.app?.tradeManager?.trades || [];
let accountHistory = [];
let deposits = window.app?.tradeManager?.deposits || [];
let withdrawals = window.app?.tradeManager?.withdrawals || [];
let STARTING_BALANCE = 0; // CRITICAL: This is updated when user logs in with their balance from Supabase

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

/**
 * Parse and validate numeric input
 * Handles +/- signs and ensures proper numeric conversion
 * @param {string} input - Raw input string
 * @returns {number|null} - Parsed number or null if invalid
 */
function parseNumericInput(input) {
    if (typeof input !== 'string') {
        input = String(input);
    }
    
    // Trim whitespace
    input = input.trim();
    
    if (!input) {
        return null;
    }
    
    // Allow +/- sign at the start
    const parsed = parseFloat(input);
    
    // Validate it's a proper number
    if (isNaN(parsed) || !isFinite(parsed)) {
        return null;
    }
    
    return parsed;
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

    const tradeData = {
        pair: pair,
        result: parseFloat(result),
        analysis: analysis,
        date: date,
        note: document.getElementById("note")?.value || ''
    };

// Use tradeManager (new system) which handles Supabase
        if (window.tradeManager) {
            window.tradeManager.addTrade(tradeData);
            saveTradeToSupabase(tradeData);
        } else {
            // Fallback - save to Supabase only
            trades.push(tradeData);
            saveTradeToSupabase(tradeData);
        }

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
    if (document.getElementById("note")) {
        document.getElementById("note").value = "";
    }
}

function addDeposit() {
    const inputValue = document.getElementById("deposit-amount")?.value;
    const parsedAmount = parseNumericInput(inputValue);
    
    if (parsedAmount === null || parsedAmount <= 0) {
        alert("Please enter a valid deposit amount (positive number)");
        return;
    }
    
    // For deposits, ensure it's positive
    const amount = Math.abs(parsedAmount);
    
    const depositData = {
        amount: amount,
        date: today
    };
    
    // Use tradeManager (new system) which handles Supabase
    let deposit;
    if (window.tradeManager) {
        deposit = window.tradeManager.addDeposit(amount, today);
        saveDepositToSupabase(deposit);
    } else {
        // Fallback - save to Supabase only
        deposit = { ...depositData, id: Date.now() };
        deposits.push(deposit);
        saveDepositToSupabase(deposit);
    }
    
    console.log('💰 Deposit added:', depositData);
    
    // ✅ INSTANT UI UPDATE
    updateAccountSizeUI();
    
    document.getElementById("deposit-amount").value = "";
    
    // Schedule heavy updates
    updateAccountSize();
    
    showNotification(`Deposit of $${amount.toFixed(2)} added successfully!`, 'success');
}

function addWithdrawal() {
    const inputValue = document.getElementById("withdrawal-amount")?.value;
    const parsedAmount = parseNumericInput(inputValue);
    
    if (parsedAmount === null || parsedAmount <= 0) {
        alert("Please enter a valid withdrawal amount (positive number)");
        return;
    }
    
    // For withdrawals, ensure it's positive
    const amount = Math.abs(parsedAmount);
    
    // Check balance via tradeManager if available
    let currentBalance = STARTING_BALANCE;
    if (window.tradeManager) {
        const state = window.tradeManager.getState();
        currentBalance = state.currentBalance;
    } else {
        currentBalance = calculateCurrentBalance();
    }
    
    if (amount > currentBalance) {
        alert("Insufficient funds! Current balance: $" + currentBalance.toFixed(2));
        return;
    }
    
    const withdrawalData = {
        amount: amount,
        date: today
    };
    
    // Use tradeManager (new system) which handles Supabase
    let withdrawal;
    if (window.tradeManager) {
        withdrawal = window.tradeManager.addWithdrawal(amount, today);
        saveWithdrawalToSupabase(withdrawal);
    } else {
        // Fallback - save to Supabase only
        withdrawal = { ...withdrawalData, id: Date.now() };
        withdrawals.push(withdrawal);
        saveWithdrawalToSupabase(withdrawal);
    }
    
    console.log('💸 Withdrawal added:', withdrawalData);
    
    // ✅ INSTANT UI UPDATE
    updateAccountSizeUI();
    
    document.getElementById("withdrawal-amount").value = "";
    
    // Schedule heavy updates
    updateAccountSize();
    
    showNotification(`Withdrawal of $${amount.toFixed(2)} processed successfully!`, 'success');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#38bdf8'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease-in-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function openTransactionHistoryModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('transaction-history-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'transaction-history-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
                border-radius: 16px;
                padding: 30px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                border: 1px solid rgba(56, 189, 248, 0.2);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #38bdf8; margin: 0; font-size: 1.5rem;">📋 Transaction History</h2>
                    <button onclick="document.getElementById('transaction-history-modal').remove()" style="
                        background: none;
                        border: none;
                        color: #94a3b8;
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                    ">×</button>
                </div>
                <div id="modal-transaction-list" style="max-height: 60vh; overflow-y: auto;"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Populate the transaction list
    populateModalTransactionList();
    modal.style.display = 'flex';
}

function populateModalTransactionList() {
    const listContainer = document.getElementById('modal-transaction-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    // Combine all transactions
    const allTransactions = [
        ...trades.map(t => ({ date: t.date, amount: t.result, type: 'trade', pair: t.pair })),
        ...deposits.map(d => ({ date: d.date, amount: d.amount, type: 'deposit' })),
        ...withdrawals.map(w => ({ date: w.date, amount: w.amount, type: 'withdrawal' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (allTransactions.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #94a3b8;">No transactions yet</p>';
        return;
    }
    
    allTransactions.forEach((tx) => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 15px;
            background: rgba(15, 23, 42, 0.6);
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 4px solid ${tx.type === 'trade' ? (tx.amount >= 0 ? '#10b981' : '#ef4444') : tx.type === 'deposit' ? '#10b981' : '#ef4444'};
        `;
        
        let icon = '📋';
        let color = '#94a3b8';
        let displayAmount = tx.amount.toFixed(2);
        let title = tx.type.toUpperCase();
        
        if (tx.type === 'trade') {
            color = tx.amount >= 0 ? '#10b981' : '#ef4444';
            icon = tx.amount >= 0 ? '✅' : '❌';
            displayAmount = (tx.amount >= 0 ? '+' : '') + tx.amount.toFixed(2);
            title = `${icon} TRADE - ${tx.pair}`;
        } else if (tx.type === 'deposit') {
            color = '#10b981';
            icon = '💰';
            displayAmount = '+' + tx.amount.toFixed(2);
            title = '💰 DEPOSIT';
        } else if (tx.type === 'withdrawal') {
            color = '#ef4444';
            icon = '💸';
            displayAmount = '-' + tx.amount.toFixed(2);
            title = '💸 WITHDRAWAL';
        }
        
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div>
                    <div style="font-weight: bold; color: ${color}; font-size: 1rem;">${title}</div>
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 4px;">${tx.date}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: bold; color: ${color}; font-size: 1.2rem;">$${displayAmount}</div>
                </div>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('transaction-history-modal');
    if (modal && e.target === modal) {
        modal.remove();
    }
});

// Dashboard Stats Functions
function updateDashboardStats() {
    const totalTrades = trades.length;
    const totalPL = trades.reduce((sum, t) => sum + t.result, 0);
    const avgTrade = totalTrades > 0 ? (totalPL / totalTrades).toFixed(2) : 0;

    document.getElementById("totalTrades").textContent = totalTrades;
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

    // ✅ OPTIMIZATION: Only recalculate if trades have changed
    // Store previous trade count to avoid unnecessary updates
    const currentTradeCount = trades.length;
    
    if (!updateCharts.lastTradeCount) {
        updateCharts.lastTradeCount = currentTradeCount;
    }
    
    // Skip update if trade count hasn't changed (means we're updating other UI)
    // This is safe because addTrade() always increases the count
    const tradeCountChanged = updateCharts.lastTradeCount !== currentTradeCount;
    
    if (!tradeCountChanged && chartData && chartData.length === currentTradeCount) {
        // Chart is already up-to-date
        return;
    }
    
    updateCharts.lastTradeCount = currentTradeCount;

    // Account Profit/Loss Chart
    let accountBalance = 0;
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    const chartLabels = sortedTrades.map((t, idx) => `Trade ${idx + 1}`);
    const chartData = sortedTrades.map(t => {
        accountBalance += Number(t.result) || 0;
        return accountBalance;
    });

    accountProfitLossChart.data.labels = chartLabels;
    accountProfitLossChart.data.datasets[0].data = chartData;
    
    // ✅ OPTIMIZATION: Use more efficient update options
    accountProfitLossChart.update('none');  // 'none' = fastest update, no animation
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
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// ============================================================
// OPTIMIZED ACCOUNT SIZE TRACKING
// ============================================================

// Debounce timer for heavy UI updates
let updateDebounceTimer = null;

/**
 * Calculate current balance (lightweight, pure calculation)
 * No DOM manipulation - returns value only
 * FORMULA: balance = starting + deposits - withdrawals + trades.PnL
 */
function calculateCurrentBalance() {
    const totalPL = trades.reduce((sum, t) => {
        // Use profit_loss if available, fall back to result
        const pnl = Number(t.profit_loss !== undefined ? t.profit_loss : (t.result || 0));
        return sum + pnl;
    }, 0);
    
    const totalDeposits = deposits.reduce((sum, d) => {
        const amount = Number(d.amount) || 0;
        return sum + amount;
    }, 0);
    
    const totalWithdrawals = withdrawals.reduce((sum, w) => {
        const amount = Number(w.amount) || 0;
        return sum + amount;
    }, 0);
    
    return Number(STARTING_BALANCE) + totalDeposits - totalWithdrawals + totalPL;
}

/**
 * Update balance in UI immediately (FAST - critical path)
 * This is called on transaction submit for instant feedback
 */
function updateAccountSizeUI() {
    const currentBalance = calculateCurrentBalance();
    
    // ✅ IMMEDIATE DOM UPDATE - Only update what changed
    const headerBalance = document.getElementById('currentBalance');
    if (headerBalance) {
        headerBalance.textContent = '$' + currentBalance.toFixed(2);
        headerBalance.style.color = currentBalance >= STARTING_BALANCE ? '#10b981' : '#ef4444';
    }
    
    // ✅ FIRE-AND-FORGET to Supabase (async, non-blocking)
    updateUserBalanceInSupabase(currentBalance);
    
    console.log('✅ Account Balance Updated - Current Balance: $' + currentBalance.toFixed(2));
}

/**
 * Update heavy UI elements (deferred)
 * Called from within requestIdleCallback or after short delay
 * These don't need to be instant - users don't expect them to be
 */
function updateHeavyUIElements() {
    // Update transaction history display
    displayTransactionHistory();
    
    // Update dashboard stats
    updateDashboardStats();
    
    // Update charts
    updateCharts();
    
    // Update trades display
    displayTrades();
}

/**
 * Optimized account size update with debouncing
 * CRITICAL PATH: Updates balance immediately, defers heavy operations
 */
function updateAccountSize() {
    // ✅ PHASE 1: Update balance display immediately (fast)
    updateAccountSizeUI();
    
    // ✅ PHASE 2: Schedule heavy UI updates for idle time (deferred)
    // Clear existing timer to debounce rapid transactions
    if (updateDebounceTimer) {
        clearTimeout(updateDebounceTimer);
    }
    
    // Use requestIdleCallback if available (waits for idle time)
    // Fall back to setTimeout(0) for better browser compatibility
    if (typeof requestIdleCallback !== 'undefined') {
        updateDebounceTimer = requestIdleCallback(() => {
            updateHeavyUIElements();
            updateDebounceTimer = null;
        }, { timeout: 500 });
    } else {
        // Fallback: Defer with setTimeout for at least 50ms
        // This gives browser time to process other events
        updateDebounceTimer = setTimeout(() => {
            updateHeavyUIElements();
            updateDebounceTimer = null;
        }, 50);
    }
}

function displayTransactionHistory() {
    const historyContainer = document.getElementById('accountSizeHistory');
    if (!historyContainer) return;
    
    // Combine all transactions
    const allTransactions = [
        ...trades.map(t => ({ date: t.date, amount: t.result, type: 'trade', pair: t.pair })),
        ...deposits.map(d => ({ date: d.date, amount: d.amount, type: 'deposit' })),
        ...withdrawals.map(w => ({ date: w.date, amount: w.amount, type: 'withdrawal' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (allTransactions.length === 0) {
        historyContainer.innerHTML = '<p style="text-align: center; color: #94a3b8;">No transactions yet</p>';
        return;
    }
    
    // ✅ OPTIMIZATION: Use DocumentFragment for batch DOM operations (single reflow)
    const fragment = document.createDocumentFragment();
    
    allTransactions.forEach((tx) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'transaction-item';
        let color = '#94a3b8';
        let icon = '📋';
        let displayAmount = tx.amount.toFixed(2);
        
        if (tx.type === 'trade') {
            color = tx.amount >= 0 ? '#10b981' : '#ef4444';
            icon = tx.amount >= 0 ? '✅' : '❌';
            displayAmount = (tx.amount >= 0 ? '+' : '') + tx.amount.toFixed(2);
        } else if (tx.type === 'deposit') {
            color = '#10b981';
            icon = '💰';
            displayAmount = '+' + tx.amount.toFixed(2);
        } else if (tx.type === 'withdrawal') {
            color = '#ef4444';
            icon = '💸';
            displayAmount = '-' + tx.amount.toFixed(2);
        }
        
        historyItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(15, 23, 42, 0.6); border-radius: 8px; margin-bottom: 8px;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: ${color};">${icon} ${tx.type.toUpperCase()}${tx.pair ? ' - ' + tx.pair : ''}</div>
                    <div style="font-size: 0.85rem; color: #94a3b8;">${tx.date}</div>
                </div>
                <div style="text-align: right; font-weight: bold; color: ${color}; font-size: 1.1rem;">$${displayAmount}</div>
            </div>
        `;
        
        fragment.appendChild(historyItem);
    });
    
    // ✅ OPTIMIZATION: Clear and append all at once (single reflow, not N+1)
    historyContainer.innerHTML = '';
    historyContainer.appendChild(fragment);
}

function displayTrades() {
    const tradesContainer = document.getElementById("trades-container") || document.getElementById("trades");

    const filteredTrades = selectedDate
        ? trades.filter(trade => trade.date === selectedDate)
        : trades;

    document.getElementById("selectedDateLabel").textContent = selectedDate
        ? `Trades for ${selectedDate}`
        : "All Trades";

    if (filteredTrades.length === 0) {
        tradesContainer.innerHTML = '';
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

    // ✅ OPTIMIZATION: Use DocumentFragment to batch DOM operations
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < filteredTrades.length; i++) {
        const trade = filteredTrades[i];
        const tradeIndex = trades.indexOf(trade);
        const tradeCard = document.createElement("div");
        tradeCard.classList.add("trade-card");

        const tradeInfo = document.createElement("div");
        tradeInfo.classList.add("trade-info");
        
        // Use profit_loss if available, fall back to result
        const pnl = trade.profit_loss !== undefined ? trade.profit_loss : trade.result;
        const resultColor = Number(pnl) > 0 ? '#10b981' : '#ef4444';
        const resultSign = Number(pnl) > 0 ? '+' : '';
        
        tradeInfo.innerHTML = `
            <h2>${trade.pair}</h2>
            <p><strong>P&L:</strong> <span style="color: ${resultColor}; font-weight: bold;">${resultSign}$${Number(pnl).toFixed(2)}</span></p>
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
        
        fragment.appendChild(tradeCard);
    }
    
    // ✅ OPTIMIZATION: Clear and append all at once (single reflow, not N+1)
    tradesContainer.innerHTML = '';
    tradesContainer.appendChild(fragment);
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
        // Use tradeManager if available (new system)
        if (window.tradeManager && trades[index]) {
            const tradeId = trades[index].id;
            window.tradeManager.deleteTrade(tradeId);
            deleteTradeFromSupabase(tradeId);
        } else {
            // Fallback for old system
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
}

// Initialize AI News on page load
window.addEventListener('load', () => {
    generateAINews();
});
function upgradeAccount() {
    document.getElementById("aiNewsPanel").classList.add("active");
    alert("✨ Premium Activated! AI News Analysis unlocked!");
}