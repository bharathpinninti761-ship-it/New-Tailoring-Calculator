// Default initial data if nothing is saved in local memory yet
const defaultServices = [
    { id: "s1", name: "Saree & Fall (with lining)", price: 350 },
    { id: "s2", name: "Plain Blouse Stitched", price: 250 },
    { id: "s3", name: "Designer Blouse", price: 600 },
    { id: "s4", name: "Kurti / Kameez", price: 400 },
    { id: "s5", name: "Salwar / Pant Stitched", price: 300 }
];

// App State Management
let services = JSON.parse(localStorage.getItem('tailor_services')) || defaultServices;
let currentBill = [];
let incomeLog = JSON.parse(localStorage.getItem('tailor_income_log')) || [];

// DOM Elements
const servicesGrid = document.getElementById('services-grid');
const currentItemsList = document.getElementById('current-items-list');
const editServicesSection = document.getElementById('edit-services-section');
const editServicesList = document.getElementById('edit-services-list');
const toggleEditBtn = document.getElementById('toggle-edit-btn');
const addServiceForm = document.getElementById('add-service-form');

const discountInput = document.getElementById('discount-input');
const advanceInput = document.getElementById('advance-input');
const subtotalVal = document.getElementById('subtotal-val');
const totalVal = document.getElementById('total-val');

const saveBillBtn = document.getElementById('save-bill-btn');
const shareBillBtn = document.getElementById('share-bill-btn');
const clearCurrentBtn = document.getElementById('clear-current-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');

const incomeLogBody = document.getElementById('income-log-body');
const totalEarningsVal = document.getElementById('total-earnings-val');

// Initialize the Application
function init() {
    renderServicesPanel();
    renderEditServicesList();
    renderBill();
    renderIncomeLog();
    setupEventListeners();
}

// 1. Render the main grid interface your mom will tap on
function renderServicesPanel() {
    servicesGrid.innerHTML = '';
    services.forEach(service => {
        const div = document.createElement('div');
        div.className = 'service-tap-card';
        div.innerHTML = `
            <div class="service-info">
                <span class="service-name">${service.name}</span>
                <span class="service-price">₹${service.price}</span>
            </div>
            <div class="plus-icon">+</div>
        `;
        div.addEventListener('click', () => addItemToBill(service));
        servicesGrid.appendChild(div);
    });
}

// 2. Render the service manager panel (add/delete backend options)
function renderEditServicesList() {
    editServicesList.innerHTML = '';
    services.forEach(service => {
        const li = document.createElement('li');
        li.className = 'edit-list-item';
        li.innerHTML = `
            <span>${service.name} - <strong>₹${service.price}</strong></span>
            <button class="danger-btn text-link" style="color:red;">❌ Remove</button>
        `;
        li.querySelector('button').addEventListener('click', () => removeServiceDefinition(service.id));
        editServicesList.appendChild(li);
    });
}

// 3. Render the current working bill and perform mathematical totals
function renderBill() {
    currentItemsList.innerHTML = '';
    let subtotal = 0;

    if (currentBill.length === 0) {
        currentItemsList.innerHTML = '<li class="bill-item" style="color:var(--text-muted);">No items added yet. Tap items above.</li>';
    }

    currentBill.forEach((item, index) => {
        subtotal += item.price * item.quantity;
        const li = document.createElement('li');
        li.className = 'bill-item';
        li.innerHTML = `
            <div>
                <strong>${item.name}</strong><br>
                <small>₹${item.price} x ${item.quantity}</small>
            </div>
            <div class="item-qty-controls">
                <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
            </div>
        `;
        currentItemsList.appendChild(li);
    });

    subtotalVal.innerText = `₹${subtotal}`;
    
    // Process discount and advance inputs carefully
    const discount = parseFloat(discountInput.value) || 0;
    const advance = parseFloat(advanceInput.value) || 0;
    
    let finalBalance = subtotal - discount - advance;
    if (finalBalance < 0) finalBalance = 0; // Prevent negative bill outputs

    totalVal.innerText = `₹${finalBalance}`;
}

