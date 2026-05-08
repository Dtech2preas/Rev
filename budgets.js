// --- State ---
let budgets = JSON.parse(localStorage.getItem('budgets')) || [];
let goals = JSON.parse(localStorage.getItem('goals')) || [];
let recurring = JSON.parse(localStorage.getItem('recurring')) || [];

// --- DOM Elements ---
const budgetsGrid = document.getElementById('budgetsGrid');
const goalsGrid = document.getElementById('goalsGrid');
const recurringList = document.getElementById('recurringList');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    renderBudgets();
    renderGoals();
    renderRecurring();

    document.getElementById('addBudgetBtn').addEventListener('click', () => showBudgetModal());
    document.getElementById('addGoalBtn').addEventListener('click', () => showGoalModal());
    document.getElementById('addRecurringBtn').addEventListener('click', () => showRecurringModal());
});

// --- Storage ---
function saveBudgets() { localStorage.setItem('budgets', JSON.stringify(budgets)); }
function saveGoals() { localStorage.setItem('goals', JSON.stringify(goals)); }
function saveRecurring() { localStorage.setItem('recurring', JSON.stringify(recurring)); }

// --- Budgets ---
function renderBudgets() {
    budgetsGrid.innerHTML = '';

    // Calculate spending for current month per category
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM

    const spendingByCategory = {};
    transactions.forEach(t => {
        if (t.type === 'expense' && t.date.startsWith(currentMonth)) {
            spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
        }
    });

    if (budgets.length === 0) {
        budgetsGrid.innerHTML = '<p class="text-gray-400 col-span-full py-4 text-center">No budgets set yet.</p>';
    }

    budgets.forEach(budget => {
        const spent = spendingByCategory[budget.category] || 0;
        const percent = Math.min((spent / budget.amount) * 100, 100);
        const colorClass = percent >= 100 ? 'bg-rose-500' : percent > 85 ? 'bg-amber-500' : 'bg-indigo-600';

        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700';

        // Use textContent for safety
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex justify-between items-start mb-2';

        const titleDiv = document.createElement('div');
        const h3 = document.createElement('h3');
        h3.className = 'font-bold text-gray-800 dark:text-gray-100';
        h3.textContent = budget.category;
        const pSub = document.createElement('p');
        pSub.className = 'text-xs text-gray-500 dark:text-gray-400';
        pSub.textContent = 'Monthly Budget';
        titleDiv.appendChild(h3);
        titleDiv.appendChild(pSub);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-gray-400 hover:text-rose-600 transition';
        deleteBtn.innerHTML = '<i class="ph ph-trash"></i>';
        deleteBtn.onclick = () => deleteBudget(budget.id);

        headerDiv.appendChild(titleDiv);
        headerDiv.appendChild(deleteBtn);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex justify-between items-end mb-1';
        infoDiv.innerHTML = `
            <span class="text-sm font-medium ${spent > budget.amount ? 'text-rose-600' : 'text-gray-700 dark:text-gray-300'}">${formatCurrency(spent)}</span>
            <span class="text-xs text-gray-400">of ${formatCurrency(budget.amount)}</span>
        `;

        const progressContainer = document.createElement('div');
        progressContainer.className = 'w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2';
        const progressBar = document.createElement('div');
        progressBar.className = `${colorClass} h-2 rounded-full transition-all`;
        progressBar.style.width = `${percent}%`;
        progressContainer.appendChild(progressBar);

        card.appendChild(headerDiv);
        card.appendChild(infoDiv);
        card.appendChild(progressContainer);

        budgetsGrid.appendChild(card);
    });
}

function showBudgetModal() {
    const category = prompt("Enter category (e.g., Food & Dining):");
    if (!category) return;
    const amount = parseFloat(prompt("Enter monthly budget amount:"));
    if (isNaN(amount) || amount <= 0) return;

    const id = Date.now().toString();
    budgets.push({ id, category, amount });
    saveBudgets();
    renderBudgets();
}

function deleteBudget(id) {
    if (confirm('Delete this budget?')) {
        budgets = budgets.filter(b => b.id !== id);
        saveBudgets();
        renderBudgets();
    }
}

