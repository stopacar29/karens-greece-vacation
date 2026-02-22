/**
 * PDF parser API URL. The app sends PDFs here and receives TripData JSON.
 * Run the backend (see server/README) and set this to your server URL.
 * For same-machine dev: use your computer's LAN IP so the phone can reach it (e.g. http://192.168.1.5:3000).
 */
export const PDF_PARSER_URL = process.env.EXPO_PUBLIC_PDF_PARSER_URL || 'http://localhost:3000';
