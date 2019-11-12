// Copyright 2019, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const {
  dialogflow,
  Permission,
  DateTime,
  Place,
  SimpleResponse,
  BasicCard,
  Button,
  Image,
  BrowseCarousel,
  BrowseCarouselItem,
  Suggestions,
  LinkOutSuggestion,
  MediaObject,
  Table,
  List,
  Carousel,
  SignIn,
  Confirmation,
} = require('actions-on-google');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
admin.initializeApp();
const auth = admin.auth();
const db = admin.firestore();

const app = dialogflow({
  debug: true,
  clientId: '734694674354-g6cotve2dnqruhrbkesq4udcmi5jo60p.apps.googleusercontent.com'
});

// Intent that starts the account linking flow.
app.intent('SignIn', (conv) => {
  conv.ask(new SignIn('To get your account details'));
});

// Create a Dialogflow intent with the `actions_intent_SIGN_IN` event.
app.intent('SignIn Helper', (conv, params, signin) => {
  if (signin.status === 'OK') {
    const payload = conv.user.profile.payload;
    conv.ask(`I got your account details, ${payload.name}. What do you want to do next?`);
  } else {
    conv.ask(`I won't be able to save your data, but what do you want to do next?`);
  }
});


// [START df_js_permission_reason]
app.intent('Permission', (conv) => {
  const permissions = ['NAME'];
  let context = 'To address you by name';
  // Location permissions only work for verified users
  // https://developers.google.com/actions/assistant/guest-users
  if (conv.user.verification === 'VERIFIED') {
    // Could use DEVICE_COARSE_LOCATION instead for city, zip code
    permissions.push('DEVICE_PRECISE_LOCATION');
    context += ' and know your location';
  }
  const options = {
    context,
    permissions,
  };
  conv.ask(new Permission(options));
});
// [END df_js_permission_reason]

// [START df_js_permission_accepted]
app.intent('Permission Handler', (conv, params, confirmationGranted) => {
  // Also, can access latitude and longitude
  // const { latitude, longitude } = location.coordinates;
  const {location} = conv.device;
  const {name} = conv.user;
  if (confirmationGranted && name && location) {
    conv.ask(`Okay ${name.display}, I see you're at ` +
      `${location.formattedAddress}`);
  } else {
    conv.ask(`Looks like I can't get your information.`);
  }
  conv.ask(`Would you like to try another helper?`);
  conv.ask(new Suggestions([
    'Confirmation',
    'DateTime',
    'Place',
  ]));
});
// [END df_js_permission_accepted]

// [START df_js_datetime_reason]
app.intent('Date Time', (conv) => {
  const options = {
    prompts: {
      initial: 'When would you like to schedule the appointment?',
      date: 'What day was that?',
      time: 'What time works for you?',
    },
  };
  conv.ask(new DateTime(options));
});
// [END df_js_datetime_reason]

// [START df_js_datetime_accepted]
app.intent('Date Time Handler', (conv, params, datetime) => {
  const {month, day} = datetime.date;
  const {hours, minutes} = datetime.time;
  conv.ask(`<speak>` +
      `Great, we will see you on ` +
      `<say-as interpret-as="date" format="dm">${day}-${month}</say-as>` +
      `<say-as interpret-as="time" format="hms12" detail="2">${hours}` +
      `:${minutes || '00'}</say-as>` +
      `</speak>`);
  conv.ask('Would you like to try another helper?');
  conv.ask(new Suggestions([
    'Confirmation',
    'Permission',
    'Place',
  ]));
});
// [END df_js_datetime_accepted]

// [START df_js_place_reason]
app.intent('Place', (conv) => {
  const options = {
    context: 'To find a location',
    prompt: 'Where would you like to go?',
  };
  conv.ask(new Place(options));
});
// [END df_js_place_reason]

// [START df_js_place_accepted]
app.intent('Place Handler', (conv, params, place) => {
  if (!place) {
    conv.ask(`Sorry, I couldn't get a location from you.`);
  } else {
    // Place also contains formattedAddress and coordinates
    const {name} = place;
    conv.ask(`${name} sounds like a great place to go!`);
  }
  conv.ask('Would you like to try another helper?');
  conv.ask(new Suggestions([
    'Confirmation',
    'DateTime',
    'Permission',
  ]));
});
// [END df_js_place_accepted]

