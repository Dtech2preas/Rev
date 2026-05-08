// --- State ---
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

const defaultCategories = {
    expense: ['Food & Dining', 'Rent & Utilities', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare', 'Other'],
    income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other']
};

// --- DOM Elements ---
let expenseChartInstance = null;

const form = document.getElementById('transactionForm');
const typeRadios = document.getElementsByName('type');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');

const totalBalanceEl = document.getElementById('totalBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Set default date to today
    dateInput.valueAsDate = new Date();

    // Initialize categories based on default selected type
    updateCategories();

    // Listen for type changes to update categories
    typeRadios.forEach(radio => {
        radio.addEventListener('change', updateCategories);
    });

    // Handle form submission
    form.addEventListener('submit', handleAddTransaction);

    // Handle Export
    document.getElementById('exportBtn').addEventListener('click', handleExport);

    // Initial render
    updateDashboard();
    renderTransactionList();
    updateChart();
});

// --- Logic ---
function updateCategories() {
    const selectedType = Array.from(typeRadios).find(r => r.checked).value;
    const categories = defaultCategories[selectedType];

    categorySelect.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
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

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function updateChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    const noChartData = document.getElementById('noChartData');

    // Calculate expenses by category
    const expensesByCategory = {};
    let hasExpenses = false;

    transactions.forEach(t => {
        if (t.type === 'expense') {
            hasExpenses = true;
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        }
    });

    if (!hasExpenses) {
        if (expenseChartInstance) {
            expenseChartInstance.destroy();
            expenseChartInstance = null;
        }
        ctx.style.display = 'none';
        noChartData.classList.remove('hidden');
        return;
    }

    ctx.style.display = 'block';
    noChartData.classList.add('hidden');

    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);

    // Pre-defined color palette
    const bgColors = [
        '#ef4444', // red-500
        '#f97316', // orange-500
        '#f59e0b', // amber-500
        '#84cc16', // lime-500
        '#10b981', // emerald-500
        '#06b6d4', // cyan-500
        '#3b82f6', // blue-500
        '#6366f1', // indigo-500
        '#8b5cf6', // violet-500
        '#d946ef'  // fuchsia-500
    ];

    if (expenseChartInstance) {
        expenseChartInstance.data.labels = labels;
        expenseChartInstance.data.datasets[0].data = data;
        expenseChartInstance.update();
    } else {
        expenseChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: bgColors.slice(0, labels.length),
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}

function handleAddTransaction(e) {
    e.preventDefault();

    const type = Array.from(typeRadios).find(r => r.checked).value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = categorySelect.value;
    const date = dateInput.value;
    const description = document.getElementById('description').value.trim();

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    // Generate an ID (fallback for randomUUID in some webview environments)
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString() + Math.random().toString(36).substring(2);

    const transaction = {
        id,
        type,
        amount,
        category,
        date,
        description,
        timestamp: new Date().getTime() // for sorting
    };

    transactions.push(transaction);
    saveTransactions();

    // Reset form fields
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    dateInput.valueAsDate = new Date();

    // Update UI
    updateDashboard();
    renderTransactionList();
    if (typeof updateChart === 'function') updateChart();
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();

    updateDashboard();
    renderTransactionList();
    if (typeof updateChart === 'function') updateChart();
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function updateDashboard() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    // Formatting currency
    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    totalBalanceEl.textContent = formatCurrency(balance);
    totalIncomeEl.textContent = `+${formatCurrency(income)}`;
    totalExpensesEl.textContent = `-${formatCurrency(expenses)}`;

    // Optional: adjust balance color based on positive/negative
    if (balance < 0) {
        totalBalanceEl.classList.remove('text-gray-800');
        totalBalanceEl.classList.add('text-rose-600');
    } else {
        totalBalanceEl.classList.remove('text-rose-600');
        totalBalanceEl.classList.add('text-gray-800');
    }
}

function renderTransactionList() {
    const listEl = document.getElementById('transactionList');
    const emptyStateEl = document.getElementById('emptyState');

    listEl.innerHTML = '';

    if (transactions.length === 0) {
        listEl.parentElement.classList.add('hidden');
        emptyStateEl.classList.remove('hidden');
        return;
    }

    listEl.parentElement.classList.remove('hidden');
    emptyStateEl.classList.add('hidden');

    // Sort transactions by date (newest first), then by timestamp
    const sortedTransactions = [...transactions].sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        return b.timestamp - a.timestamp;
    });

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    sortedTransactions.forEach(t => {
        const tr = document.createElement('tr');
        tr.className = 'border-b last:border-b-0 hover:bg-gray-50 transition';

        const amountClass = t.type === 'income' ? 'text-emerald-600 font-medium' : 'text-gray-800';
        const prefix = t.type === 'income' ? '+' : '-';

        // Format date simply
        const dateObj = new Date(t.date + 'T00:00:00'); // Prevent timezone issues
        const dateString = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        // Safe HTML construction to prevent XSS

        const tdDate = document.createElement('td');
        tdDate.className = 'py-3 whitespace-nowrap';
        tdDate.textContent = dateString;
        tr.appendChild(tdDate);

        const tdDesc = document.createElement('td');
        tdDesc.className = 'py-3 truncate max-w-[150px] font-medium text-gray-800';
        tdDesc.textContent = t.description || '-';
        tr.appendChild(tdDesc);

        const tdCat = document.createElement('td');
        tdCat.className = 'py-3 whitespace-nowrap';
        tdCat.innerHTML = `<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"></span>`;
        tdCat.querySelector('span').textContent = t.category;
        tr.appendChild(tdCat);

        const tdAmount = document.createElement('td');
        tdAmount.className = `py-3 text-right whitespace-nowrap ${amountClass}`;
        tdAmount.textContent = `${prefix}${formatCurrency(t.amount)}`;
        tr.appendChild(tdAmount);

        const tdAction = document.createElement('td');
        tdAction.className = 'py-3 text-center';
        tdAction.innerHTML = `
            <button class="text-gray-400 hover:text-rose-600 transition" title="Delete">
                <i class="ph ph-trash text-lg"></i>
            </button>
        `;
        tdAction.querySelector('button').addEventListener('click', () => deleteTransaction(t.id));
        tr.appendChild(tdAction);

        listEl.appendChild(tr);
    });
}
