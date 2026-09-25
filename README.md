# Text to Audio Converter 🎧

A modern React + TypeScript application with **stunning dark mode design** that converts text to speech entirely offline, in the browser, using local neural voices — and lets you download the result as a real WAV or MP3 file.

## ✨ Features

- **🌙 Beautiful Dark Mode**: Modern dark theme with glassmorphism effects and neon accents
- **🎙️ Local Neural Text-to-Speech**: Runs [Kokoro-82M](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) fully in your browser via WebAssembly + ONNX Runtime — no server, no API key
- **🗣️ Voice Selection**: Dozens of voices across multiple languages, part of a single model download cached for offline use
- **📁 Real Audio Download**: Download the generated speech as an actual WAV file
- **🎵 MP3 Conversion**: Convert the generated speech to true MP3 (128kbps) for maximum compatibility
- **🔒 Fully Private**: Text and audio never leave your device — everything runs client-side
- **📱 Responsive Design**: Works beautifully on desktop, tablet, and mobile devices
- **🎨 Modern UI**: Glassmorphism effects, smooth animations, and gradient backgrounds
- **🔊 Real-time Preview**: Listen to the generated audio before downloading

## 🚀 Live Demo

**[View Live App on GitHub Pages](https://yourusername.github.io/your-repo-name)**

## 🛠️ Technologies Used

- **React 19 + TypeScript** - Modern, type-safe React with hooks
- **Vite** - Fast build tool and development server
- **[kokoro-js](https://github.com/hexgrad/kokoro)** - Kokoro-82M neural TTS running in-browser via WebAssembly/ONNX Runtime (transformers.js)
- **@breezystack/lamejs** - Client-side MP3 encoding
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
2. **Select Voice**: Choose from the local Kokoro voices in the dropdown menu (grouped by language, graded by quality)
3. **Generate**: Click "Generate Speech" — the model downloads on first use (a progress percentage is shown), then is cached in the browser for instant offline reuse
4. **Preview**: Listen to the generated audio using the built-in player
5. **Download Options**:
   - Download as WAV (the native output format)
   - Download as MP3 (128kbps, converted client-side)

## Browser Compatibility

- Requires WebAssembly (WebGPU is used automatically when available for faster generation)
- **Best Support**: Chrome, Chromium-based browsers (Edge, Brave, etc.), Firefox
- **Note**: Very old browsers without WASM support are not supported

## Audio Formats

- **Native Output**: WAV (uncompressed, generated directly by the TTS engine)
- **MP3 Conversion**: True MP3 encoding using the lamejs library, 128kbps
- **Universal Compatibility**: Both formats work on all devices and platforms

## Limitations

- Maximum text length is limited to 5000 characters
- The first generation requires downloading the Kokoro model (~80MB, quantized); an internet connection is needed for that one-time download, after which it's cached for offline use
- MP3 conversion may take a few seconds for longer audio

## Technical Details

### Why not the Web Speech API?

Earlier versions of this app tried to "record" the browser's built-in `speechSynthesis` API to produce a downloadable file. This doesn't work: browsers do not expose synthesized speech as a capturable audio stream, so that approach could only ever capture silence, microphone noise, or synthetic tones — never the actual spoken text. This is a fundamental platform limitation, not a bug that can be patched.

### Local Neural TTS

Instead, this app uses [Kokoro-82M](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) running fully client-side via [kokoro-js](https://github.com/hexgrad/kokoro) (transformers.js, ONNX Runtime + WebAssembly/WebGPU):

- The model is fetched once (quantized to `q8`) and cached by the browser for offline reuse
- Inference produces a real, playable, downloadable WAV `Blob` directly — no capture hacks needed
- The WAV can then be re-encoded to MP3 client-side with lamejs

## 🚀 Deployment to GitHub Pages

This project is configured for easy deployment to GitHub Pages! See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Deployment Steps:

1. **Update Configuration**:

   - Replace `yourusername` and `your-repo-name` in `package.json` homepage
   - Update the `base` path in `vite.config.ts` with your repository name

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
