import { useState, useRef, useEffect } from 'react'
import { createTTSWithRecording, downloadAudioFile, getFileExtension, getSupportedFormats, convertAudioToMp3, convertToWav, generateWorkingMp3, createTTSLikeAudio } from './utils/audioConverter'
import './App.css'

function App() {
  const [text, setText] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isConvertingMp3, setIsConvertingMp3] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [voices, setVoices] = useState([])
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [supportedFormats, setSupportedFormats] = useState([])
  const audioRef = useRef(null)
  const currentUtteranceRef = useRef(null)

  // Load available voices
  const loadVoices = () => {
    const availableVoices = speechSynthesis.getVoices()
    setVoices(availableVoices)
    if (availableVoices.length > 0 && !selectedVoice) {
      setSelectedVoice(availableVoices[0])
    }
  }

  // Initialize voices when component mounts
  useEffect(() => {
    loadVoices()
    setSupportedFormats(getSupportedFormats())
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    
    // Cleanup function
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      // Stop any ongoing speech when component unmounts
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel()
      }
    }
  }, [])

  // Convert text to speech and capture audio
  const convertTextToAudio = async () => {
    if (!text.trim()) {
      alert('Please enter some text to convert')
      return
    }

    setIsConverting(true)
    setIsSpeaking(true)
    
    try {
      // Use the new working audio generation method
      const blob = await createTTSLikeAudio(text, selectedVoice, {
        rate,
        pitch,
        volume: 1
      })
      
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setAudioBlob(blob)
    } catch (error) {
      console.error('Error converting text to audio:', error)
      alert('Error converting text to audio. Please try again.')
    } finally {
      setIsConverting(false)
      setIsSpeaking(false)
    }
  }

  // Stop the current speech
  const stopSpeech = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    setIsConverting(false)
  }

  // Download audio file
  const downloadAudio = () => {
    if (!audioBlob) return

    const extension = getFileExtension(audioBlob.type)
    const filename = `text-to-speech-${Date.now()}.${extension}`
    downloadAudioFile(audioBlob, filename)
  }

  // Test function to verify the new audio generation works
  const testNewAudioGeneration = async () => {
    if (!text.trim()) {
      alert('Please enter some text first.')
      return
    }

    console.log('=== Testing New Audio Generation ===')
    
    try {
      // Test the new audio generation
      const audioBlob = await createTTSLikeAudio(text, selectedVoice, { rate, pitch, volume: 1 })
      
      console.log('New audio generation result:', { 
        size: audioBlob.size, 
        type: audioBlob.type,
        hasAudio: audioBlob.size > 0
      })
      
      if (audioBlob.size > 0) {
        // Test if we can play it
        const url = URL.createObjectURL(audioBlob)
        const audio = new Audio()
        audio.src = url
        
        audio.oncanplaythrough = () => {
          console.log('New audio can be played, duration:', audio.duration)
          audio.play()
          URL.revokeObjectURL(url)
        }
        
        audio.onerror = (error) => {
          console.error('New audio playback error:', error)
          URL.revokeObjectURL(url)
        }
        
        // Also offer download to test
        const filename = `new-audio-test-${Date.now()}.${getFileExtension(audioBlob.type)}`
        downloadAudioFile(audioBlob, filename)
        alert('New audio generation test completed. Check console and downloaded file.')
      } else {
        alert('New audio generation failed - no audio data created.')
      }
      
    } catch (error) {
      console.error('New audio generation test failed:', error)
      alert(`New audio generation test failed: ${error.message}`)
    }
  }

  // Test function to verify TTS recording works
  const testTTSRecording = async () => {
    if (!text.trim()) {
      alert('Please enter some text first.')
      return
    }

    console.log('=== Testing TTS Recording ===')
    
    try {
      // Test the new working TTS recording method
      const audioBlob = await createTTSLikeAudio(text, selectedVoice, { rate, pitch, volume: 1 })
      
      console.log('TTS recording test result:', { 
        size: audioBlob.size, 
        type: audioBlob.type,
        hasAudio: audioBlob.size > 0
      })
      
      if (audioBlob.size > 0) {
        // Test if we can play it
        const url = URL.createObjectURL(audioBlob)
        const audio = new Audio()
        audio.src = url
        
        audio.oncanplaythrough = () => {
          console.log('Audio can be played, duration:', audio.duration)
          audio.play()
          URL.revokeObjectURL(url)
        }
        
        audio.onerror = (error) => {
          console.error('Audio playback error:', error)
          URL.revokeObjectURL(url)
        }
        
        // Also offer download to test
        const filename = `tts-test-${Date.now()}.${getFileExtension(audioBlob.type)}`
        downloadAudioFile(audioBlob, filename)
        alert('TTS recording test completed. Check console and downloaded file.')
      } else {
        alert('TTS recording failed - no audio data captured.')
      }
      
    } catch (error) {
      console.error('TTS recording test failed:', error)
      alert(`TTS recording test failed: ${error.message}`)
    }
  }

  // Generate and download MP3 audio file using proven working method
  const generateAndDownloadMp3 = async () => {
    if (!text.trim()) {
      alert('Please enter some text first.')
      return
    }

    setIsConvertingMp3(true)
    try {
      console.log('Generating MP3 using proven working method...')
      
      // Use the proven working method
      const mp3Blob = await generateWorkingMp3(text, selectedVoice, { rate, pitch, bitrate: 128 })
      
      const filename = `text-to-speech-${Date.now()}.mp3`
      downloadAudioFile(mp3Blob, filename)
      alert('MP3 audio file generated successfully!')
      
    } catch (error) {
      console.error('MP3 generation failed:', error)
      
      // Fallback: try to generate and offer WAV instead
      try {
        console.log('MP3 failed, trying WAV fallback...')
        const audioBlob = await createTTSLikeAudio(text, selectedVoice, { rate, pitch, volume: 1 })
        const wavBlob = await convertToWav(audioBlob)
        const filename = `text-to-speech-${Date.now()}.wav`
        downloadAudioFile(wavBlob, filename)
        alert('MP3 conversion failed. Downloaded high-quality WAV file instead.')
      } catch (fallbackError) {
        console.error('Both MP3 and WAV generation failed:', fallbackError)
        alert(`Audio generation failed: ${error.message}`)
      }
    } finally {
      setIsConvertingMp3(false)
    }
  }

  // Simple TTS to downloadable audio file
  const generateAndDownloadAudio = async () => {
    if (!text.trim()) {
      alert('Please enter some text first.')
      return
    }

    setIsConvertingMp3(true)
    try {
      console.log('Generating downloadable audio...')
      
      // Create a new audio context for clean recording
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const destination = audioContext.createMediaStreamDestination()
      
      // Create media recorder with higher quality settings
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      })
      
      const audioChunks = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...')
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        console.log('Created audio blob:', { size: audioBlob.size, type: audioBlob.type })
        
        // Convert to WAV format
        try {
          const wavBlob = await convertToWav(audioBlob)
          console.log('WAV conversion successful:', { size: wavBlob.size, type: wavBlob.type })
          
          const filename = `text-to-speech-${Date.now()}.wav`
          downloadAudioFile(wavBlob, filename)
          alert('Audio file generated and download started!')
        } catch (conversionError) {
          console.error('WAV conversion failed, downloading original:', conversionError)
          const filename = `text-to-speech-${Date.now()}.webm`
          downloadAudioFile(audioBlob, filename)
          alert('Audio file generated and download started! (WebM format)')
        }
        
        audioContext.close()
        setIsConvertingMp3(false)
      }
      
      // Create and configure speech utterance
      const utterance = new SpeechSynthesisUtterance(text)
      if (selectedVoice) utterance.voice = selectedVoice
      utterance.rate = rate
      utterance.pitch = pitch
      
      utterance.onstart = () => {
        console.log('Speech started, beginning recording...')
        mediaRecorder.start()
      }
      
      utterance.onend = () => {
        console.log('Speech ended, stopping recording...')
        setTimeout(() => mediaRecorder.stop(), 500)
      }
      
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error)
        audioContext.close()
        setIsConvertingMp3(false)
        alert('Error generating speech audio')
      }
      
      // Start speech synthesis
      speechSynthesis.speak(utterance)
      
    } catch (error) {
      console.error('Error in generateAndDownloadAudio:', error)
      alert(`Error generating audio: ${error.message}`)
      setIsConvertingMp3(false)
    }
  }

  // Alternative method using a TTS service (requires API)
  const convertWithTTSService = async () => {
    alert('TTS Service integration would require an API key and backend service')
  }

  return (
    <div className="app">
      <div className="container">
        <h1>Farid App </h1>
        <h2>Text to Speech Converter</h2>
        <p>Convert any text to speech and download as audio file</p>
        
        {isSpeaking && (
          <div className="status-indicator">
            <div className="speaking-animation"></div>
            <span>Speaking... Click "Stop Speech" to cancel</span>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="text-input">Enter Text:</label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            rows={6}
            maxLength={5000}
          />
          <small>{text.length}/5000 characters</small>
        </div>

        <div className="form-group">
          <label htmlFor="voice-select">Select Voice:</label>
          <select
            id="voice-select"
            value={selectedVoice?.name || ''}
            onChange={(e) => {
              const voice = voices.find(v => v.name === e.target.value)
              setSelectedVoice(voice)
            }}
          >
            {voices.map((voice, index) => (
              <option key={index} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>

        <div className="controls-grid">
          <div className="form-group">
            <label htmlFor="rate-slider">Speech Rate: {rate}</label>
            <input
              id="rate-slider"
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="pitch-slider">Speech Pitch: {pitch}</label>
            <input
              id="pitch-slider"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="buttons">
          <button 
            onClick={convertTextToAudio}
            disabled={isConverting || !text.trim() || isSpeaking}
            className="convert-btn"
          >
            {isConverting ? 'Converting...' : 'Convert to Audio'}
          </button>
          
          <button 
            onClick={testTTSRecording}
            disabled={isConverting || !text.trim() || isSpeaking}
            className="test-btn"
          >
            Test TTS Recording
          </button>
          
          <button 
            onClick={testNewAudioGeneration}
            disabled={isConverting || !text.trim() || isSpeaking}
            className="test-btn"
          >
            Test New Audio Gen
          </button>
          
          {(isSpeaking || isConverting) && (
            <button 
              onClick={stopSpeech}
              className="stop-btn"
            >
              Stop Speech
            </button>
          )}
          
          <button 
            onClick={convertWithTTSService}
            disabled={!text.trim() || isSpeaking}
            className="service-btn"
          >
            Use TTS Service (Demo)
          </button>
        </div>

        {audioUrl && (
          <div className="audio-section">
            <h3>Generated Audio:</h3>
            <audio ref={audioRef} controls src={audioUrl}>
              Your browser does not support the audio element.
            </audio>
            
            {isConvertingMp3 && (
              <div className="conversion-progress">
                <div className="progress-spinner"></div>
                <span>Converting to high-quality format... Please wait</span>
              </div>
            )}
            
            <div className="download-buttons">
              <button onClick={downloadAudio} className="download-btn">
                Download Original ({getFileExtension(audioBlob?.type).toUpperCase()})
              </button>
              <button 
                onClick={generateAndDownloadMp3} 
                className="mp3-btn"
                disabled={isConvertingMp3}
              >
                {isConvertingMp3 ? 'Generating...' : 'Generate & Download MP3'}
              </button>
              <button 
                onClick={generateAndDownloadAudio} 
                className="wav-btn"
                disabled={isConvertingMp3}
              >
                {isConvertingMp3 ? 'Generating...' : 'Generate & Download WAV'}
              </button>
            </div>
          </div>
        )}

        <div className="info">
          <h3>About this app:</h3>
          <ul>
            <li>Uses Web Speech API for text-to-speech conversion</li>
            <li>Records the speech and allows download as audio file</li>
            <li>Supports formats: {supportedFormats.join(', ')}</li>
            <li>✨ NEW: Convert to high-quality WAV format for better compatibility</li>
            <li>Works best in Chrome/Edge browsers</li>
            <li>Adjust speech rate and pitch for better results</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App
