// www/js/scripts.js

// Wait for Cordova to be ready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Cordova is ready');

    // Initialize event listeners based on the current page
    initializeEventListeners();
}

function initializeEventListeners() {
    const currentPage = getCurrentPage();

    switch(currentPage) {
        case 'index.html':
            initializeFingerprintAuth();
            break;
        case 'create_account.html':
            initializeCreateAccount();
            break;
        case 'login.html':
            initializeLogin();
            break;
        case 'dashboard.html':
            initializeDashboard();
            break;
        case 'reset_pin.html':
            initializeResetPin();
            break;
        case 'transaction_history.html':
            initializeTransactionHistory();
            break;
        default:
            console.log('No specific initialization for this page.');
    }

    // Common event listeners (e.g., logout buttons)
    initializeCommonEventListeners();
}

// Utility function to get the current page's filename
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    return page;
}

// Initialize Common Event Listeners
function initializeCommonEventListeners() {
    const logoutButtons = document.querySelectorAll('#logoutBtn, #logoutButton, #logoutBtnDashboard');
    logoutButtons.forEach(button => {
        button.addEventListener('click', logout);
    });
}

// ---------------------
// Fingerprint Authentication (index.html)
// ---------------------
function initializeFingerprintAuth() {
    const fingerprintButton = document.getElementById('fingerprint-button');
    if (fingerprintButton) {
        fingerprintButton.addEventListener('click', () => {
            console.log("Fingerprint button clicked"); // Add this line
            initiateFingerprintAuthentication();
        });
    }
}


function initiateFingerprintAuthentication() {
    FingerprintAuth.isAvailable(isAvailableSuccess, isAvailableError);
}

function isAvailableSuccess(result) {
    if (result.isAvailable) {
        // Proceed with authentication
        FingerprintAuth.show({
            clientId: "SecMob",
            clientSecret: "password", // Only necessary for Android
            disableBackup: true      // Disable fallback to PIN
        }, fingerprintSuccessCallback, fingerprintErrorCallback);
    } else {
        showAlert('Fingerprint authentication is not available on this device.', 'info');
    }
}

function isAvailableError(error) {
    console.error('Fingerprint Auth availability error:', error);
    showAlert('Error checking fingerprint authentication availability.', 'danger');
}

function fingerprintSuccessCallback(result) {
    if (result.withFingerprint) {
        // Authentication successful with fingerprint
     // Fingerprint Authentication (index.html)
// ---------------------
// Initializes fingerprint authentication on button click
function initializeFingerprintAuth() {
    const fingerprintButton = document.getElementById('fingerprint-button');
    if (fingerprintButton) {
        fingerprintButton.addEventListener('click', initiateFingerprintAuthentication);
    }
}

// Initiates the fingerprint authentication process
function initiateFingerprintAuthentication() {
    FingerprintAuth.isAvailable(isAvailableSuccess, isAvailableError);
}

// Callback function for successful availability check
function isAvailableSuccess(result) {
    if (result.isAvailable) {
        // Proceed with authentication
        FingerprintAuth.show({
            clientId: "SecMob",
            clientSecret: "password", // Only necessary for Android
            disableBackup: true      // Disable fallback to PIN
        }, fingerprintSuccessCallback, fingerprintErrorCallback);
    } else {
        showAlert('Fingerprint authentication is not available on this device.', 'info');
    }
}

// Callback function for errors in checking availability
function isAvailableError(error) {
    console.error('Fingerprint Auth availability error:', error);
    showAlert('Error checking fingerprint authentication availability.', 'danger');
}

// Callback function for successful fingerprint authentication
function fingerprintSuccessCallback(result) {
    if (result.withFingerprint) {
        // Authentication successful with fingerprint
        document.getElementById('fingerprintResult').innerHTML = `
            <p class="text-success">Fingerprint authentication successful!</p>
        `;
        const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
        fingerprintModal.show();

        // Redirect to Dashboard immediately after successful authentication
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 200); // Short timeout for quicker redirect
    } else if (result.withBackup) {
        // Authentication successful with backup (PIN, etc.)
        document.getElementById('fingerprintResult').innerHTML = `
            <p class="text-warning">Authentication successful with backup method.</p>
        `;
        const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
        fingerprintModal.show();
        
        // Redirect to Dashboard immediately after backup authentication
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 200); // Short timeout for quicker redirect
    }
}

// Callback function for errors during fingerprint authentication
function fingerprintErrorCallback(error) {
    console.error('Fingerprint Auth error:', error);
    let message = '';

    // Determine the appropriate error message
    switch (error) {
        case FingerprintAuth.ERRORS.FINGERPRINT_CANCELLED:
            message = 'Fingerprint authentication was cancelled.';
            break;
        case FingerprintAuth.ERRORS.FINGERPRINT_NOT_RECOGNIZED:
            message = 'Fingerprint not recognized. Please try again.';
            break;
        case FingerprintAuth.ERRORS.FINGERPRINT_INTERNAL_ERROR:
            message = 'Internal error during fingerprint authentication.';
            break;
        case FingerprintAuth.ERRORS.FINGERPRINT_TIMEOUT:
            message = 'Fingerprint authentication timed out.';
            break;
        default:
            message = 'Fingerprint authentication failed.';
    }

    // Display the error message in the modal
    document.getElementById('fingerprintResult').innerHTML = `
        <p class="text-danger">${message}</p>
    `;
    const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
    fingerprintModal.show();
}