// 4. Render and calculate Income Logs
function renderIncomeLog() {
    incomeLogBody.innerHTML = '';
    let runningEarningsTotal = 0;

    if (incomeLog.length === 0) {
        incomeLogBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No saved items logged in income history yet.</td></tr>`;
        clearHistoryBtn.classList.add('hidden');
        totalEarningsVal.innerText = `₹0`;
        return;
    }

    clearHistoryBtn.classList.remove('hidden');

    incomeLog.forEach((log, index) => {
        // Calculate earnings sum based on total business value (subtotal minus discounts)
        runningEarningsTotal += (log.subtotal - log.discount);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${log.date}</td>
            <td style="max-width:200px; word-wrap:break-word;">${log.itemsSummary}</td>
            <td>₹${log.subtotal}</td>
            <td>₹${log.discount}</td>
            <td>₹${log.advance}</td>
            <td><strong>₹${log.balance}</strong></td>
            <td><button class="danger-btn text-link" style="color:red;">🗑️ Delete</button></td>
        `;
        tr.querySelector('button').addEventListener('click', () => deleteLogEntry(index));
        incomeLogBody.appendChild(tr);
    });

    totalEarningsVal.innerText = `₹${runningEarningsTotal}`;
}

// Application Interactivity functions
function addItemToBill(service) {
    const existingItem = currentBill.find(item => item.id === service.id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        currentBill.push({ ...service, quantity: 1 });
    }
    renderBill();
}

window.updateQty = function(index, change) {
    currentBill[index].quantity += change;
    if (currentBill[index].quantity <= 0) {
        currentBill.splice(index, 1);
    }
    renderBill();
};

function removeServiceDefinition(id) {
    services = services.filter(s => s.id !== id);
    localStorage.setItem('tailor_services', JSON.stringify(services));
    renderServicesPanel();
    renderEditServicesList();
}

function deleteLogEntry(index) {
    if (confirm("Are you sure you want to delete this receipt entry?")) {
        incomeLog.splice(index, 1);
        localStorage.setItem('tailor_income_log', JSON.stringify(incomeLog));
        renderIncomeLog();
    }
}

// Setup System Listeners
function setupEventListeners() {
    // Toggle Open/Close Edit Panel
    toggleEditBtn.addEventListener('click', () => {
        const isHidden = editServicesSection.classList.toggle('hidden');
        toggleEditBtn.innerText = isHidden ? "✏️ Edit Services" : "❌ Close Editor";
    });

    // Handle service form submission
    addServiceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('new-service-name');
        const priceInput = document.getElementById('new-service-price');

        const newService = {
            id: 'custom_' + Date.now(),
            name: nameInput.value,
            price: parseFloat(priceInput.value) || 0
        };

        services.push(newService);
        localStorage.setItem('tailor_services', JSON.stringify(services));
        
        nameInput.value = '';
        priceInput.value = '';
        
        renderServicesPanel();
        renderEditServicesList();
    });

    // Real-time calculation bindings on modifications
    discountInput.addEventListener('input', renderBill);
    advanceInput.addEventListener('input', renderBill);

    // Reset currents
    clearCurrentBtn.addEventListener('click', () => {
        currentBill = [];
        discountInput.value = 0;
        advanceInput.value = 0;
        renderBill();
    });

    // Save Bill Action
    saveBillBtn.addEventListener('click', () => {
        if (currentBill.length === 0) {
            alert("Please add at least one item to save a bill.");
            return;
        }

        let subtotal = 0;
        const summaryArr = currentBill.map(item => {
            subtotal += item.price * item.quantity;
            return `${item.name} (${item.quantity})`;
        });

        const discount = parseFloat(discountInput.value) || 0;
        const advance = parseFloat(advanceInput.value) || 0;
        let balance = subtotal - discount - advance;
        if (balance < 0) balance = 0;

        const newLog = {
            date: new Date().toLocaleDateString(),
            itemsSummary: summaryArr.join(', '),
            subtotal: subtotal,
            discount: discount,
            advance: advance,
            balance: balance
        };

        incomeLog.push(newLog);
        localStorage.setItem('tailor_income_log', JSON.stringify(incomeLog));
        
        // Reset working workspace
        currentBill = [];
        discountInput.value = 0;
        advanceInput.value = 0;
        
        renderBill();
        renderIncomeLog();
        alert("🎉 Bill successfully logged to history and saved!");
    });

    // Share Text Summary Feature
    shareBillBtn.addEventListener('click', () => {
        if (currentBill.length === 0) {
            alert("No data items generated yet to compile a text summary.");
            return;
        }
        
        let subtotal = 0;
        let textSummary = `--- Tailor Bill Receipt ---\n`;
        currentBill.forEach(item => {
            subtotal += item.price * item.quantity;
