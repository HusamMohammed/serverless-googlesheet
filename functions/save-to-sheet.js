const { google } = require('googleapis')

require('dotenv').config()

const headers = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers':
		'Origin, X-Requested-With, Content-Type, Accept',
	'Content-Type': 'application/json',
	'Access-Control-Allow-Methods': '*',
}

const handler = async event => {
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({ message: 'Successful preflight call.' }),
		}
	}

	if (event.httpMethod !== 'POST') {
		return { statusCode: 403, headers, body: 'Unauthorized method' }
	}

	if (!event.queryStringParameters.id) {
		return { statusCode: 400, headers, body: 'Provde spreadsheet id' }
	}

	const body = JSON.parse(event.body)

	try {
		const auth = new google.auth.GoogleAuth({
			projectId: process.env.GOOGLE_PROJECT_ID,
			credentials: {
				client_email: process.env.GOOGLE_CLIENT_EMAIL,
				private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
			},

			scopes: 'https://www.googleapis.com/auth/spreadsheets',
		})

		const client = await auth.getClient()

		const sheets = google.sheets({
			version: 'v4',
			auth: client,
		})

		const writeReq = await sheets.spreadsheets.values.append({
			spreadsheetId: event.queryStringParameters.id,
			range: 'Sheet1!A:D',

			valueInputOption: 'USER_ENTERED',
			resource: {
				majorDimension: 'COLUMNS',
				values: [body.data],
			},
		})

		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({ success: true }),
		}
	} catch (error) {
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({ success: false, error: error.toString() }),
		}
	}
}

module.exports = { handler }
