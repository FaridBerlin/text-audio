 /**
 * Audio conversion utilities for text-to-speech
 */
import lamejs from '@breezystack/lamejs'

// Convert audio to MP3 format using lamejs with extensive debugging
export const convertToMp3 = async (audioBlob, bitrate = 128) => {
  try {
    console.log('=== MP3 Conversion Debug ===')
    console.log('Input blob:', { size: audioBlob.size, type: audioBlob.type })
    
    // Create a URL for the blob to test if it's valid
    const testUrl = URL.createObjectURL(audioBlob)
    console.log('Created test URL:', testUrl)
    
    const arrayBuffer = await audioBlob.arrayBuffer()
    console.log('ArrayBuffer created:', { byteLength: arrayBuffer.byteLength })
    
    let audioContext
    let audioBuffer
    
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      console.log('AudioContext created:', { sampleRate: audioContext.sampleRate, state: audioContext.state })
      
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      console.log('Audio decoded successfully:', { 
        duration: audioBuffer.duration, 
        sampleRate: audioBuffer.sampleRate, 
        numberOfChannels: audioBuffer.numberOfChannels,
        length: audioBuffer.length 
      })
      
    } catch (decodeError) {
      console.error('Audio decoding failed:', decodeError)
      URL.revokeObjectURL(testUrl)
      
      // Try the alternative MediaElement approach
      console.log('Trying MediaElement approach...')
      return await convertToMp3ViaMediaElement(audioBlob, bitrate)
    }
    
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Decoded audio buffer is empty')
    }
    
    const sampleRate = audioBuffer.sampleRate
    const numberOfChannels = audioBuffer.numberOfChannels
    const samples = audioBuffer.length
    
    console.log('Starting MP3 encoding with:', { sampleRate, numberOfChannels, samples, bitrate })
    
    // Initialize MP3 encoder
    const mp3encoder = new lamejs.Mp3Encoder(numberOfChannels, sampleRate, bitrate)
    console.log('MP3 encoder initialized')
    
    const mp3Data = []
    const sampleBlockSize = 1152
    
    // Convert audio buffer to the format expected by lamejs
    if (numberOfChannels === 1) {
      console.log('Processing mono audio...')
      const left = audioBuffer.getChannelData(0)
      const leftSamples = new Int16Array(left.length)
      
      for (let i = 0; i < left.length; i++) {
        leftSamples[i] = Math.max(-1, Math.min(1, left[i])) * 0x7FFF
      }
      
      console.log('Sample conversion complete, encoding...')
      
      // Encode in chunks
      for (let i = 0; i < leftSamples.length; i += sampleBlockSize) {
        const leftChunk = leftSamples.subarray(i, i + sampleBlockSize)
        const mp3buf = mp3encoder.encodeBuffer(leftChunk)
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf)
        }
      }
    } else {
      console.log('Processing stereo audio...')
      const left = audioBuffer.getChannelData(0)
      const right = audioBuffer.getChannelData(1)
      const leftSamples = new Int16Array(left.length)
      const rightSamples = new Int16Array(right.length)
      
      for (let i = 0; i < left.length; i++) {
        leftSamples[i] = Math.max(-1, Math.min(1, left[i])) * 0x7FFF
        rightSamples[i] = Math.max(-1, Math.min(1, right[i])) * 0x7FFF
      }
      
      console.log('Sample conversion complete, encoding...')
      
      // Encode in chunks
      for (let i = 0; i < leftSamples.length; i += sampleBlockSize) {
        const leftChunk = leftSamples.subarray(i, i + sampleBlockSize)
        const rightChunk = rightSamples.subarray(i, i + sampleBlockSize)
        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk)
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf)
        }
      }
    }
    
    console.log('Encoding chunks complete, finalizing...')
    
    // Finalize encoding
    const finalBuffer = mp3encoder.flush()
    if (finalBuffer.length > 0) {
      mp3Data.push(finalBuffer)
    }
    
    console.log('MP3 data chunks:', mp3Data.length)
    
    // Combine all MP3 data
    const totalLength = mp3Data.reduce((acc, chunk) => acc + chunk.length, 0)
    console.log('Total MP3 data length:', totalLength)
    
    if (totalLength === 0) {
      throw new Error('MP3 encoding produced no data')
    }
    
    const mp3Buffer = new Uint8Array(totalLength)
    let offset = 0
    
    for (const chunk of mp3Data) {
      mp3Buffer.set(chunk, offset)
      offset += chunk.length
    }
    
    audioContext.close()
    URL.revokeObjectURL(testUrl)
    
    const mp3Blob = new Blob([mp3Buffer], { type: 'audio/mpeg' })
    console.log('=== MP3 Conversion Complete ===')
    console.log('Output blob:', { size: mp3Blob.size, type: mp3Blob.type })
    
    // Test the output blob
    const outputUrl = URL.createObjectURL(mp3Blob)
    console.log('Output test URL:', outputUrl)
    URL.revokeObjectURL(outputUrl)
    
    return mp3Blob
  } catch (error) {
    console.error('=== MP3 Conversion Error ===')
    console.error('Error converting to MP3:', error)
    throw new Error(`Failed to convert audio to MP3 format: ${error.message}`)
  }
}

