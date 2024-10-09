// www/js/index.js

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Cordova is ready');

    // Initialize event listeners
    initializeEventListeners();
}

function initializeEventListeners() {
    const fingerprintButton = document.getElementById('fingerprint-button');
    if (fingerprintButton) {
        fingerprintButton.addEventListener('click', initiateFingerprintAuthentication);
    }
}

function initiateFingerprintAuthentication() {
    FingerprintAuth.isAvailable(function(result) {
        if (result.isAvailable) {
            // Proceed with authentication
            FingerprintAuth.show({
                clientId: "SecMob",
                clientSecret: "password", // Only necessary for Android
                disableBackup: true      // Disable fallback to PIN
            }, successCallback, errorCallback);
        } else {
            alert('Fingerprint authentication is not available on this device.');
        }
    }, function(err) {
        console.error('Fingerprint Auth availability error:', err);
        alert('Error checking fingerprint authentication availability.');
    });
}

function successCallback(result) {
    if (result.withFingerprint) {
        // Authentication successful with fingerprint
        document.getElementById('fingerprintResult').innerHTML = `
            <p class="text-success">Fingerprint authentication successful!</p>
        `;
        const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
        fingerprintModal.show();

        // Redirect to Dashboard after successful authentication
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    } else if (result.withBackup) {
        // Authentication successful with backup (PIN, etc.)
        document.getElementById('fingerprintResult').innerHTML = `
            <p class="text-warning">Authentication successful with backup method.</p>
        `;
        const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
        fingerprintModal.show();
    }
}

function errorCallback(error) {
    console.error('Fingerprint Auth error:', error);
    let message = '';

    switch(error) {
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

    document.getElementById('fingerprintResult').innerHTML = `
        <p class="text-danger">${message}</p>
    `;
    const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
    fingerprintModal.show();
}
