// --- DOM Elements ---
const form = document.getElementById('transactionForm');
const transactionIdInput = document.getElementById('transactionId');
const typeRadios = document.getElementsByName('type');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');

const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const filterDateStart = document.getElementById('filterDateStart');
const filterDateEnd = document.getElementById('filterDateEnd');

const listEl = document.getElementById('transactionList');
const emptyStateEl = document.getElementById('emptyState');

const importBtn = document.getElementById('importBtn');
const csvFileInput = document.getElementById('csvFile');
const exportCsvBtn = document.getElementById('exportCsvBtn');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    dateInput.valueAsDate = new Date();
    updateCategories();
    populateFilterCategories();
    renderTransactionList();

    typeRadios.forEach(radio => radio.addEventListener('change', updateCategories));
    form.addEventListener('submit', handleAddOrUpdateTransaction);
    cancelBtn.addEventListener('click', resetForm);

    [searchInput, filterCategory, filterDateStart, filterDateEnd].forEach(el => {
        el.addEventListener('input', renderTransactionList);
    });

    importBtn.addEventListener('click', () => csvFileInput.click());
    csvFileInput.addEventListener('change', handleCsvImport);
    exportCsvBtn.addEventListener('click', handleCsvExport);
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

function populateFilterCategories() {
    const allCats = [...defaultCategories.expense, ...defaultCategories.income];
    const uniqueCats = [...new Set(allCats)];

    filterCategory.innerHTML = '<option value="">All Categories</option>';
    uniqueCats.sort().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        filterCategory.appendChild(option);
    });
}

function handleAddOrUpdateTransaction(e) {
    e.preventDefault();

    const id = transactionIdInput.value;
    const type = Array.from(typeRadios).find(r => r.checked).value;
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    const date = dateInput.value;
    const description = descriptionInput.value.trim();

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    if (id) {
        // Update
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], type, amount, category, date, description };
        }
    } else {
        // Add
        const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2);
        transactions.push({ id: newId, type, amount, category, date, description, timestamp: Date.now() });
    }

    saveTransactions();
    resetForm();
    renderTransactionList();
}

function editTransaction(id) {
    const t = transactions.find(t => t.id === id);
    if (!t) return;

    transactionIdInput.value = t.id;
    Array.from(typeRadios).find(r => r.value === t.type).checked = true;
    updateCategories();
    amountInput.value = t.amount;
    categorySelect.value = t.category;
    dateInput.value = t.date;
    descriptionInput.value = t.description;

    formTitle.innerHTML = `<i class="ph ph-note-pencil"></i> Edit Transaction`;
    submitBtn.textContent = 'Update Transaction';
    cancelBtn.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        renderTransactionList();
    }
}

function resetForm() {
    form.reset();
    transactionIdInput.value = '';
    dateInput.valueAsDate = new Date();
    updateCategories();
    formTitle.innerHTML = `<i class="ph ph-plus-circle"></i> Add Transaction`;
    submitBtn.textContent = 'Add Transaction';
    cancelBtn.classList.add('hidden');
}

function renderTransactionList() {
    const searchTerm = searchInput.value.toLowerCase();
    const catFilter = filterCategory.value;
    const startDate = filterDateStart.value;
    const endDate = filterDateEnd.value;

    const filtered = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm) || t.category.toLowerCase().includes(searchTerm);
        const matchesCat = !catFilter || t.category === catFilter;
        const matchesDate = (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate);
        return matchesSearch && matchesCat && matchesDate;
    });

    listEl.innerHTML = '';

    if (filtered.length === 0) {
        listEl.parentElement.classList.add('hidden');
        emptyStateEl.classList.remove('hidden');
        return;
    }

    listEl.parentElement.classList.remove('hidden');
    emptyStateEl.classList.add('hidden');

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date) || b.timestamp - a.timestamp)
        .forEach(t => {
            const tr = document.createElement('tr');
            tr.className = 'border-b dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition';

            const amountClass = t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-800 dark:text-gray-200';
            const prefix = t.type === 'income' ? '+' : '-';

            const dateObj = new Date(t.date + 'T00:00:00');
            const dateString = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

            // Using separate elements and textContent for safety
            const tdDate = document.createElement('td');
            tdDate.className = 'py-3 whitespace-nowrap';
            tdDate.textContent = dateString;

            const tdDesc = document.createElement('td');
            tdDesc.className = 'py-3 truncate max-w-[150px] font-medium text-gray-800 dark:text-gray-200';
            tdDesc.textContent = t.description || '-';

            const tdCat = document.createElement('td');
            tdCat.className = 'py-3 whitespace-nowrap';
            const catBadge = document.createElement('span');
            catBadge.className = 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs';
            catBadge.textContent = t.category;
            tdCat.appendChild(catBadge);

            const tdAmount = document.createElement('td');
            tdAmount.className = `py-3 text-right whitespace-nowrap ${amountClass}`;
            tdAmount.textContent = `${prefix}${formatCurrency(t.amount)}`;

            const tdAction = document.createElement('td');
            tdAction.className = 'py-3 text-center whitespace-nowrap';

            const editBtn = document.createElement('button');
            editBtn.className = 'text-gray-400 hover:text-indigo-600 transition p-1';
            editBtn.title = 'Edit';
            editBtn.innerHTML = '<i class="ph ph-note-pencil text-lg"></i>';
            editBtn.onclick = () => editTransaction(t.id);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'text-gray-400 hover:text-rose-600 transition p-1';
            deleteBtn.title = 'Delete';
            deleteBtn.innerHTML = '<i class="ph ph-trash text-lg"></i>';
            deleteBtn.onclick = () => deleteTransaction(t.id);

            tdAction.appendChild(editBtn);
            tdAction.appendChild(deleteBtn);

            tr.appendChild(tdDate);
            tr.appendChild(tdDesc);
            tr.appendChild(tdCat);
            tr.appendChild(tdAmount);
            tr.appendChild(tdAction);

            listEl.appendChild(tr);
        });
}

// --- CSV Import/Export ---
function handleCsvExport() {
    if (transactions.length === 0) {
        alert("No transactions to export.");
        return;
    }

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];
    const rows = transactions.map(t => [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.category,
        t.amount,
        t.type
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleCsvImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const text = event.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',');

        let importedCount = 0;
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const parts = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (parts.length < 5) continue;

            const [date, description, category, amount, type] = parts;

            transactions.push({
                id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2),
                date: date.trim(),
                description: description.trim().replace(/^"|"$/g, '').replace(/""/g, '"'),
                category: category.trim(),
                amount: parseFloat(amount),
                type: type.trim().toLowerCase(),
                timestamp: Date.now()
            });
            importedCount++;
        }

        if (importedCount > 0) {
            saveTransactions();
            renderTransactionList();
            alert(`Successfully imported ${importedCount} transactions.`);
        } else {
            alert("No valid transactions found in the CSV.");
        }
        csvFileInput.value = '';
    };
    reader.readAsText(file);
}