// [START df_js_confirmation_reason]
app.intent('Confirmation', (conv) => {
  conv.ask(new Confirmation('Can you confirm?'));
});
// [END df_js_confirmation_reason]

// [START df_js_confirmation_accepted]
app.intent('Confirmation Handler', (conv, params, confirmationGranted) => {
  conv.ask(confirmationGranted
    ? 'Thank you for confirming'
    : 'No problem, you have not confirmed');
  conv.ask('Would you like to try another helper?');
  conv.ask(new Suggestions([
    'DateTime',
    'Permission',
    'Place',
  ]));
});
// [END df_js_confirmation_accepted]



// [START df_js_simple_response]
app.intent('Simple Response', (conv) => {
  conv.ask(new SimpleResponse({
    speech: `Here's an example of a simple response. ` +
      `Which type of response would you like to see next?`,
    text: `Here's a simple response. ` +
      `Which response would you like to see next?`,
  }));
});
// [END df_js_simple_response]

// [START df_js_ssml_demo]
app.intent('SSML', (conv) => {
  conv.ask(`<speak>` +
    `Here are <say-as interpet-as="characters">SSML</say-as> examples.` +
    `Here is a buzzing fly ` +
    `<audio src="https://actions.google.com/sounds/v1/animals/buzzing_fly.ogg"></audio>` +
    `and here's a short pause <break time="800ms"/>` +
    `</speak>`);
  conv.ask('Which response would you like to see next?');
});
// [END df_js_ssml_demo]

// [START df_js_basic_card]
app.intent('Basic Card', (conv) => {
  if (!conv.screen) {
    conv.ask('Sorry, try this on a screen device or select the ' +
      'phone surface in the simulator.');
    conv.ask('Which response would you like to see next?');
    return;
  }

  conv.ask(`Here's an example of a basic card.`);
  conv.ask(new BasicCard({
    text: `This is a basic card.  Text in a basic card can include "quotes" and
    most other unicode characters including emojis.  Basic cards also support
    some markdown formatting like *emphasis* or _italics_, **strong** or
    __bold__, and ***bold itallic*** or ___strong emphasis___ as well as other
    things like line  \nbreaks`, // Note the two spaces before '\n' required for
                                 // a line break to be rendered in the card.
    subtitle: 'This is a subtitle',
    title: 'Title: this is a title',
    buttons: new Button({
      title: 'This is a button',
      url: 'https://assistant.google.com/',
    }),
    image: new Image({
      url: 'https://storage.googleapis.com/actionsresources/logo_assistant_2x_64dp.png',
      alt: 'Image alternate text',
    }),
    display: 'CROPPED',
  }));
  conv.ask('Which response would you like to see next?');
});
// [END df_js_basic_card]


// [START df_js_showuserprofile_card]
app.intent("Show User Profile", conv => {
  const payload = conv.user.profile.payload;
  if (payload) {
  
    const userId = payload.aud;
    const name = payload.name;
    const givenName = payload.given_name;
    const familyName = payload.family_name;
    const email = payload.email;
    const emailVerified = payload.email_verified;
    const picture = payload.picture;
    
    conv.ask("This is your profile information.");
    conv.ask(new BasicCard({
      text: `ID:${userId}  
      Name:${name}  
      Given name:${givenName}  
      Family name:${familyName}  
      Email:${email}  
      Email verified:${emailVerified}`,
      image: new Image({
        url: picture,
        alt: "Profile Image"
      })
    }));
  } else {
    conv.ask("Not signed in yet.");
    //conv.ask(new Suggestion("want to sign in"));
  }
});
// [END df_js_showuserprofile_card]

// [START df_js_personalinformation_card]
app.intent('Personal Information', (conv) => {
  if (!conv.screen) {
    conv.ask('Sorry, try this on a screen device or select the ' +
      'phone surface in the simulator.');
    conv.ask('Which response would you like to see next?');
    return;
  }

  conv.ask(`Here is your Personal Information`);
  conv.ask(new BasicCard({
    //text: `Your userId is: ${app.getUser().userId}`, 
    title: 'Personal Information',
    image: new Image({
      url: 'https://storage.googleapis.com/actionsresources/logo_assistant_2x_64dp.png',
      alt: 'Image alternate text',
    }),
    display: 'CROPPED',
  }));
});
// [END df_js_personalinformation_card]



