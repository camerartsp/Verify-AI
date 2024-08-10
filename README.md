# VerifyAI

VerifyAI is a web application that uses artificial intelligence to analyze and verify the credibility of news articles. It provides users with a quick and accurate assessment of the authenticity of information, helping to combat the spread of misinformation.

## Features

- **Text-based news analysis**: Verifies the authenticity of manually entered news.
- **Image and video content analysis** (future feature): Allows analysis of media related to news.
- **Credibility score from 0 to 100**: Evaluates the reliability of news.
- **Detailed credibility assessment explanation**: Provides details about the analysis performed.
- **User-friendly web interface**: Intuitive and easy-to-use design.
- **Recent news feed**: Displays recent news separated based on the user's chosen region.
- **Region selector**: Allows the user to choose the region to filter recent news.

## Demo Video

Check out our demo video to see VerifyAI in action:

[![VerifyAI Demo](https://img.youtube.com/vi/FcRqOe0kXKQ/0.jpg)](https://youtu.be/FcRqOe0kXKQ?si=gZGFvslUhhHo-8Z8)

## Tech Stack

- Frontend: HTML, CSS (Tailwind CSS), JavaScript
- Backend: Node.js, Express.js
- AI Integration: Google's Generative AI (Gemini 1.5 Pro)

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js (v14 or higher)
- npm (v6 or higher)
- A Gemini API key from Google
- Google Custom Search JSON API key and Search Engine ID

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/camerartsp/Verify-AI.git
   cd verifyai
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. Configure the Google Custom Search API (see Google API Setup section below).
5. Start the server:
   ```
   node server.js
   ```
6. Open your browser and navigate to `http://localhost:3000` to use the application.

## Google API Setup

To use the recent news feature, you need to set up the Google Custom Search JSON API and obtain an API key and Search Engine ID. Follow these steps:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Enable the Custom Search JSON API for your project.
4. Create credentials (API key) for the Custom Search JSON API.
5. Go to the [Programmable Search Engine](https://programmablesearchengine.google.com/cse/all) page.
6. Click on "Add" to create a new search engine.
7. Set up your search engine with the desired settings (e.g., searching the entire web).
8. Once created, find your Search Engine ID on the setup page.

After obtaining your API key and Search Engine ID, update the `script.js` file:

1. Open the `public/js/script.js` file in your code editor.
2. Locate the following lines near the beginning of the file:

   ```javascript
   const apiKey = 'your_api_key_google';
   const cx = 'your_id_search_engine_google';
   ```

3. Replace `'your_api_key_google'` with your actual Google API key.
4. Replace `'your_id_search_engine_google'` with your actual Search Engine ID.

For example:

```javascript
const apiKey = 'AIzaSyBq1-WDCikaxcFXLRCTn3ruHK2EhZ1YFss';
const cx = '123456789:abcdefghijk';
```

Remember to keep your API key confidential and never share it publicly. Consider using environment variables for production deployments.

## Usage

1. Enter the news text you want to verify in the input field.
2. (Future feature) Upload related images or videos if available.
3. Click the "Verify" button to analyze the content.
4. View the credibility score and explanation in the results section.

## Project Structure

- `public/index.html`: Main HTML file for the web interface
- `public/js/script.js`: JavaScript file containing client-side logic
- `server.js`: Express server setup and route handling
- `services/geminiScraper.js`: Integration with Gemini AI for content analysis
- `uploads/`: Temporary storage for uploaded media files

## Contributing

Contributions to VerifyAI are welcome. Please follow these steps to contribute:
1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- [Google Generative AI](https://ai.google.dev/)
- [Express.js](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Multer](https://github.com/expressjs/multer) for handling file uploads

## Contact

If you have any questions or feedback, please open an issue on the GitHub repository.

---
Created by Jlocked | Powered by Gemini API