// Call the initialization function on page load
document.addEventListener('DOMContentLoaded', initializeFingerprintAuth);


// ---------------------
// User Registration (create_account.html)
// ---------------------
function initializeCreateAccount() {
    const createAccountForm = document.getElementById('createAccountForm');
    if (createAccountForm) {
        createAccountForm.addEventListener('submit', handleCreateAccount);
    }
}

function handleCreateAccount(event) {
    event.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const errorMessage = document.getElementById('errorMessage');

    // Reset error message
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';

    // Validate fields
    if (!fullName || !phoneNumber || !email || !password || !confirmPassword) {
        showError('All fields are required.', errorMessage);
        return;
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
        showError('Phone number must be exactly 10 digits long.', errorMessage);
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters long.', errorMessage);
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match.', errorMessage);
        return;
    }

    // If everything is valid, create the account (send data to backend)
    createAccount(fullName, phoneNumber, email, password);
}

function showError(message, element) {
    element.textContent = message;
    element.style.display = 'block';
}

function createAccount(fullName, phoneNumber, email, password) {
    showLoading();

    fetch('https://your-backend-api.com/api/create-account', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fullName,
            phoneNumber,
            email,
            password
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            showAlert('Account created successfully! Please log in.', 'success');
            window.location.href = 'login.html';
        } else {
            showError(data.message || 'Account creation failed.', document.getElementById('errorMessage'));
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Error:', error);
        showError('An error occurred while creating your account.', document.getElementById('errorMessage'));
    });
}

// ---------------------
// User Login (login.html)
// ---------------------
function initializeLogin() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const verificationForm = document.getElementById('verificationForm');
    if (verificationForm) {
        verificationForm.addEventListener('submit', handleVerification);
    }
}

function handleLogin(event) {
    event.preventDefault();

    const phoneNumber = document.getElementById('loginPhoneNumber').value.trim();
    const email = document.getElementById('loginEmail').value.trim();
    const errorMessage = document.getElementById('loginErrorMessage');

    // Reset error message
    if (errorMessage) {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }

    // Validate fields
    if (!phoneNumber || !email) {
        if (errorMessage) {
            showError('Both phone number and email are required.', errorMessage);
        } else {
            showAlert('Both phone number and email are required.', 'danger');
        }
        return;
    }

    // Optionally, validate phone number format
    if (!/^\d{10}$/.test(phoneNumber)) {
        if (errorMessage) {
            showError('Phone number must be exactly 10 digits long.', errorMessage);
        } else {
            showAlert('Phone number must be exactly 10 digits long.', 'danger');
        }
        return;
    }

    // Send login request to backend
    login(phoneNumber, email);
}

function login(phoneNumber, email) {
    showLoading();

    fetch('https://your-backend-api.com/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            phoneNumber,
            email
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            // Assume backend sends a verification code via email
            showAlert('Verification code sent to your email.', 'success');
            // Show verification modal
            const verificationModal = new bootstrap.Modal(document.getElementById('verificationModal'));
            verificationModal.show();
        } else {
            const errorMessage = document.getElementById('loginErrorMessage');
            if (errorMessage) {
                showError(data.message || 'Login failed.', errorMessage);
            } else {
                showAlert(data.message || 'Login failed.', 'danger');
            }
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Error:', error);
        const errorMessage = document.getElementById('loginErrorMessage');
        if (errorMessage) {
            showError('An error occurred during login.', errorMessage);
        } else {
            showAlert('An error occurred during login.', 'danger');
        }
    });
}

function handleVerification(event) {
    event.preventDefault();

    const verificationCode = document.getElementById('verificationCode').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;
    const errorMessage = document.getElementById('verificationErrorMessage');

    // Reset error message
    if (errorMessage) {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }

    // Validate verification code
    if (!verificationCode) {
        if (errorMessage) {
            showError('Verification code is required.', errorMessage);
        } else {
            showAlert('Verification code is required.', 'danger');
        }
        return;
    }

    // Send verification code to backend
    verifyCode(verificationCode, rememberMe);
}

function verifyCode(code, rememberMe) {
    showLoading();

    fetch('https://your-backend-api.com/api/verify-code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            // Store authentication token and user info
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userName', data.userName);

            showAlert('Login successful!', 'success');
            window.location.href = 'dashboard.html';
        } else {
            const errorMessage = document.getElementById('verificationErrorMessage');
            if (errorMessage) {
                showError(data.message || 'Verification failed.', errorMessage);
            } else {
                showAlert(data.message || 'Verification failed.', 'danger');
            }
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Error:', error);
        const errorMessage = document.getElementById('verificationErrorMessage');
        if (errorMessage) {
            showError('An error occurred during verification.', errorMessage);
        } else {
            showAlert('An error occurred during verification.', 'danger');
        }
    });
}

