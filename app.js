let expenseChartInstance = null;
let incomeChartInstance = null;
let trendChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    updateCharts();
});

function updateDashboard() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    document.getElementById('totalBalance').textContent = formatCurrency(balance);
    document.getElementById('totalIncome').textContent = `+${formatCurrency(income)}`;
    document.getElementById('totalExpenses').textContent = `-${formatCurrency(expenses)}`;

    const balanceEl = document.getElementById('totalBalance');
    if (balance < 0) {
        balanceEl.classList.add('text-rose-600');
    } else {
        balanceEl.classList.remove('text-rose-600');
    }
}

function updateCharts() {
    updateBreakdownChart('expense', 'expenseChart', 'noExpenseData');
    updateBreakdownChart('income', 'incomeChart', 'noIncomeData');
    updateTrendChart();
}

function updateBreakdownChart(type, canvasId, emptyId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const emptyEl = document.getElementById(emptyId);
    const dataMap = {};
    let total = 0;

    transactions.forEach(t => {
        if (t.type === type) {
            dataMap[t.category] = (dataMap[t.category] || 0) + t.amount;
            total += t.amount;
        }
    });

    if (total === 0) {
        ctx.style.display = 'none';
        emptyEl.classList.remove('hidden');
        return;
    }

    ctx.style.display = 'block';
    emptyEl.classList.add('hidden');

    const labels = Object.keys(dataMap);
    const data = Object.values(dataMap);
    const colors = [
        '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b',
        '#10b981', '#06b6d4', '#3b82f6', '#84cc16', '#f97316'
    ];

    const chartConfig = {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 1,
                borderColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#4b5563',
                        boxWidth: 12,
                        font: { size: 10 }
                    }
                }
            }
        }
    };

    if (type === 'expense') {
        if (expenseChartInstance) expenseChartInstance.destroy();
        expenseChartInstance = new Chart(ctx, chartConfig);
    } else {
        if (incomeChartInstance) incomeChartInstance.destroy();
        incomeChartInstance = new Chart(ctx, chartConfig);
    }
}

function updateTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dailyData = Array(daysInMonth).fill(0);
    const labels = Array.from({length: daysInMonth}, (_, i) => i + 1);

    // Calculate daily net balance
    transactions.forEach(t => {
        const tDate = new Date(t.date + 'T00:00:00');
        if (tDate.getFullYear() === year && tDate.getMonth() === month) {
            const day = tDate.getDate();
            const amount = t.type === 'income' ? t.amount : -t.amount;
            dailyData[day - 1] += amount;
        }
    });

    // Cumulative balance
    let cumulative = 0;
    const trendData = dailyData.map(val => {
        cumulative += val;
        return cumulative;
    });

    if (trendChartInstance) trendChartInstance.destroy();

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Balance',
                data: trendData,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(156, 163, 175, 0.1)' },
                    ticks: {
                        color: '#9ca3af',
                        font: { size: 10 },
                        callback: (val) => '$' + val
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