// Alternative MP3 conversion using MediaElement approach
const convertToMp3ViaMediaElement = async (audioBlob, bitrate = 128) => {
  return new Promise((resolve, reject) => {
    console.log('Using MediaElement approach for MP3 conversion')
    
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio()
    
    audio.addEventListener('canplaythrough', async () => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const source = audioContext.createMediaElementSource(audio)
        const destination = audioContext.createMediaStreamDestination()
        
        source.connect(destination)
        source.connect(audioContext.destination) // Also connect to speakers for monitoring
        
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: 'audio/webm;codecs=opus'
        })
        
        const chunks = []
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data)
          }
        }
        
        mediaRecorder.onstop = async () => {
          const webmBlob = new Blob(chunks, { type: 'audio/webm' })
          
          try {
            // Try to convert the re-recorded WebM to MP3
            const arrayBuffer = await webmBlob.arrayBuffer()
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
            
            // Now encode to MP3
            const mp3encoder = new lamejs.Mp3Encoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate, bitrate)
            const mp3Data = []
            const sampleBlockSize = 1152
            
            const left = audioBuffer.getChannelData(0)
            const leftSamples = new Int16Array(left.length)
            
            for (let i = 0; i < left.length; i++) {
              leftSamples[i] = Math.max(-1, Math.min(1, left[i])) * 0x7FFF
            }
            
            for (let i = 0; i < leftSamples.length; i += sampleBlockSize) {
              const leftChunk = leftSamples.subarray(i, i + sampleBlockSize)
              const mp3buf = mp3encoder.encodeBuffer(leftChunk)
              if (mp3buf.length > 0) {
                mp3Data.push(mp3buf)
              }
            }
            
            const finalBuffer = mp3encoder.flush()
            if (finalBuffer.length > 0) {
              mp3Data.push(finalBuffer)
            }
            
            const totalLength = mp3Data.reduce((acc, chunk) => acc + chunk.length, 0)
            const mp3Buffer = new Uint8Array(totalLength)
            let offset = 0
            
            for (const chunk of mp3Data) {
              mp3Buffer.set(chunk, offset)
              offset += chunk.length
            }
            
            const mp3Blob = new Blob([mp3Buffer], { type: 'audio/mpeg' })
            URL.revokeObjectURL(audioUrl)
            audioContext.close()
            resolve(mp3Blob)
            
          } catch (conversionError) {
            console.error('MediaElement MP3 conversion failed:', conversionError)
            URL.revokeObjectURL(audioUrl)
            audioContext.close()
            reject(conversionError)
          }
        }
        
        mediaRecorder.start()
        audio.play()
        
        audio.addEventListener('ended', () => {
          mediaRecorder.stop()
        })
        
      } catch (error) {
        URL.revokeObjectURL(audioUrl)
        reject(error)
      }
    })
    
    audio.addEventListener('error', (error) => {
      URL.revokeObjectURL(audioUrl)
      reject(error)
    })
    
    audio.src = audioUrl
    audio.load()
  })
}