// [START df_js_dashboard_card]
app.intent('Dashboard', (conv) => {
  if (!conv.screen) {
    conv.ask('Sorry, try this on a screen device or select the ' +
      'phone surface in the simulator.');
    conv.ask('Which response would you like to see next?');
    return;
  }
  conv.ask(`Welcome to your Dashboard interface`);
  conv.ask(new BasicCard({
    text: `This is the interface to your personalized health dashboard. The __Dashboard__ is
    your main health information page. From here you can see your personal health 
    information, medical records, medications, and doctor. Click the __button__ below to open your 
    __Dashboard__ `, 
    title: 'Dashboard',
    buttons: new Button({
      title: 'Go to Dashboard',
      url: 'https://rbu1996.github.io/HCI-Project4/HCI-P4-website/health-monitor.html',
    }),
    image: new Image({
      url: 'https://storage.googleapis.com/actionsresources/logo_assistant_2x_64dp.png',
      alt: 'Image alternate text',
    }),
    display: 'CROPPED',
  }));
});
// [END df_js_dashboard_card]


// [START df_js_medications_card]
app.intent('Medications', (conv) => {
  if (!conv.screen) {
    conv.ask('Sorry, try this on a screen device or select the ' +
      'phone surface in the simulator.');
    conv.ask('Which response would you like to see next?');
    return;
  }
  conv.ask(`Welcome to your Medications interface`);
  conv.ask(new BasicCard({
    text: `This is the interface to your Medications. Here you can see your medication information,
    order refills, and locate your pharmacy stores. Click the __button__ below to open your 
    __Medications page__ `, 
    title: 'Medications',
    buttons: new Button({
      title: 'Go to Medications',
      url: 'https://rbu1996.github.io/HCI-Project4/HCI-P4-website/home-shop.html',
    }),
    image: new Image({
      url: 'https://storage.googleapis.com/actionsresources/logo_assistant_2x_64dp.png',
      alt: 'Image alternate text',
    }),
    display: 'CROPPED',
  }));
});
// [END df_js_medications_card]


// [START df_js_doctor_card]
app.intent('Doctor', (conv) => {
  if (!conv.screen) {
    conv.ask('Sorry, try this on a screen device or select the ' +
      'phone surface in the simulator.');
    conv.ask('Which response would you like to see next?');
    return;
  }
  conv.ask(`Welcome to your Doctor interface`);
  conv.ask(new BasicCard({
    text: `This is the interface to your Doctor page. From the Doctor section you can see your 
    doctor's information, schedule appointments, and start a telehealth videochat with your doctor.
    Click the __button__ below to open your __Doctor page__ `, 
    title: 'Doctor',
    buttons: new Button({
      title: 'Go to Doctor Page',
      url: 'https://rbu1996.github.io/HCI-Project4/HCI-P4-website/doctor.html',
    }),
    image: new Image({
      url: 'https://storage.googleapis.com/actionsresources/logo_assistant_2x_64dp.png',
      alt: 'Image alternate text',
    }),
    display: 'CROPPED',
  }));
});
// [END df_js_doctor_card]


// [START df_js_browse_caro]
app.intent('Browsing Carousel', (conv) => {
  if (!conv.screen
    || !conv.surface.capabilities.has('actions.capability.WEB_BROWSER')) {
    conv.ask('Sorry, try this on a phone or select the ' +
      'phone surface in the simulator.');
      conv.ask('Which response would you like to see next?');
    return;
  }

  conv.ask(`Here's an example of a browsing carousel.`);
  conv.ask(new BrowseCarousel({
    items: [
      new BrowseCarouselItem({
        title: 'Title of item 1',
        url: 'https://example.com',
        description: 'Description of item 1',
        image: new Image({
          url: 'https://storage.googleapis.com/actionsresources/logo_assistant_2x_64dp.png',
          alt: 'Image alternate text',
        }),
        footer: 'Item 1 footer',
      }),
      new BrowseCarouselItem({
        title: 'Title of item 2',
        url: 'https://example.com',
        description: 'Description of item 2',
        image: new Image({
          url: 'https://storage.googleapis.com/actionsresources/logo_assistant_2x_64dp.png',
          alt: 'Image alternate text',
        }),
        footer: 'Item 2 footer',
      }),
    ],
  }));
});
// [END df_js_browse_caro]

