# VerifyAI
VerifyAI is a web application that uses artificial intelligence to analyze and verify the credibility of news articles. It provides users with a quick and accurate assessment of the authenticity of information, helping to combat the spread of misinformation.

## Features
- Text-based news analysis
- Image and video content analysis (future feature)
- Credibility scoring from 0 to 100
- Detailed explanation of the credibility assessment
- User-friendly web interface

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
4. Start the server:
   ```
   node server.js
   ```
5. Open your browser and navigate to `http://localhost:3000` to use the application.

## Usage
1. Enter the news text you want to verify in the input field.
2. (Future feature) Upload related images or videos if available.
3. Click the "Verify" button to analyze the content.
4. View the credibility score and explanation in the results section.

## Project Structure
- `public/index.html`: Main HTML file for the web interface
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