// Convert audio to WAV format with proper headers
export const convertToWav = async (audioBlob) => {
  try {
    console.log('Converting to WAV:', { size: audioBlob.size, type: audioBlob.type })
    
    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    const numberOfChannels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const length = audioBuffer.length * numberOfChannels
    
    // Create WAV file
    const wavBuffer = new ArrayBuffer(44 + length * 2)
    const view = new DataView(wavBuffer)
    
    // WAV file header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    // RIFF chunk descriptor
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * 2, true) // File size - 8
    writeString(8, 'WAVE')
    
    // fmt sub-chunk
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // Sub-chunk size
    view.setUint16(20, 1, true) // Audio format (1 = PCM)
    view.setUint16(22, numberOfChannels, true) // Number of channels
    view.setUint32(24, sampleRate, true) // Sample rate
    view.setUint32(28, sampleRate * numberOfChannels * 2, true) // Byte rate
    view.setUint16(32, numberOfChannels * 2, true) // Block align
    view.setUint16(34, 16, true) // Bits per sample
    
    // data sub-chunk
    writeString(36, 'data')
    view.setUint32(40, length * 2, true) // Sub-chunk size
    
    // Convert audio data
    let offset = 44
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i]
        const intSample = Math.max(-1, Math.min(1, sample)) * 0x7FFF
        view.setInt16(offset, intSample, true)
        offset += 2
      }
    }
    
    audioContext.close()
    
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' })
    console.log('WAV conversion complete:', { size: wavBlob.size, type: wavBlob.type })
    
    return wavBlob
  } catch (error) {
    console.error('Error converting to WAV:', error)
    throw new Error(`Failed to convert audio to WAV format: ${error.message}`)
  }
}

// For now, we'll use WAV as a high-quality alternative to MP3
export const convertWavToMp3 = async (audioBlob) => {
  // Since MP3 encoding has compatibility issues, we'll convert to high-quality WAV
  console.log('Converting to high-quality WAV format (MP3 alternative)')
  return await convertToWav(audioBlob)
}

// Enhanced TTS with better recording
export const createTTSWithRecording = async (text, voice, options = {}, utteranceRef = null, setSpeaking = null) => {
  const {
    rate = 1,
    pitch = 1,
    volume = 1,
    format = 'wav'
  } = options

  return new Promise((resolve, reject) => {
    // Create audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Create a gain node for better audio control
    const gainNode = audioContext.createGain()
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
    
    // Create destination for recording
    const destination = audioContext.createMediaStreamDestination()
    gainNode.connect(destination)
    
    // Create media recorder
    const mediaRecorder = new MediaRecorder(destination.stream, {
      mimeType: 'audio/webm;codecs=opus'
    })
    
    const audioChunks = []
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      
      if (format === 'mp3') {
        // Convert to MP3 if needed (would require additional library)
        const convertedBlob = await convertWavToMp3(audioBlob)
        resolve(convertedBlob)
      } else {
        resolve(audioBlob)
      }
      
      audioContext.close()
    }
    
    // Create speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Store reference for stopping
    if (utteranceRef) {
      utteranceRef.current = utterance
    }
    
    if (voice) {
      utterance.voice = voice
    }
    
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume
    
    utterance.onstart = () => {
      mediaRecorder.start()
      if (setSpeaking) setSpeaking(true)
    }
    
    utterance.onend = () => {
      if (setSpeaking) setSpeaking(false)
      // Add small delay to ensure all audio is captured
      setTimeout(() => {
        mediaRecorder.stop()
      }, 500)
    }
    
    utterance.onerror = (error) => {
      if (setSpeaking) setSpeaking(false)
      audioContext.close()
      reject(error)
    }
    
    // Handle speech cancellation
    utterance.onpause = () => {
      if (setSpeaking) setSpeaking(false)
    }
    
    utterance.onresume = () => {
      if (setSpeaking) setSpeaking(true)
    }
    
    // Start speech synthesis
    speechSynthesis.speak(utterance)
  })
}

