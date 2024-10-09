// www/js/scripts.js

// Wait for Cordova to fully load
document.addEventListener('deviceready', onDeviceReady, false);

/**
 * Function: onDeviceReady
 * Description: Initializes event listeners once Cordova is ready.
 */
function onDeviceReady() {
    console.log('Cordova is ready');

    // Initialize event listeners based on the current page
    initializeEventListeners();
}

/**
 * Function: initializeEventListeners
 * Description: Determines the current page and sets up relevant event listeners.
 */
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

    // Initialize common event listeners (e.g., logout buttons)
    initializeCommonEventListeners();
}

/**
 * Function: getCurrentPage
 * Description: Retrieves the current page's filename.
 * Returns: String representing the current page's filename.
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    return page;
}

/**
 * Function: initializeCommonEventListeners
 * Description: Sets up event listeners that are common across multiple pages.
 */
function initializeCommonEventListeners() {
    // Select all elements that serve as logout buttons
    const logoutButtons = document.querySelectorAll('#logoutBtn, #logoutButton, #logoutBtnDashboard');

    // Attach click event listeners to each logout button
    logoutButtons.forEach(button => {
        button.addEventListener('click', logout);
    });
}

/**
 * Function: initializeFingerprintAuth
 * Description: Sets up the fingerprint authentication event listener on the home page.
 */
function initializeFingerprintAuth() {
    const fingerprintButton = document.getElementById('fingerprint-button');
    if (fingerprintButton) {
        fingerprintButton.addEventListener('click', initiateFingerprintAuthentication);
    }
}

/**
 * Function: initiateFingerprintAuthentication
 * Description: Checks if fingerprint authentication is available and initiates it.
 */
function initiateFingerprintAuthentication() {
    // Check if Fingerprint Authentication is available on the device
    FingerprintAuth.isAvailable(isAvailableSuccess, isAvailableError);
}

/**
 * Function: isAvailableSuccess
 * Description: Callback for FingerprintAuth.isAvailable to handle availability status.
 * @param {Object} result - Result object containing availability status.
 */
function isAvailableSuccess(result) {
    if (result.isAvailable) {
        // Proceed with authentication
        FingerprintAuth.show({
            clientId: "SecMob",            // Identifier for the app
            clientSecret: "password",      // Only necessary for Android
            disableBackup: true            // Disable fallback to PIN
        }, fingerprintSuccessCallback, fingerprintErrorCallback);
    } else {
        // Fingerprint authentication is not available
        showAlert('Fingerprint authentication is not available on this device.', 'info');
    }
}

/**
 * Function: isAvailableError
 * Description: Callback for FingerprintAuth.isAvailable to handle errors.
 * @param {Object} error - Error object containing error details.
 */
function isAvailableError(error) {
    console.error('Fingerprint Auth availability error:', error);
    showAlert('Error checking fingerprint authentication availability.', 'danger');
}

/**
 * Function: fingerprintSuccessCallback
 * Description: Handles successful fingerprint authentication.
 * @param {Object} result - Result object containing authentication status.
 */
function fingerprintSuccessCallback(result) {
    if (result.withFingerprint) {
        // Authentication successful with fingerprint
        document.getElementById('fingerprintResult').innerHTML = `
            <p class="text-success">Fingerprint authentication successful!</p>
        `;
        // Show the result modal
        const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
        fingerprintModal.show();

        // Redirect to Dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    } else if (result.withBackup) {
        // Authentication successful with backup method (e.g., PIN)
        document.getElementById('fingerprintResult').innerHTML = `
            <p class="text-warning">Authentication successful with backup method.</p>
        `;
        // Show the result modal
        const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
        fingerprintModal.show();
    }
}

/**
 * Function: fingerprintErrorCallback
 * Description: Handles errors during fingerprint authentication.
 * @param {String} error - Error code indicating the type of error.
 */
function fingerprintErrorCallback(error) {
    console.error('Fingerprint Auth error:', error);
    let message = '';

    // Determine the error message based on the error code
    switch(error) {
        case FingerprintAuth.ERRORS.FINGERPRINT_CANCELLED:
            message = 'Fingerprint authentication was cancelled.';
            break;
        case FingerprintAuth.ERRORS.FINGERPRINT_NOT_RECOGNIZED:
            message = 'Fingerprint not recognized. Please try again.';
            break;
        case FingerprintAuth.ERRORS.FINGERPRINT_INTERNAL_ERROR:
            message = 'Internal error occurred during fingerprint authentication.';
            break;
        case FingerprintAuth.ERRORS.FINGERPRINT_LOCKOUT:
            message = 'Too many failed attempts. Please try again later.';
            break;
        default:
            message = 'An unknown error occurred during fingerprint authentication.';
            break;
    }

    // Update the modal with the error message
    document.getElementById('fingerprintResult').innerHTML = `
        <p class="text-danger">${message}</p>
    `;
    // Show the result modal
    const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
    fingerprintModal.show();
}

/**
 * Function: logout
 * Description: Handles user logout by clearing session data and redirecting to the login page.
 */
function logout() {
    // Clear session storage
    sessionStorage.clear();

    // Redirect to login page
    window.location.href = 'login.html';
}

/**
 * Function: showAlert
 * Description: Displays a Bootstrap alert message.
 * @param {String} message - The message to display in the alert.
 * @param {String} type - The type of alert (e.g., 'success', 'info', 'danger').
 */
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Append alert to body
    document.body.appendChild(alertDiv);
    
    // Automatically remove the alert after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

/**
 * Function: initializeCreateAccount
 * Description: Initializes event listeners for the create account page.
 */
function initializeCreateAccount() {
    // Add your create account specific initialization code here
}

/**
 * Function: initializeLogin
 * Description: Initializes event listeners for the login page.
 */
function initializeLogin() {
    // Add your login specific initialization code here
}

/**
 * Function: initializeDashboard
 * Description: Initializes event listeners for the dashboard page.
 */
function initializeDashboard() {
    // Add your dashboard specific initialization code here
}

/**
 * Function: initializeResetPin
 * Description: Initializes event listeners for the reset PIN page.
 */
function initializeResetPin() {
    // Add your reset PIN specific initialization code here
}

/**
 * Function: initializeTransactionHistory
 * Description: Initializes event listeners for the transaction history page.
 */
function initializeTransactionHistory() {
    // Add your transaction history specific initialization code here
}

