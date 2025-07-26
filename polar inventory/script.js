// Configuration
const PASSWORD = "123";
let selectedEquipment = [];
let rentalHistory = JSON.parse(localStorage.getItem('rentalHistory')) || [];

// DOM Elements
const elements = {
  // Login
  loginContainer: document.getElementById('loginContainer'),
  mainContainer: document.getElementById('mainContainer'),
  loginBtn: document.getElementById('loginBtn'),
  passwordInput: document.getElementById('password'),
  
  // Form
  categorySelect: document.getElementById('category'),
  itemNameSelect: document.getElementById('itemName'),
  itemCodeSelect: document.getElementById('itemCode'),
  quantityInput: document.getElementById('quantity'),
  addEquipmentBtn: document.getElementById('addEquipment'),
  selectedItemsContainer: document.getElementById('selectedItems'),
  selectedPreview: document.getElementById('selectedPreview'),
  
  // Modal
  summaryModal: document.getElementById('summaryModal'),
  modalBody: document.getElementById('modalBody'),
  closeModalBtn: document.getElementById('closeModal'),
  printSummaryBtn: document.getElementById('printSummaryBtn'),
  confirmRentalBtn: document.getElementById('confirmRentalBtn'),
  
  // Buttons
  printBtn: document.getElementById('printBtn'),
  clearFormBtn: document.getElementById('clearForm'),
  submitRentalBtn: document.getElementById('submitRental')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
  // Login
  elements.loginBtn.addEventListener('click', handleLogin);
  elements.passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handleLogin();
  });

  // Form
  elements.categorySelect.addEventListener('change', handleCategoryChange);
  elements.itemNameSelect.addEventListener('change', handleItemNameChange);
  elements.addEquipmentBtn.addEventListener('click', addEquipment);
  elements.clearFormBtn.addEventListener('click', resetForm);
  elements.submitRentalBtn.addEventListener('click', showSummaryModal);

  // Modal
  elements.closeModalBtn.addEventListener('click', closeModal);
  elements.printSummaryBtn.addEventListener('click', printSummary);
  elements.confirmRentalBtn.addEventListener('click', submitRental);

  // Print Button
  elements.printBtn.addEventListener('click', printCurrentView);

  // Initialize Categories
  populateCategories();
});

// Login Function
function handleLogin() {
  if (elements.passwordInput.value === PASSWORD) {
    elements.loginContainer.style.display = 'none';
    elements.mainContainer.style.display = 'flex';
  } else {
    alert('Incorrect password. Please try again.');
    elements.passwordInput.value = '';
    elements.passwordInput.focus();
  }
}

// Equipment Selection Functions
function populateCategories() {
  const categories = [...new Set(equipmentInventory.map(item => item.category))];
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    elements.categorySelect.appendChild(option);
  });
}

function handleCategoryChange() {
  const selectedCategory = this.value;
  elements.itemNameSelect.disabled = !selectedCategory;
  elements.itemNameSelect.innerHTML = '<option value="">-- Select --</option>';

  if (selectedCategory) {
    const items = equipmentInventory
      .filter(item => item.category === selectedCategory)
      .reduce((unique, item) => {
        if (!unique.some(i => i.name === item.name)) {
          unique.push(item);
        }
        return unique;
      }, []);

    items.forEach(item => {
      const option = document.createElement('option');
      option.value = item.name;
      option.textContent = item.name;
      elements.itemNameSelect.appendChild(option);
    });
  }
}

function handleItemNameChange() {
  const selectedName = this.value;
  elements.itemCodeSelect.disabled = !selectedName;
  elements.itemCodeSelect.innerHTML = '<option value="">-- Select --</option>';

  if (selectedName && elements.categorySelect.value) {
    const codes = equipmentInventory
      .filter(item => item.category === elements.categorySelect.value && item.name === selectedName);

    codes.forEach(item => {
      const option = document.createElement('option');
      option.value = item.code;
      option.textContent = item.code;
      elements.itemCodeSelect.appendChild(option);
    });
  }
}

function addEquipment() {
  const category = elements.categorySelect.value;
  const name = elements.itemNameSelect.value;
  const code = elements.itemCodeSelect.value;
  const quantity = parseInt(elements.quantityInput.value) || 1;

  if (!category || !name || !code) {
    alert('Please select category, item, and code');
    return;
  }

  const item = equipmentInventory.find(item => 
    item.category === category && 
    item.name === name && 
    item.code === code
  );

  if (item) {
    const existingItem = selectedEquipment.find(i => i.unitId === item.unitId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      selectedEquipment.push({
        ...item,
        quantity,
        status: 'Rented'
      });
    }

    updateSelectedItemsList();
    resetItemSelection();
  }
}

