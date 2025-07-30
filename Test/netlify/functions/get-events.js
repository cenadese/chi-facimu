// netlify/functions/get-events.js
const { google } = require('googleapis');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Credenziali dal Environment Variables di Netlify
    const credentials = {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n'),
    };

    // Autorizza con Google
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    // Inizializza Sheets API
    const sheets = google.sheets({ version: 'v4', auth });

    // Leggi dati dal foglio
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A2:L1000', // Salta header, leggi fino a riga 1000
    });

    const rows = response.data.values || [];

    // Trasforma in oggetti JSON
    const events = rows.map((row, index) => ({
      id: index + 1,
      title: row[0] || '',
      date: row[1] || '',
      time: row[2] || '',
      location: row[3] || '',
      city: row[4] || '',
      coordinates: row[5] && row[6] ? { lat: parseFloat(row[5]), lng: parseFloat(row[6]) } : null,
      category: row[7] || '',
      description: row[8] || '',
      organizer: row[9] || '',
      price: row[10] || '',
      image: row[11] || '📅'
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        events,
        count: events.length 
      }),
    };

  } catch (error) {
    console.error('Error fetching events:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch events',
        message: error.message 
      }),
    };
  }
};