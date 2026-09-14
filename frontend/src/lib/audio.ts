/**
 * Mic recordings arrive from MediaRecorder as compressed WebM/Opus (or MP4 in
 * Safari), which the backend's decoder can't read without an ffmpeg backend.
 * We decode with the browser's own codecs and re-encode to 16 kHz mono WAV so
 * the server always receives a format it can read natively.
 */

const TARGET_SAMPLE_RATE = 16000

export async function blobToWavFile(blob: Blob, filename: string): Promise<File> {
  const arrayBuffer = await blob.arrayBuffer()
  const decodeCtx = new AudioContext()
  let decoded: AudioBuffer
  try {
    decoded = await decodeCtx.decodeAudioData(arrayBuffer)
  } finally {
    decodeCtx.close()
  }

  const mono = downmixToMono(decoded)
  const resampled = await resample(mono, decoded.sampleRate, TARGET_SAMPLE_RATE)
  const wav = encodeWav(resampled, TARGET_SAMPLE_RATE)
  return new File([wav], filename, { type: "audio/wav" })
}

function downmixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0).slice()
  const length = buffer.length
  const out = new Float32Array(length)
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < length; i++) out[i] += data[i]
  }
  for (let i = 0; i < length; i++) out[i] /= buffer.numberOfChannels
  return out
}

async function resample(samples: Float32Array, fromRate: number, toRate: number): Promise<Float32Array> {
  if (fromRate === toRate) return samples
  const frames = Math.ceil((samples.length * toRate) / fromRate)
  const offline = new OfflineAudioContext(1, frames, toRate)
  const buffer = offline.createBuffer(1, samples.length, fromRate)
  buffer.copyToChannel(new Float32Array(samples), 0)
  const source = offline.createBufferSource()
  source.buffer = buffer
  source.connect(offline.destination)
  source.start()
  const rendered = await offline.startRendering()
  return rendered.getChannelData(0).slice()
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, "RIFF")
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(8, "WAVE")
  writeString(12, "fmt ")
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeString(36, "data")
  view.setUint32(40, samples.length * 2, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }

  return new Blob([buffer], { type: "audio/wav" })
}