function updateSelectedItemsList() {
  elements.selectedItemsContainer.innerHTML = '';
  
  if (selectedEquipment.length === 0) {
    elements.selectedPreview.style.display = 'none';
    return;
  }

  elements.selectedPreview.style.display = 'block';
  const count = selectedEquipment.reduce((sum, item) => sum + item.quantity, 0);
  elements.selectedPreview.querySelector('h3').innerHTML = `<i class="fas fa-list-check"></i> Selected Equipment (${count})`;

  selectedEquipment.forEach((item, index) => {
    const itemElement = document.createElement('div');
    itemElement.className = 'equipment-item';
    itemElement.innerHTML = `
      <div class="equipment-info">
        <strong>${item.name}</strong>
        <div>${item.unitId} | Qty: ${item.quantity} | ${item.status}</div>
      </div>
      <div class="equipment-actions">
        <button class="btn-remove" data-index="${index}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    elements.selectedItemsContainer.appendChild(itemElement);
  });

  // Add event listeners to remove buttons
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = parseInt(this.getAttribute('data-index'));
      selectedEquipment.splice(index, 1);
      updateSelectedItemsList();
    });
  });
}

function resetItemSelection() {
  elements.categorySelect.value = '';
  elements.itemNameSelect.innerHTML = '<option value="">-- Select --</option>';
  elements.itemNameSelect.disabled = true;
  elements.itemCodeSelect.innerHTML = '<option value="">-- Select --</option>';
  elements.itemCodeSelect.disabled = true;
  elements.quantityInput.value = '1';
}

function resetForm() {
  if (confirm('Are you sure you want to clear the form?')) {
    document.getElementById('rentalForm').reset();
    selectedEquipment = [];
    updateSelectedItemsList();
  }
}

// Summary Modal Functions
function showSummaryModal(e) {
  e.preventDefault();

  if (selectedEquipment.length === 0) {
    alert('Please add at least one equipment item');
    return;
  }

  const customerName = document.getElementById('customerName').value || 'Not specified';
  const rentalLocation = document.getElementById('rentalLocation').value || 'Not specified';
  const contactNumber = document.getElementById('contactNumber').value || 'Not specified';
  const operators = Array.from(document.querySelectorAll('input[name="operator"]:checked')).map(op => op.value);
  const checkOutDate = document.getElementById('checkOutDate').value;
  const checkInDate = document.getElementById('checkInDate').value;
  const notes = document.getElementById('notes').value;

  elements.modalBody.innerHTML = `
    <div class="rental-details">
      <div class="customer-info">
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Location:</strong> ${rentalLocation}</p>
        <p><strong>Contact:</strong> ${contactNumber}</p>
        <p><strong>Operators:</strong> ${operators.length > 0 ? operators.join(', ') : 'Not specified'}</p>
        <p><strong>Period:</strong> ${formatDateTime(checkOutDate)} - ${formatDateTime(checkInDate)}</p>
      </div>
      
      <table class="summary-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Unit ID</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${selectedEquipment.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.unitId}</td>
              <td>${item.category}</td>
              <td>${item.quantity}</td>
              <td>${item.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary-total">
        <strong>Total Equipment:</strong> ${selectedEquipment.reduce((sum, item) => sum + item.quantity, 0)}
      </div>
      
      <div class="summary-notes">
        <h4>Notes:</h4>
        <p>${notes || 'No notes provided'}</p>
      </div>
    </div>
  `;

  elements.summaryModal.style.display = 'flex';
}

function closeModal() {
  elements.summaryModal.style.display = 'none';
}

function printSummary() {
  window.print();
}

function submitRental() {
  const rentalData = {
    id: Date.now().toString(),
    customerName: document.getElementById('customerName').value,
    rentalLocation: document.getElementById('rentalLocation').value,
    contactNumber: document.getElementById('contactNumber').value,
    operators: Array.from(document.querySelectorAll('input[name="operator"]:checked')).map(op => op.value),
    checkOutDate: document.getElementById('checkOutDate').value,
    checkInDate: document.getElementById('checkInDate').value,
    notes: document.getElementById('notes').value,
    equipment: selectedEquipment,
    totalEquipment: selectedEquipment.reduce((sum, item) => sum + item.quantity, 0),
    timestamp: new Date().toISOString()
  };

  // Save to local storage
  rentalHistory.unshift(rentalData);
  localStorage.setItem('rentalHistory', JSON.stringify(rentalHistory));

  alert('Rental submitted successfully!');
  closeModal();
  resetForm();
}

// Utility Functions
function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'Not specified';
  const date = new Date(dateTimeString);
  return date.toLocaleString();
}

function printCurrentView() {
  if (selectedEquipment.length > 0) {
    showSummaryModal({ preventDefault: () => {} });
    setTimeout(() => {
      window.print();
      closeModal();
    }, 500);
  } else {
    alert('No equipment selected to print');
  }
}