// --- Savings Goals ---
function renderGoals() {
    goalsGrid.innerHTML = '';
    if (goals.length === 0) {
        goalsGrid.innerHTML = '<p class="text-gray-400 col-span-full py-4 text-center">No savings goals yet.</p>';
    }

    goals.forEach(goal => {
        const percent = Math.min((goal.current / goal.target) * 100, 100);

        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex justify-between items-start mb-2';

        const h3 = document.createElement('h3');
        h3.className = 'font-bold text-gray-800 dark:text-gray-100';
        h3.textContent = goal.name;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex gap-2';

        const addBtn = document.createElement('button');
        addBtn.className = 'text-indigo-600 hover:text-indigo-800 transition';
        addBtn.title = 'Add Funds';
        addBtn.innerHTML = '<i class="ph ph-plus-circle text-lg"></i>';
        addBtn.onclick = () => updateGoalProgress(goal.id);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-gray-400 hover:text-rose-600 transition';
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = '<i class="ph ph-trash text-lg"></i>';
        deleteBtn.onclick = () => deleteGoal(goal.id);

        actionsDiv.appendChild(addBtn);
        actionsDiv.appendChild(deleteBtn);
        headerDiv.appendChild(h3);
        headerDiv.appendChild(actionsDiv);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex justify-between items-end mb-1';
        infoDiv.innerHTML = `
            <span class="text-sm font-medium text-indigo-600 dark:text-indigo-400">${formatCurrency(goal.current)}</span>
            <span class="text-xs text-gray-400">target: ${formatCurrency(goal.target)}</span>
        `;

        const progressContainer = document.createElement('div');
        progressContainer.className = 'w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5';
        const progressBar = document.createElement('div');
        progressBar.className = 'bg-emerald-500 h-2.5 rounded-full transition-all';
        progressBar.style.width = `${percent}%`;
        progressContainer.appendChild(progressBar);

        const percentText = document.createElement('p');
        percentText.className = 'text-[10px] text-right mt-1 text-gray-400';
        percentText.textContent = `${Math.round(percent)}% Complete`;

        card.appendChild(headerDiv);
        card.appendChild(infoDiv);
        card.appendChild(progressContainer);
        card.appendChild(percentText);

        goalsGrid.appendChild(card);
    });
}

function showGoalModal() {
    const name = prompt("What are you saving for?");
    if (!name) return;
    const target = parseFloat(prompt("Enter target amount:"));
    if (isNaN(target) || target <= 0) return;
    const current = parseFloat(prompt("Current savings for this goal (optional):") || "0");

    const id = Date.now().toString();
    goals.push({ id, name, target, current: isNaN(current) ? 0 : current });
    saveGoals();
    renderGoals();
}

function updateGoalProgress(id) {
    const amount = parseFloat(prompt("Enter amount to add to this goal:"));
    if (isNaN(amount)) return;

    const goal = goals.find(g => g.id === id);
    if (goal) {
        goal.current += amount;
        saveGoals();
        renderGoals();
    }
}

function deleteGoal(id) {
    if (confirm('Delete this goal?')) {
        goals = goals.filter(g => g.id !== id);
        saveGoals();
        renderGoals();
    }
}

// --- Recurring Transactions ---
function renderRecurring() {
    recurringList.innerHTML = '';
    if (recurring.length === 0) {
        recurringList.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-gray-400">No recurring transactions defined.</td></tr>';
        return;
    }

    recurring.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = 'border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50';

        const tdDesc = document.createElement('td');
        tdDesc.className = 'p-3';
        const descDiv = document.createElement('div');
        descDiv.className = 'font-medium text-gray-800 dark:text-gray-100';
        descDiv.textContent = r.description;
        const catDiv = document.createElement('div');
        catDiv.className = 'text-xs text-gray-500';
        catDiv.textContent = r.category;
        tdDesc.appendChild(descDiv);
        tdDesc.appendChild(catDiv);

        const tdFreq = document.createElement('td');
        tdFreq.className = 'p-3 text-sm text-gray-600 dark:text-gray-400 capitalize';
        tdFreq.textContent = r.frequency;

        const tdAmount = document.createElement('td');
        tdAmount.className = `p-3 text-right font-medium ${r.type === 'income' ? 'text-emerald-600' : 'text-gray-800 dark:text-gray-200'}`;
        tdAmount.textContent = `${r.type === 'income' ? '+' : '-'}${formatCurrency(r.amount)}`;

        const tdAction = document.createElement('td');
        tdAction.className = 'p-3 text-center';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-gray-400 hover:text-rose-600 transition';
        deleteBtn.innerHTML = '<i class="ph ph-trash text-lg"></i>';
        deleteBtn.onclick = () => deleteRecurring(r.id);
        tdAction.appendChild(deleteBtn);

        tr.appendChild(tdDesc);
        tr.appendChild(tdFreq);
        tr.appendChild(tdAmount);
        tr.appendChild(tdAction);

        recurringList.appendChild(tr);
    });
}

function showRecurringModal() {
    const desc = prompt("Description:");
    if (!desc) return;
    const type = prompt("Type (income/expense):").toLowerCase();
    if (type !== 'income' && type !== 'expense') return;
    const amount = parseFloat(prompt("Amount:"));
    if (isNaN(amount)) return;
    const cat = prompt("Category:");
    const freq = prompt("Frequency (monthly/weekly):").toLowerCase();
    if (freq !== 'monthly' && freq !== 'weekly') return;

    const id = Date.now().toString();
    recurring.push({
        id,
        description: desc,
        type,
        amount,
        category: cat || 'Other',
        frequency: freq,
        lastProcessed: new Date().toISOString().slice(0, 10)
    });
    saveRecurring();
    renderRecurring();
}

function deleteRecurring(id) {
    if (confirm('Delete this recurring transaction?')) {
        recurring = recurring.filter(r => r.id !== id);
        saveRecurring();
        renderRecurring();
    }
}
