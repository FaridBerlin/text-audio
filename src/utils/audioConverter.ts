/**
 * Audio format conversion and download helpers.
 */
import lamejs from '@breezystack/lamejs'

const MP3_SAMPLE_BLOCK_SIZE = 1152

const floatTo16BitPcm = (channel: Float32Array): Int16Array => {
  const samples = new Int16Array(channel.length)
  for (let i = 0; i < channel.length; i++) {
    samples[i] = Math.max(-1, Math.min(1, channel[i])) * 0x7fff
  }
  return samples
}

/** Encode an AudioBuffer to an MP3 blob using lamejs. */
const encodeAudioBufferToMp3 = (audioBuffer: AudioBuffer, bitrate: number): Blob => {
  const numberOfChannels = Math.min(audioBuffer.numberOfChannels, 2)
  const encoder = new lamejs.Mp3Encoder(numberOfChannels, audioBuffer.sampleRate, bitrate)
  const chunks: Int8Array[] = []

  const left = floatTo16BitPcm(audioBuffer.getChannelData(0))
  const right = numberOfChannels === 2 ? floatTo16BitPcm(audioBuffer.getChannelData(1)) : undefined

  for (let i = 0; i < left.length; i += MP3_SAMPLE_BLOCK_SIZE) {
    const leftChunk = left.subarray(i, i + MP3_SAMPLE_BLOCK_SIZE)
    const chunk = right
      ? encoder.encodeBuffer(leftChunk, right.subarray(i, i + MP3_SAMPLE_BLOCK_SIZE))
      : encoder.encodeBuffer(leftChunk)
    if (chunk.length > 0) chunks.push(chunk)
  }

  const finalChunk = encoder.flush()
  if (finalChunk.length > 0) chunks.push(finalChunk)

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const mp3Buffer = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    mp3Buffer.set(chunk, offset)
    offset += chunk.length
  }

  return new Blob([mp3Buffer], { type: 'audio/mpeg' })
}

/** Convert a decodable audio blob (e.g. WAV) to an MP3 blob. */
export const convertToMp3 = async (audioBlob: Blob, bitrate = 128): Promise<Blob> => {
  const audioContext = new AudioContext()
  try {
    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    return encodeAudioBufferToMp3(audioBuffer, bitrate)
  } finally {
    await audioContext.close()
  }
}

/** Trigger a browser download of a blob. */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
