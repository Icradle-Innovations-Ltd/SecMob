# SecMob FinalYearProject By Alex And Ronald 2024 In Computer Security And Forensics From Uganda Technology And Management University (UTAMU) 

SecMob is a mobile money application developed using Apache Cordova. It provides a secure and user-friendly interface for managing mobile money transactions, including sending and receiving money, buying airtime, and checking transaction history. The app incorporates fingerprint authentication and email verification for enhanced security.

## Features

- User registration with name, phone number (MTN or Airtel), and a starting balance of 0 UGX.
- Deposit, send money, and view transaction history.
- Buy airtime for yourself or other users.
- Pay bills (water, electricity).
- Withdraw funds.
- Fingerprint authentication for secure access.
- Email notifications using Nodemailer and SendGrid.
- SQLite integration for data storage.

## Technologies Used

- Apache Cordova
- HTML
- CSS
- JavaScript
- Font Awesome (for icons)
-EmailSender
-Nodemailer
1. **Clone the repository:**

   ```bash
   git clone https://github.com/Alex-Dev-crypto/SecMob.git
   cd SecMob

## Installation and setup
## Installation

### Install Cordova

```bash
npm install -g cordova

cordova platform add android
cordova plugin add cordova-plugin-splashscreen
cordova plugin add cordova-plugin-fingerprint-aio
npm install
cordova build android
adb devices
cordova emulate android
cordova run android 
cordova run android --device
Install dependencies
Make sure to navigate to your project folder and run:


###Copy code
npm install
##Running the App
###Emulating on Android Emulator
###To run the app on an Android emulator, use the following command:


cordova emulate android
###Running on a Physical Device
###Connect your Android device via USB.
###Ensure USB debugging is enabled on your device.
###Run the app on your device using:
cordova run android --device

### Prerequisites

Make sure you have the following installed:

- Node.js
- Apache Cordova
- Android Studio (for Android SDK)
- USB Drivers for your device

### Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Alex-Dev-crypto/SecMob.git
   cd SecMob

# SecMob Backend
 This is  mobile money app with email verification and fingerprint authentication 
# Secure Mobile Money Application

## Overview
This is a console-based application for MTN Mobile Money. It allows users to create accounts, log in, reset their PINs, and perform various transactions like depositing money, sending money, and viewing transaction history.

## Features
- User registration with email verification
- Secure login with PIN
- Resetting the PIN
- Sending and receiving money
- Viewing transaction history

## Getting Started
### install the dependencies for the backend
npm install nodemailer sqlite3
npm install --save @sendgrid/mail
npm install sqlite3 readline nodemailer
npm install prompt-sync


### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Alex-Dev-crypto/SecMob.git
   cd SecMob/SecMob/www/js/
