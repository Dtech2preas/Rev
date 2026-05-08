// --- Shared State & Logic ---

// Initialize transactions
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

const defaultCategories = {
    expense: ['Food & Dining', 'Rent & Utilities', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare', 'Other'],
    income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other']
};

// --- Storage ---
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// --- Dark Mode Logic ---
function initDarkMode() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function toggleDarkMode() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

// --- Common UI Components ---
function renderHeader() {
    const header = document.querySelector('header');
    if (!header) return;

    header.className = "bg-indigo-600 dark:bg-indigo-900 text-white p-4 shadow-md sticky top-0 z-10";
    header.innerHTML = `
        <div class="max-w-4xl mx-auto flex justify-between items-center">
            <h1 class="text-xl font-bold flex items-center gap-2">
                <i class="ph ph-wallet text-2xl"></i> Finance Tracker
            </h1>
            <div class="flex items-center gap-3">
                <button id="themeToggle" class="p-2 rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-800 transition" title="Toggle Dark Mode">
                    <i class="ph ph-moon-stars text-xl dark:hidden"></i>
                    <i class="ph ph-sun text-xl hidden dark:block"></i>
                </button>
                <button id="exportBtn" class="bg-indigo-700 hover:bg-indigo-800 text-white px-3 py-1 rounded text-sm transition flex items-center gap-1">
                    <i class="ph ph-download-simple"></i> Backup
                </button>
            </div>
        </div>
    `;

    document.getElementById('themeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('exportBtn').addEventListener('click', handleExport);
}

function renderNavigation() {
    const nav = document.createElement('nav');
    nav.className = "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-6";
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const links = [
        { name: 'Dashboard', href: 'index.html', icon: 'ph-chart-pie' },
        { name: 'Transactions', href: 'transactions.html', icon: 'ph-arrows-left-right' },
        { name: 'Budgets & Goals', href: 'budgets.html', icon: 'ph-target' }
    ];

    nav.innerHTML = `
        <div class="max-w-4xl mx-auto flex overflow-x-auto">
            ${links.map(link => `
                <a href="${link.href}" class="flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                    currentPage === link.href
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }">
                    <i class="ph ${link.icon}"></i> ${link.name}
                </a>
            `).join('')}
        </div>
    `;

    const main = document.querySelector('main');
    if (main) {
        main.prepend(nav);
    }
}

function handleExport() {
    if (transactions.length === 0) {
        alert("No transactions to export.");
        return;
    }

    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function formatCurrency(val) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

// --- Recurring Transactions Processor ---
function processRecurringTransactions() {
    const recurring = JSON.parse(localStorage.getItem('recurring')) || [];
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const today = new Date();
    let updated = false;

    const newRecurring = recurring.map(r => {
        const lastDate = new Date(r.lastProcessed);
        let nextDate = new Date(lastDate);

        if (r.frequency === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (r.frequency === 'weekly') {
            nextDate.setDate(nextDate.getDate() + 7);
        }

        while (nextDate <= today) {
            const dateStr = nextDate.toISOString().slice(0, 10);
            transactions.push({
                id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2),
                type: r.type,
                amount: r.amount,
                category: r.category,
                date: dateStr,
                description: `${r.description} (Recurring)`,
                timestamp: Date.now()
            });

            lastDate.setTime(nextDate.getTime());
            if (r.frequency === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else {
                nextDate.setDate(nextDate.getDate() + 7);
            }
            updated = true;
        }

        return { ...r, lastProcessed: lastDate.toISOString().slice(0, 10) };
    });

    if (updated) {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('recurring', JSON.stringify(newRecurring));
        // Refresh local memory if on a page that uses it
        if (typeof transactions !== 'undefined') window.transactions = transactions;
    }
}

// Initialize shared components
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    processRecurringTransactions();
    renderHeader();
    renderNavigation();

    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
});