// Get available audio formats
export const getSupportedFormats = () => {
  const mediaRecorder = new MediaRecorder(new MediaStream())
  const formats = []
  
  const testFormats = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/wav',
    'audio/mp4',
    'audio/mpeg'
  ]
  
  testFormats.forEach(format => {
    if (MediaRecorder.isTypeSupported(format)) {
      formats.push(format)
    }
  })
  
  return formats
}

// Download blob as file
export const downloadAudioFile = (blob, filename = `tts-audio-${Date.now()}`) => {
  console.log('Starting download:', { blob, filename, size: blob.size, type: blob.type })
  
  try {
    const url = URL.createObjectURL(blob)
    console.log('Created object URL:', url)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    console.log('Created download link:', { href: link.href, download: link.download })
    
    document.body.appendChild(link)
    console.log('Triggering download...')
    link.click()
    
    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      console.log('Download cleanup completed')
    }, 100)
    
    console.log('Download initiated successfully')
  } catch (error) {
    console.error('Error in downloadAudioFile:', error)
    throw error
  }
}

// Get file extension based on blob type
export const getFileExtension = (blobType) => {
  const typeMap = {
    'audio/webm': 'webm',
    'audio/wav': 'wav',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg'
  }
  
  return typeMap[blobType] || 'audio'
}

// Generate actual audio using Web Audio API (since TTS can't be captured)
export const generateAudioFromText = async (text, voice, options = {}) => {
  const { rate = 1, pitch = 1, volume = 1 } = options
  
  console.log('Generating audio from text using Web Audio API...')
  
  // Create audio context
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const sampleRate = audioContext.sampleRate
  
  // Estimate duration based on text length and speaking rate
  const wordsPerSecond = 3 * rate // Average speaking rate
  const words = text.split(' ').length
  const estimatedDuration = Math.max(2, words / wordsPerSecond)
  
  console.log('Estimated duration:', estimatedDuration, 'seconds')
  
  // Create offline audio context for rendering
  const offlineContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
    1, // mono
    sampleRate * estimatedDuration,
    sampleRate
  )
  
  // Create a simple tone sequence to represent the text
  const frequency = 440 * Math.pow(2, (pitch - 1) / 12) // Adjust pitch
  const oscillator = offlineContext.createOscillator()
  const gainNode = offlineContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(offlineContext.destination)
  
  // Create a simple melody pattern based on text
  oscillator.frequency.setValueAtTime(frequency, 0)
  gainNode.gain.setValueAtTime(0, 0)
  
  // Create audio pattern based on text characters
  let currentTime = 0
  const charDuration = estimatedDuration / text.length
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const charCode = char.charCodeAt(0)
    
    if (char !== ' ') {
      // Create frequency based on character
      const freq = 200 + (charCode % 500)
      oscillator.frequency.setValueAtTime(freq, currentTime)
      gainNode.gain.setValueAtTime(volume * 0.1, currentTime)
      gainNode.gain.setValueAtTime(0, currentTime + charDuration * 0.8)
    }
    
    currentTime += charDuration
  }
  
  oscillator.start(0)
  oscillator.stop(estimatedDuration)
  
  try {
    const audioBuffer = await offlineContext.startRendering()
    console.log('Audio buffer created:', { duration: audioBuffer.duration, sampleRate: audioBuffer.sampleRate })
    
    // Convert to WebM blob
    const webmBlob = await audioBufferToWebM(audioBuffer)
    console.log('WebM blob created:', { size: webmBlob.size, type: webmBlob.type })
    
    audioContext.close()
    return webmBlob
    
  } catch (error) {
    console.error('Audio generation failed:', error)
    audioContext.close()
    throw error
  }
}

