'use strict';

// Import the Dialogflow module from the Actions on Google client library.
const {dialogflow} = require('actions-on-google');

// Import the firebase-functions package for deployment.
const functions = require('firebase-functions');

// Instantiate the Dialogflow client.
const app = dialogflow({debug: true});

// Handle the Dialogflow intent named 'dashboard'.
// The intent collects a parameter named 'dashboard'.
app.intent('dashboard', (conv, {dashboard}) => {
  	var newWindow = newWindow.open("https://github.com/rbu1996/HCI-Project4/blob/master/Media/heatlh_dashboard.jpg");
    conv.close('Dashboard opening...');
});

// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
