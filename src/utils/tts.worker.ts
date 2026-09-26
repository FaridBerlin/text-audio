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
import { KokoroTTS, TextSplitterStream, type GenerateOptions } from 'kokoro-js'

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

/**
 * Encode raw float32 PCM samples as a WAV file, matching the format
 * kokoro-js/transformers.js itself produces (IEEE float, mono).
 */
const encodeWav = (samples: Float32Array, sampleRate: number): ArrayBuffer => {
  const bytesPerSample = 4
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
  const view = new DataView(buffer)

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * bytesPerSample, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 3, true) // IEEE float
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * bytesPerSample, true)
  view.setUint16(32, bytesPerSample, true)
  view.setUint16(34, 32, true)
  writeString(36, 'data')
  view.setUint32(40, samples.length * bytesPerSample, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += bytesPerSample) {
    view.setFloat32(offset, samples[i], true)
  }

  return buffer
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

      // `generate()` runs the whole input through the model in one shot,
      // which silently truncates anything beyond ~509 tokens (a few
      // hundred words) — long text would only ever produce a short clip.
      // `stream()` instead splits the text into sentences and generates
      // each one separately, so we concatenate the chunks ourselves.
      //
      // We build the TextSplitterStream ourselves (rather than passing a
      // plain string to `tts.stream()`) and close it explicitly: kokoro-js's
      // own string overload never closes its internal stream, which leaves
      // its async generator waiting forever for more input after the last
      // sentence and hangs generation indefinitely.
      const splitter = new TextSplitterStream()
      splitter.push(text)
      splitter.close()

      const chunks: Float32Array[] = []
      let sampleRate = 24000
      let consumed = 0
      for await (const chunk of tts.stream(splitter, { voice: voiceId as VoiceId, speed })) {
        chunks.push(chunk.audio.audio)
        sampleRate = chunk.audio.sampling_rate
        consumed += chunk.text.length
        onProgress({ status: 'generating', loaded: Math.min(consumed, text.length), total: text.length })
      }

      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
      const merged = new Float32Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        merged.set(chunk, offset)
        offset += chunk.length
      }

      const buffer = encodeWav(merged, sampleRate)
      ctx.postMessage({ id, type: 'result', payload: { buffer, mimeType: 'audio/wav' } }, [buffer])
    }
  } catch (err) {
    ctx.postMessage({ id, type: 'error', payload: err instanceof Error ? err.message : String(err) })
  }
}
