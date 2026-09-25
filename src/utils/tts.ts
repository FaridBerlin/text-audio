/**
 * Local, offline neural text-to-speech powered by Kokoro-82M running fully
 * in the browser via WebAssembly/WebGPU + ONNX Runtime (kokoro-js /
 * transformers.js). Kokoro produces noticeably more natural prosody and
 * pacing than smaller VITS-style voices, while still running 100%
 * client-side with no server and no API key.
 *
 * This replaces the old approach of trying to "record" the Web Speech API
 * (speechSynthesis), which browsers do not expose as a capturable audio
 * stream — that approach could only ever capture silence, microphone
 * noise, or synthetic beep tones, never the spoken text.
 */
import { KokoroTTS, type TextSplitterStream } from 'kokoro-js'

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'

export type VoiceId = keyof InstanceType<typeof KokoroTTS>['voices']

export type Voice = {
  id: VoiceId
  name: string
  language: string
  gender: string
  traits?: string
  targetQuality: string
  overallGrade: string
}

export type ModelLoadProgress = {
  status: string
  file?: string
  loaded?: number
  total?: number
}

let modelPromise: Promise<KokoroTTS> | null = null

/**
 * Load the Kokoro model (once) and keep it cached for reuse. Downloads
 * the model weights on first use, then relies on the browser's HTTP
 * cache for subsequent offline use.
 */
const loadModel = (onProgress?: (progress: ModelLoadProgress) => void): Promise<KokoroTTS> => {
  if (!modelPromise) {
    modelPromise = KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: 'q8',
      progress_callback: onProgress,
    })
  }
  return modelPromise
}

/** All available voices. Triggers the (cached) model load if needed. */
export const listVoices = async (
  onProgress?: (progress: ModelLoadProgress) => void,
): Promise<Voice[]> => {
  const tts = await loadModel(onProgress)
  return Object.entries(tts.voices).map(([id, voice]) => ({
    id: id as VoiceId,
    ...voice,
  }))
}

/**
 * Synthesize speech for the given text using a local Kokoro voice.
 * Returns a real, playable/downloadable WAV blob.
 */
export const synthesizeSpeech = async (
  text: string,
  voiceId: VoiceId,
  speed = 1,
  onProgress?: (progress: ModelLoadProgress) => void,
): Promise<Blob> => {
  const tts = await loadModel(onProgress)
  const audio = await tts.generate(text, { voice: voiceId, speed })
  return audio.toBlob()
}

export type { TextSplitterStream }
