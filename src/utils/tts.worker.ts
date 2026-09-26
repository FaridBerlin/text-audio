/**
 * Runs Kokoro-82M model loading and speech generation off the main thread.
 *
 * The ONNX Runtime WASM inference kokoro-js performs is synchronous,
 * CPU-heavy JS work. Running it on the main thread blocks rendering and
 * input handling for as long as it takes to synthesize the audio, which
 * for longer passages is long enough that the browser shows a
 * "Page Unresponsive" prompt (and, on slower machines/connections such as
 * a GitHub Pages visitor's, can be interrupted or fail outright). Moving
 * it into a Worker keeps the UI thread free regardless of text length or
 * how slow the device running it is.
 */
import { KokoroTTS, type GenerateOptions } from 'kokoro-js'

type VoiceId = NonNullable<GenerateOptions['voice']>

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'

type ModelLoadProgress = {
  status: string
  file?: string
  loaded?: number
  total?: number
}

type WorkerRequest =
  | { id: number; type: 'list-voices' }
  | { id: number; type: 'synthesize'; payload: { text: string; voiceId: string; speed: number } }

// `self` in a module worker is a DedicatedWorkerGlobalScope, whose
// postMessage/onmessage shapes differ from the `Window` ones the project's
// DOM-only tsconfig lib knows about. Narrow it explicitly rather than
// pulling in the (conflicting) "webworker" lib.
const ctx = self as unknown as {
  postMessage: (message: unknown, transfer?: Transferable[]) => void
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null
}

let modelPromise: ReturnType<typeof KokoroTTS.from_pretrained> | null = null

const loadModel = (onProgress: (progress: ModelLoadProgress) => void) => {
  if (!modelPromise) {
    modelPromise = KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: 'q8',
      progress_callback: onProgress,
    })
  }
  return modelPromise
}

ctx.onmessage = async (event) => {
  const message = event.data
  const { id } = message
  const onProgress = (progress: ModelLoadProgress) => ctx.postMessage({ id, type: 'progress', payload: progress })

  try {
    if (message.type === 'list-voices') {
      const tts = await loadModel(onProgress)
      const voices = Object.entries(tts.voices).map(([voiceId, voice]) => ({ id: voiceId, ...voice }))
      ctx.postMessage({ id, type: 'result', payload: voices })
    } else if (message.type === 'synthesize') {
      const tts = await loadModel(onProgress)
      const { text, voiceId, speed } = message.payload
      const audio = await tts.generate(text, { voice: voiceId as VoiceId, speed })
      const blob = await audio.toBlob()
      const buffer = await blob.arrayBuffer()
      ctx.postMessage({ id, type: 'result', payload: { buffer, mimeType: blob.type } }, [buffer])
    }
  } catch (err) {
    ctx.postMessage({ id, type: 'error', payload: err instanceof Error ? err.message : String(err) })
  }
}