// ---------------------
// Dashboard Functionalities (dashboard.html)
// ---------------------
function initializeDashboard() {
    // Event listeners for dashboard buttons are already initialized in initializeEventListeners()
    // Additional initialization if needed
}

// ---------------------
// Reset PIN (reset_pin.html)
// ---------------------
function initializeResetPin() {
    const resetPinForm = document.getElementById('resetPinForm');
    if (resetPinForm) {
        resetPinForm.addEventListener('submit', handleResetPin);
    }
}

function handleResetPin(event) {
    event.preventDefault();

    const phoneNumber = document.getElementById('resetPhoneNumber').value.trim();
    const email = document.getElementById('resetEmail').value.trim();
    const newPin = document.getElementById('newPin').value.trim();
    const errorMessage = document.getElementById('resetPinErrorMessage');

    // Reset error message
    if (errorMessage) {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }

    // Validate fields
    if (!phoneNumber || !email || !newPin) {
        showError('All fields are required.', errorMessage);
        return;
    }

    if (!/^\d{4}$/.test(newPin)) {
        showError('PIN must be exactly 4 digits long.', errorMessage);
        return;
    }

    // Send PIN reset request to backend
    resetPin(phoneNumber, email, newPin);
}

function resetPin(phoneNumber, email, newPin) {
    showLoading();

    fetch('https://your-backend-api.com/api/reset-pin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            phoneNumber,
            email,
            newPin
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            showAlert('PIN reset successfully! Please log in with your new PIN.', 'success');
            window.location.href = 'login.html';
        } else {
            showError(data.message || 'PIN reset failed.', document.getElementById('resetPinErrorMessage'));
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Error:', error);
        showError('An error occurred while resetting your PIN.', document.getElementById('resetPinErrorMessage'));
    });
}

// ---------------------
// Transaction History (transaction_history.html)
// ---------------------
function initializeTransactionHistory() {
    fetchTransactionHistory();
}

function fetchTransactionHistory() {
    const loadingIndicator = document.getElementById('loading');
    const transactionTable = document.getElementById('transactionTable');
    const transactionTableBody = document.getElementById('transactionTableBody');
    const noTransactions = document.getElementById('noTransactions');

    // Show loading indicator
    showLoading();

    // Fetch transaction history from backend API
    fetch('https://your-backend-api.com/api/transaction-history', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('userToken')
        }
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            const transactions = data.transactions;
            if (transactions.length === 0) {
                noTransactions.style.display = 'block';
                transactionTable.style.display = 'none';
            } else {
                transactionTableBody.innerHTML = ''; // Clear existing rows
                transactions.forEach(transaction => {
                    const row = document.createElement('tr');

                    // Type
                    const typeCell = document.createElement('td');
                    typeCell.textContent = transaction.type;
                    row.appendChild(typeCell);

                    // Amount
                    const amountCell = document.createElement('td');
                    amountCell.textContent = 'UGX ' + parseFloat(transaction.amount).toFixed(2);
                    row.appendChild(amountCell);

                    // Counterparty
                    const counterpartyCell = document.createElement('td');
                    counterpartyCell.textContent = transaction.counterparty || 'N/A';
                    row.appendChild(counterpartyCell);

                    // Date & Time
                    const dateCell = document.createElement('td');
                    const date = new Date(transaction.date);
                    dateCell.textContent = date.toLocaleString();
                    row.appendChild(dateCell);

                    transactionTableBody.appendChild(row);
                });
                transactionTable.style.display = 'table';
                noTransactions.style.display = 'none';
            }
        } else {
            showAlert(data.message || 'Failed to fetch transaction history.', 'danger');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Error:', error);
        showAlert('An error occurred while fetching transaction history.', 'danger');
    });
}

// ---------------------
// Utility Functions
// ---------------------

// Show Loading Indicator (you can implement a global loader in your HTML)
function showLoading() {
    // Example implementation using a global loader element
    let loader = document.getElementById('globalLoader');
    if (!loader) {
        // Create loader if it doesn't exist
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        loader.style.position = 'fixed';
        loader.style.top = '50%';
        loader.style.left = '50%';
        loader.style.transform = 'translate(-50%, -50%)';
        loader.style.zIndex = '9999';
        loader.style.display = 'none';
        document.body.appendChild(loader);
    }
    loader.style.display = 'block';
}

function hideLoading() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Show Alert Message (uses Bootstrap alerts)
function showAlert(message, type = 'info') {
    // Create alert element
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show`;
    alertContainer.role = 'alert';
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    // Insert alert at the top of the body
    document.body.insertBefore(alertContainer, document.body.firstChild);

    // Automatically dismiss after 5 seconds
    setTimeout(() => {
        const alert = bootstrap.Alert.getInstance(alertContainer);
        if (alert) {
            alert.close();
        }
    }, 5000);
}

// Logout Function (already defined in initializeCommonEventListeners)
function logout() {
    // Clear user session data
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    showAlert('You have been logged out successfully.', 'success');
    window.location.href = 'index.html';
}
