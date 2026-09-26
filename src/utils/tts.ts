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
 *
 * The actual model loading and generation run in a Web Worker (see
 * tts.worker.ts) so that synthesizing longer passages never blocks the
 * main thread — otherwise the browser can show a "Page Unresponsive"
 * prompt, or interrupt generation, especially on slower devices/networks.
 */
import type { KokoroTTS } from 'kokoro-js'

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

type WorkerResultPayload<T extends string> = T extends 'list-voices'
  ? Voice[]
  : { buffer: ArrayBuffer; mimeType: string }

type WorkerResponse =
  | { id: number; type: 'progress'; payload: ModelLoadProgress }
  | { id: number; type: 'result'; payload: unknown }
  | { id: number; type: 'error'; payload: string }

let worker: Worker | null = null
let nextRequestId = 0

const getWorker = (): Worker => {
  if (!worker) {
    worker = new Worker(new URL('./tts.worker.ts', import.meta.url), { type: 'module' })
  }
  return worker
}

const callWorker = <T extends 'list-voices' | 'synthesize'>(
  type: T,
  payload: T extends 'synthesize' ? { text: string; voiceId: VoiceId; speed: number } : undefined,
  onProgress?: (progress: ModelLoadProgress) => void,
): Promise<WorkerResultPayload<T>> => {
  return new Promise((resolve, reject) => {
    const id = nextRequestId++
    const w = getWorker()

    const handleMessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      if (message.id !== id) return

      if (message.type === 'progress') {
        onProgress?.(message.payload)
        return
      }

      w.removeEventListener('message', handleMessage)
      if (message.type === 'result') {
        resolve(message.payload as WorkerResultPayload<T>)
      } else {
        reject(new Error(message.payload))
      }
    }

    w.addEventListener('message', handleMessage)
    w.postMessage({ id, type, payload })
  })
}

/** All available voices. Triggers the (cached) model load if needed. */
export const listVoices = (onProgress?: (progress: ModelLoadProgress) => void): Promise<Voice[]> =>
  callWorker('list-voices', undefined, onProgress)

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
  const { buffer, mimeType } = await callWorker('synthesize', { text, voiceId, speed }, onProgress)
  return new Blob([buffer], { type: mimeType })
}
