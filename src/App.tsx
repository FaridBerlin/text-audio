import { useEffect, useMemo, useState } from 'react'
import { downloadBlob, convertToMp3 } from './utils/audioConverter'
import { listVoices, synthesizeSpeech, type Voice, type VoiceId } from './utils/tts'
import './App.css'

const DEFAULT_VOICE_ID: VoiceId = 'en_US-hfc_female-medium'

function App() {
  const [text, setText] = useState('')
  const [voices, setVoices] = useState<Voice[]>([])
  const [voiceId, setVoiceId] = useState<VoiceId>(DEFAULT_VOICE_ID)
  const [voicesError, setVoicesError] = useState<string | null>(null)

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isConvertingMp3, setIsConvertingMp3] = useState(false)

  useEffect(() => {
    listVoices()
      .then((available) => {
        setVoices(available)
        if (!available.some((voice) => voice.key === DEFAULT_VOICE_ID) && available.length > 0) {
          setVoiceId(available[0].key)
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to load voice list:', err)
        setVoicesError('Could not load the voice list. Check your internet connection and reload.')
      })
  }, [])

  // Revoke the previous object URL whenever it's replaced or the component unmounts.
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const groupedVoices = useMemo(() => {
    const groups = new Map<string, Voice[]>()
    for (const voice of voices) {
      const label = voice.language.name_english
      if (!groups.has(label)) groups.set(label, [])
      groups.get(label)!.push(voice)
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [voices])

  const generateSpeech = async () => {
    if (!text.trim()) {
      alert('Please enter some text to convert')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setError(null)

    try {
      const wavBlob = await synthesizeSpeech(text, voiceId, (p) => {
        setProgress(Math.round((p.loaded * 100) / p.total))
      })
      setAudioBlob(wavBlob)
      setAudioUrl(URL.createObjectURL(wavBlob))
    } catch (err) {
      console.error('Speech generation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate speech.')
    } finally {
      setIsGenerating(false)
      setProgress(null)
    }
  }

  const downloadWav = () => {
    if (!audioBlob) return
    downloadBlob(audioBlob, `text-to-speech-${Date.now()}.wav`)
  }

  const downloadMp3 = async () => {
    if (!audioBlob) return
    setIsConvertingMp3(true)
    try {
      const mp3Blob = await convertToMp3(audioBlob)
      downloadBlob(mp3Blob, `text-to-speech-${Date.now()}.mp3`)
    } catch (err) {
      console.error('MP3 conversion failed:', err)
      alert('Could not convert to MP3. Try downloading the WAV file instead.')
    } finally {
      setIsConvertingMp3(false)
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1>Farid App</h1>
        <h2>Text to Speech Converter</h2>
        <p>Convert any text to speech locally, offline, and download it as an audio file</p>

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
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value as VoiceId)}
            disabled={voices.length === 0}
          >
            {groupedVoices.map(([language, languageVoices]) => (
              <optgroup key={language} label={language}>
                {languageVoices.map((voice) => (
                  <option key={voice.key} value={voice.key}>
                    {voice.name} ({voice.quality})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {voicesError && <small className="error-text">{voicesError}</small>}
        </div>

        <div className="buttons">
          <button
            onClick={generateSpeech}
            disabled={isGenerating || !text.trim() || voices.length === 0}
            className="convert-btn"
          >
            {isGenerating
              ? progress !== null
                ? `Generating... ${progress}%`
                : 'Generating...'
              : 'Generate Speech'}
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        {audioUrl && (
          <div className="audio-section">
            <h3>Generated Audio:</h3>
            <audio controls src={audioUrl}>
              Your browser does not support the audio element.
            </audio>

            <div className="download-buttons">
              <button onClick={downloadWav} className="download-btn">
                Download WAV
              </button>
              <button onClick={downloadMp3} className="mp3-btn" disabled={isConvertingMp3}>
                {isConvertingMp3 ? 'Converting...' : 'Download MP3'}
              </button>
            </div>
          </div>
        )}

        <div className="info">
          <h3>About this app:</h3>
          <ul>
            <li>Uses local, offline neural voices (Piper) running fully in your browser</li>
            <li>The first generation with a given voice downloads its model, then it's cached for offline use</li>
            <li>No text or audio is ever sent to a server</li>
            <li>Download the result as WAV or MP3</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App
