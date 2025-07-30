# Text to Audio Converter 🎧

A modern React application with **stunning dark mode design** that converts text to speech and allows you to download the generated audio as a file.

## ✨ Features

- **🌙 Beautiful Dark Mode**: Modern dark theme with glassmorphism effects and neon accents
- **🎙️ Text-to-Speech Conversion**: Uses the Web Speech API to convert any text to natural-sounding speech
- **🗣️ Voice Selection**: Choose from available system voices in different languages
- **⚙️ Customizable Speech**: Adjust speech rate and pitch for optimal results
- **📁 Audio Download**: Download the generated speech as an audio file (WebM format)
- **🎵 MP3 Conversion**: Convert any generated audio to MP3 format for maximum compatibility
- **⏹️ Stop Control**: Stop speech generation at any time with the stop button
- **🎯 Real TTS Audio**: Generate actual speech-like audio without microphone dependency
- **📱 Responsive Design**: Works beautifully on desktop, tablet, and mobile devices
- **🎨 Modern UI**: Glassmorphism effects, smooth animations, and gradient backgrounds
- **🔊 Real-time Preview**: Listen to the generated audio before downloading

## 🚀 Live Demo

**[View Live App on GitHub Pages](https://yourusername.github.io/your-repo-name)**

## 🛠️ Technologies Used

- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Web Speech API** - Browser text-to-speech
- **MediaRecorder API** - Audio recording capabilities
- **@breezystack/lamejs** - Client-side MP3 encoding
- **ResponsiveVoice** - External TTS service integration
- **CSS3** - Modern dark mode design with glassmorphism
- **GitHub Pages** - Static site deployment

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### Installation

1. Clone the repository or download the project files
2. Navigate to the project directory:
   ```bash
   cd text-audio
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and go to `http://localhost:5173`

## Usage

1. **Enter Text**: Type or paste the text you want to convert to speech in the text area
2. **Select Voice**: Choose from available voices in the dropdown menu
3. **Adjust Settings**: Use the sliders to adjust speech rate (speed) and pitch
4. **Convert**: Click "Convert to Audio" to generate the speech
5. **Stop (Optional)**: Use "Stop Speech" button to cancel generation at any time
6. **Preview**: Listen to the generated audio using the built-in player
7. **Download Options**:
   - Download in original format (WebM/WAV)
   - Convert & Download as MP3 for maximum compatibility

## Browser Compatibility

- **Best Support**: Chrome, Chromium-based browsers (Edge, Brave, etc.)
- **Good Support**: Firefox, Safari
- **Note**: Some features may vary depending on the browser's implementation of Web APIs

## Audio Formats

- **Original**: WebM format (most widely supported by browsers)
- **MP3 Conversion**: True MP3 encoding using lamejs library
- **High Quality**: 128kbps MP3 bitrate for good quality and file size balance
- **Universal Compatibility**: MP3 files work on all devices and platforms

## Limitations

- Audio quality depends on the browser's text-to-speech implementation
- Voice availability varies by operating system and browser
- Maximum text length is limited to 5000 characters
- MP3 conversion may take a few seconds for longer audio files

## Technical Details

### Web Speech API

The application uses the browser's built-in Speech Synthesis API, which provides:

- Multiple voice options
- Rate and pitch control
- Cross-platform compatibility

### Audio Recording

Uses MediaRecorder API to capture the synthesized speech:

- Records in real-time as speech is generated
- Supports various audio formats depending on browser
- Automatically handles audio blob creation and download

## 🚀 Deployment to GitHub Pages

This project is configured for easy deployment to GitHub Pages! See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Deployment Steps:

1. **Update Configuration**:

   - Replace `yourusername` and `your-repo-name` in `package.json` homepage
   - Update the `base` path in `vite.config.js` with your repository name

2. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "Deploy Text-to-Audio Converter"
   git push origin main
   ```

3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select "GitHub Actions" as source
   - Your app will be live at `https://yourusername.github.io/your-repo-name`

## Future Enhancements

- Integration with cloud TTS services (Google Cloud TTS, Amazon Polly)
- Support for SSML (Speech Synthesis Markup Language)
- Batch processing for multiple texts
- Audio editing capabilities
- Voice cloning capabilities
- Multiple language support
- Audio effects and filters

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the application.

## License

This project is open source and available under the MIT License.

---

## 🌟 About the Dark Mode Design

The application features a modern dark mode design with:

- **Glassmorphism effects** for modern UI components
- **Neon accent colors** for interactive elements
- **Smooth animations** and transitions
- **Responsive grid layouts** for all screen sizes
- **High contrast** for excellent readability
- **Gradient backgrounds** with cosmic themes

Perfect for developers and users who prefer dark interfaces! 🌙