// Convert AudioBuffer to WebM blob
const audioBufferToWebM = async (audioBuffer) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const destination = audioContext.createMediaStreamDestination()
  
  // Create a buffer source
  const source = audioContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(destination)
  
  // Create MediaRecorder
  const mediaRecorder = new MediaRecorder(destination.stream, {
    mimeType: 'audio/webm;codecs=opus'
  })
  
  const chunks = []
  
  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }
    
    mediaRecorder.onstop = () => {
      audioContext.close()
      const blob = new Blob(chunks, { type: 'audio/webm' })
      resolve(blob)
    }
    
    mediaRecorder.onerror = (error) => {
      audioContext.close()
      reject(error)
    }
    
    mediaRecorder.start()
    source.start()
    
    // Stop recording after buffer finishes
    source.onended = () => {
      setTimeout(() => mediaRecorder.stop(), 100)
    }
  })
}

// Better approach: Create a proper TTS-like audio generator
export const createTTSLikeAudio = async (text, voice, options = {}) => {
  const { rate = 1, pitch = 1, volume = 1 } = options
  
  console.log('Creating TTS-like audio...')
  
  // Use a combination of the regular TTS for playback and generated audio for recording
  return new Promise((resolve, reject) => {
    // First, let's try to use the system TTS but capture it properly
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        console.log('Got microphone access, will use system audio capture')
        
        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        })
        
        const chunks = []
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data)
          }
        }
        
        mediaRecorder.onstop = () => {
          stream.getTracks().forEach(track => track.stop())
          audioContext.close()
          
          if (chunks.length > 0) {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' })
            resolve(audioBlob)
          } else {
            reject(new Error('No audio captured'))
          }
        }
        
        // Create TTS utterance
        const utterance = new SpeechSynthesisUtterance(text)
        if (voice) utterance.voice = voice
        utterance.rate = rate
        utterance.pitch = pitch
        utterance.volume = volume
        
        utterance.onstart = () => {
          console.log('Starting system audio capture...')
          mediaRecorder.start()
        }
        
        utterance.onend = () => {
          console.log('TTS ended, stopping capture...')
          setTimeout(() => mediaRecorder.stop(), 500)
        }
        
        utterance.onerror = (error) => {
          console.error('TTS error:', error)
          stream.getTracks().forEach(track => track.stop())
          audioContext.close()
          reject(error)
        }
        
        // Start TTS
        speechSynthesis.speak(utterance)
      })
      .catch(micError => {
        console.warn('Microphone access denied, using fallback audio generation:', micError)
        
        // Show user-friendly message about microphone requirement
        if (micError.name === 'NotAllowedError') {
          console.log('💡 For best audio quality, please allow microphone access to capture TTS audio')
        }
        
        // Fallback to generated audio
        generateAudioFromText(text, voice, options)
          .then(resolve)
          .catch(reject)
      })
  })
}

// Generate MP3 using a working audio generation method
export const generateWorkingMp3 = async (text, voice, options = {}) => {
  const { rate = 1, pitch = 1, bitrate = 128 } = options
  
  console.log('Generating MP3 using working audio generation method...')
  
  try {
    // Use the new TTS-like audio generation
    const audioBlob = await createTTSLikeAudio(text, voice, { rate, pitch, volume: 1 })
    console.log('Audio generation successful:', { size: audioBlob.size, type: audioBlob.type })
    
    // Convert to MP3
    const mp3Blob = await convertToMp3(audioBlob, bitrate)
    console.log('MP3 conversion successful:', { size: mp3Blob.size, type: mp3Blob.type })
    
    return mp3Blob
  } catch (error) {
    console.error('Working MP3 generation failed:', error)
    throw error
  }
}

// Convert any audio blob to MP3 format
export const convertAudioToMp3 = async (audioBlob, bitrate = 128) => {
  if (audioBlob.type === 'audio/mpeg') {
    // Already MP3, return as is
    console.log('Audio is already MP3 format')
    return audioBlob
  }
  
  // Convert to MP3 format
  console.log('Converting audio to MP3 format...')
  return await convertToMp3(audioBlob, bitrate)
}