// [START df_js_suggestion_chips]
app.intent('Suggestion Chips', (conv) => {
  if (!conv.screen) {
    conv.ask('Chips can be demonstrated on screen devices.');
    conv.ask('Which response would you like to see next?');
    return;
  }

  conv.ask('These are suggestion chips.');
  conv.ask(new Suggestions('Suggestion 1'));
  conv.ask(new Suggestions(['Suggestion 2', 'Suggestion 3']));
  conv.ask(new LinkOutSuggestion({
    name: 'Suggestion Link',
    url: 'https://assistant.google.com/',
  }));
  conv.ask('Which type of response would you like to see next?'); ;
});
// [END df_js_suggestion_chips]

// [START df_js_media_response]
app.intent('Media Response', (conv) => {
  if (!conv.surface.capabilities
    .has('actions.capability.MEDIA_RESPONSE_AUDIO')) {
      conv.ask('Sorry, this device does not support audio playback.');
      conv.ask('Which response would you like to see next?');
      return;
  }

  conv.ask('This is a media response example.');
  conv.ask(new MediaObject({
    name: 'Jazz in Paris',
    url: 'https://storage.googleapis.com/automotive-media/Jazz_In_Paris.mp3',
    description: 'A funky Jazz tune',
    icon: new Image({
      url: 'https://storage.googleapis.com/automotive-media/album_art.jpg',
      alt: 'Album cover of an ocean view',
    }),
  }));
  conv.ask(new Suggestions(['Dashboard', 'Medications', 'Doctor', 'Close', 'Help']));
});
// [END df_js_media_response]

// [START df_js_media_status]
app.intent('Media Status', (conv) => {
  const mediaStatus = conv.arguments.get('MEDIA_STATUS');
  let response = 'Unknown media status received.';
  if (mediaStatus && mediaStatus.status === 'FINISHED') {
    response = 'Hope you enjoyed the tune!';
  }
  conv.ask(response);
  conv.ask('Which response would you like to see next?');
});
// [END df_js_media_status]

// [START df_js_table_simple]
app.intent('Simple Table Card', (conv) => {
  if (!conv.screen) {
    conv.ask('Sorry, try this on a screen device or select the ' +
      'phone surface in the simulator.');
    conv.ask('Which response would you like to see next?');
    return;
  }

  conv.ask('This is a simple table example.');
  conv.ask(new Table({
    dividers: true,
    columns: ['header 1', 'header 2', 'header 3'],
    rows: [
      ['row 1 item 1', 'row 1 item 2', 'row 1 item 3'],
      ['row 2 item 1', 'row 2 item 2', 'row 2 item 3'],
    ],
  }));
  conv.ask('Which response would you like to see next?');
});
// [END df_js_table_simple]

// [START df_js_table_complex]
app.intent('Advanced Table Card', (conv) => {
  if (!conv.screen) {
    conv.ask('Sorry, try this on a screen device or select the ' +
      'phone surface in the simulator.');
    conv.ask('Which response would you like to see next?');
    return;
  }

  conv.ask('This is a table with all the possible fields.');
  conv.ask(new Table({
    title: 'Table Title',
    subtitle: 'Table Subtitle',
    image: new Image({
      url: 'https://storage.googleapis.com/actionsresources/logo_assistant_2x_64dp.png',
      alt: 'Alt Text',
    }),
    columns: [
      {
        header: 'header 1',
        align: 'CENTER',
      },
      {
        header: 'header 2',
        align: 'LEADING',
      },
      {
        header: 'header 3',
        align: 'TRAILING',
      },
    ],
    rows: [
      {
        cells: ['row 1 item 1', 'row 1 item 2', 'row 1 item 3'],
        dividerAfter: false,
      },
      {
        cells: ['row 2 item 1', 'row 2 item 2', 'row 2 item 3'],
        dividerAfter: true,
      },
      {
        cells: ['row 3 item 1', 'row 3 item 2', 'row 3 item 3'],
      },
    ],
    buttons: new Button({
      title: 'Button Text',
      url: 'https://assistant.google.com',
    }),
  }));
  conv.ask('Which response would you like to see next?');
});
// [END df_js_table_complex]

