/**
 * Local, offline neural text-to-speech powered by Piper voices running
 * fully in the browser via WebAssembly + ONNX Runtime (@diffusionstudio/vits-web).
 *
 * This replaces the old approach of trying to "record" the Web Speech API
 * (speechSynthesis), which browsers do not expose as a capturable audio
 * stream — that approach could only ever capture silence, microphone
 * noise, or synthetic beep tones, never the spoken text.
 */
import * as vits from '@diffusionstudio/vits-web'
import type { Progress, Voice, VoiceId } from '@diffusionstudio/vits-web'

export type { Progress, Voice, VoiceId }

let voiceListCache: Voice[] | null = null

/** All Piper voices available for download, fetched once and cached. */
export const listVoices = async (): Promise<Voice[]> => {
  if (!voiceListCache) {
    voiceListCache = await vits.voices()
  }
  return voiceListCache
}

/** Voice ids whose model files are already downloaded to this browser. */
export const getStoredVoiceIds = (): Promise<VoiceId[]> => vits.stored()

/** Pre-download a voice model so speech generation doesn't stall later. */
export const downloadVoice = (
  voiceId: VoiceId,
  onProgress?: (progress: Progress) => void,
): Promise<void> => vits.download(voiceId, onProgress)

/**
 * Synthesize speech for the given text using a local Piper voice.
 * Downloads the voice model on first use (cached in OPFS afterwards).
 * Returns a real, playable/downloadable WAV blob.
 */
export const synthesizeSpeech = (
  text: string,
  voiceId: VoiceId,
  onProgress?: (progress: Progress) => void,
): Promise<Blob> => vits.predict({ text, voiceId }, onProgress)