// [START df_js_list]
app.intent('List', (conv) => {
  if (!conv.screen) {
    conv.ask('Sorry, try this on a screen device or select the ' +
      'phone surface in the simulator.');
    return;
  }

  conv.ask('This is a list example.');
  // Create a list
  conv.ask(new List({
    title: 'List Title',
    items: {
      // Add the first item to the list
      'SELECTION_KEY_ONE': {
        synonyms: [
          'synonym 1',
          'synonym 2',
          'synonym 3',
        ],
        title: 'Title of First List Item',
        description: 'This is a description of a list item.',
        image: new Image({
          url: 'https://storage.googleapis.com/actionsresources/logo_assistant_2x_64dp.png',
          alt: 'Image alternate text',
        }),
      },
      // Add the second item to the list
      'SELECTION_KEY_GOOGLE_HOME': {
        synonyms: [
          'Google Home Assistant',
          'Assistant on the Google Home',
      ],
        title: 'Google Home',
        description: 'Google Home is a voice-activated speaker powered by ' +
          'the Google Assistant.',
        image: new Image({
          url: 'https://storage.googleapis.com/actionsresources/logo_assistant_2x_64dp.png',
          alt: 'Google Home',
        }),
      },
      // Add the third item to the list
      'SELECTION_KEY_GOOGLE_PIXEL': {
        synonyms: [
          'Google Pixel XL',
          'Pixel',
          'Pixel XL',
        ],
        title: 'Google Pixel',
        description: 'Pixel. Phone by Google.',
        image: new Image({
          url: 'https://storage.googleapis.com/actionsresources/logo_assistant_2x_64dp.png',
          alt: 'Google Pixel',
        }),
      },
    },
  }));
});
// [END df_js_list]

// [START df_js_list_selected]
app.intent('List - OPTION', (conv, params, option) => {
  const SELECTED_ITEM_RESPONSES = {
    'SELECTION_KEY_ONE': 'You selected the first item',
    'SELECTION_KEY_GOOGLE_HOME': 'You selected the Google Home!',
    'SELECTION_KEY_GOOGLE_PIXEL': 'You selected the Google Pixel!',
  };
  conv.ask(SELECTED_ITEM_RESPONSES[option]);
  conv.ask('Which response would you like to see next?');
});
// [END df_js_list_selected]

// [START df_js_caro]
app.intent('Carousel', (conv) => {
  if (!conv.screen) {
    conv.ask('Sorry, try this on a screen device or select the ' +
      'phone surface in the simulator.');
    return;
  }

  conv.ask('This is a carousel example.');
  // Create a carousel
  conv.ask(new Carousel({
    title: 'Carousel Title',
    items: {
      // Add the first item to the carousel
      'SELECTION_KEY_ONE': {
        synonyms: [
          'synonym 1',
          'synonym 2',
          'synonym 3',
        ],
        title: 'Title of First Carousel Item',
        description: 'This is a description of a carousel item.',
        image: new Image({
          url: 'https://storage.googleapis.com/actionsresources/logo_assistant_2x_64dp.png',
          alt: 'Image alternate text',
        }),
      },
      // Add the second item to the carousel
      'SELECTION_KEY_GOOGLE_HOME': {
        synonyms: [
          'Google Home Assistant',
          'Assistant on the Google Home',
      ],
        title: 'Google Home',
        description: 'Google Home is a voice-activated speaker powered by ' +
          'the Google Assistant.',
        image: new Image({
          url: 'https://storage.googleapis.com/actionsresources/logo_assistant_2x_64dp.png',
          alt: 'Google Home',
        }),
      },
      // Add the third item to the carousel
      'SELECTION_KEY_GOOGLE_PIXEL': {
        synonyms: [
          'Google Pixel XL',
          'Pixel',
          'Pixel XL',
        ],
        title: 'Google Pixel',
        description: 'Pixel. Phone by Google.',
        image: new Image({
          url: 'https://storage.googleapis.com/actionsresources/logo_assistant_2x_64dp.png',
          alt: 'Google Pixel',
        }),
      },
    },
  }));
});
// [END df_js_caro]

// [START df_js_caro_selected]
app.intent('Carousel - OPTION', (conv, params, option) => {
  const SELECTED_ITEM_RESPONSES = {
    'SELECTION_KEY_ONE': 'You selected the first item',
    'SELECTION_KEY_GOOGLE_HOME': 'You selected the Google Home!',
    'SELECTION_KEY_GOOGLE_PIXEL': 'You selected the Google Pixel!',
  };
  conv.ask(SELECTED_ITEM_RESPONSES[option]);
  conv.ask('Which response would you like to see next?');
});
// [END df_js_caro_selected]

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);

