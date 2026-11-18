// Utility for playing order notification sound using MP3 file with Web Audio API and HTMLAudioElement
// Plays notification.mp3 completely from start to end according to its natural duration (~1.85s)
// Strictly prevents premature cutting, stopping, or interruption.

const NOTIFICATION_SOUND_PATH = '/sounds/notification.mp3'

type AutoplayCallback = (blocked: boolean) => void

class SoundPlayer {
  private ctx: AudioContext | null = null
  private audioBuffer: AudioBuffer | null = null
  private audioElement: HTMLAudioElement | null = null
  private isAudioUnlocked = false
  private hasInteractionListener = false
  private isBufferLoading = false
  private isPlaying = false
  private onAutoplayBlocked: AutoplayCallback | null = null
  private assetVersion = Date.now()
  private currentVolume = 0.8

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const storedVol = localStorage.getItem('ojolali_order_volume')
        if (storedVol !== null) {
          const parsed = parseFloat(storedVol)
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.currentVolume = parsed
          }
        }
      } catch {
        // Fallback default
      }

      this.setupAutoUnlockListener()
      // Pre-load audio buffer and HTML audio element
      setTimeout(() => {
        this.getAudioElement()
        this.loadAudioBuffer()
      }, 200)
    }
  }

  // Set playback volume (0.0 to 1.0)
  setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol))
    if (this.audioElement) {
      try {
        this.audioElement.volume = this.currentVolume
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ojolali_order_volume', this.currentVolume.toString())
      } catch {
        // ignore
      }
    }
  }

  getVolume(): number {
    return this.currentVolume
  }

  // Register callback to notify UI if autoplay is blocked by browser
  setAutoplayBlockedCallback(cb: AutoplayCallback | null) {
    this.onAutoplayBlocked = cb
  }

  // Set up passive interaction listener to automatically unlock audio on user gesture
  private setupAutoUnlockListener() {
    if (this.hasInteractionListener || typeof window === 'undefined') return
    this.hasInteractionListener = true

    const unlockHandler = () => {
      this.unlockAudio()
      window.removeEventListener('pointerdown', unlockHandler)
      window.removeEventListener('keydown', unlockHandler)
      window.removeEventListener('click', unlockHandler)
    }

    window.addEventListener('pointerdown', unlockHandler, { passive: true })
    window.addEventListener('keydown', unlockHandler, { passive: true })
    window.addEventListener('click', unlockHandler, { passive: true })
  }

  // Initialize or get the HTMLAudioElement
  private getAudioElement(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null
    if (!this.audioElement) {
      try {
        const audio = new Audio(`${NOTIFICATION_SOUND_PATH}?v=${this.assetVersion}`)
        audio.preload = 'auto'
        audio.volume = 1.0
        audio.muted = false
        this.audioElement = audio
      } catch (e) {
        console.warn('Failed to initialize Audio element:', e)
      }
    }
    return this.audioElement
  }

  // Initialize AudioContext safely
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AudioCtx) {
          this.ctx = new AudioCtx()
        }
      } catch (e) {
        console.warn('Failed to create AudioContext:', e)
      }
    }
    return this.ctx
  }

  // Prefetch and decode MP3 into Web Audio buffer for instant, background-friendly playback
  async loadAudioBuffer(forceReload = false): Promise<boolean> {
    if (typeof window === 'undefined') return false
    if (this.audioBuffer && !forceReload) return true
    if (this.isBufferLoading) return false

    const ctx = this.getAudioContext()
    if (!ctx) return false

    this.isBufferLoading = true
    try {
      const url = `${NOTIFICATION_SOUND_PATH}?v=${forceReload ? Date.now() : this.assetVersion}`
      const res = await fetch(url, { cache: forceReload ? 'no-cache' : 'default' })
      if (!res.ok) {
        this.isBufferLoading = false
        return false
      }
      const arrayBuffer = await res.arrayBuffer()
      // Decode audio data supporting both callback and promise syntax across browsers
      this.audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        ctx.decodeAudioData(
          arrayBuffer,
          (buffer) => resolve(buffer),
          (err) => reject(err)
        )
      })
      this.isBufferLoading = false
      return true
    } catch (e) {
      this.isBufferLoading = false
      console.warn('Could not decode audio buffer into Web Audio context:', e)
      return false
    }
  }

  // Must be called from or triggered by a user interaction event handler
  // Never calls audio.load() while audio is actively playing!
  unlockAudio(): boolean {
    if (typeof window === 'undefined') return false

    let unlocked = false

    // 1. Unlock AudioContext
    try {
      const ctx = this.getAudioContext()
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            this.onAutoplayBlocked?.(false)
          }).catch(() => {})
        }
        unlocked = true
        if (!this.audioBuffer && !this.isBufferLoading) {
          this.loadAudioBuffer()
        }
      }
    } catch (e) {
      console.warn('AudioContext unlock error:', e)
    }

    // 2. Prime HTML Audio element only if NOT playing and uninitialized
    try {
      const audio = this.getAudioElement()
      if (audio && !this.isPlaying) {
        audio.volume = 1.0
        audio.muted = false
        if (audio.readyState === 0) {
          audio.load()
        }
        unlocked = true
      }
    } catch (e) {
      console.warn('HTMLAudio unlock error:', e)
    }

    this.isAudioUnlocked = unlocked
    if (unlocked) {
      this.onAutoplayBlocked?.(false)
    }
    return unlocked
  }

  isReady(): boolean {
    return Boolean(
      this.isAudioUnlocked ||
        (this.ctx && this.ctx.state === 'running') ||
        (this.audioElement && this.audioElement.readyState >= 2) ||
        this.audioBuffer
    )
  }

  // Play notification MP3 completely from start to natural finish (~1.85s)
  // Returns a Promise that resolves when the audio has completely finished playing.
  async playNotificationSound(): Promise<boolean> {
    if (typeof window === 'undefined') return false

    // Unlock context if needed
    this.unlockAudio()

    // Wait for buffer if it is actively loading
    if (!this.audioBuffer && this.isBufferLoading) {
      let waitCount = 0
      while (!this.audioBuffer && waitCount < 10) {
        await new Promise((r) => setTimeout(r, 50))
        waitCount++
      }
    } else if (!this.audioBuffer) {
      await this.loadAudioBuffer()
    }

    const ctx = this.getAudioContext()

    // 1. Primary Engine: Web Audio API AudioBufferSourceNode
    // Guaranteed to play full buffer to completion without interference from React re-renders or background throttling
    if (ctx && this.audioBuffer) {
      try {
        if (ctx.state === 'suspended') {
          await ctx.resume()
        }

        const source = ctx.createBufferSource()
        source.buffer = this.audioBuffer

        const gainNode = ctx.createGain()
        gainNode.gain.setValueAtTime(this.currentVolume, ctx.currentTime)

        source.connect(gainNode)
        gainNode.connect(ctx.destination)

        this.isPlaying = true

        return new Promise<boolean>((resolve) => {
          let resolved = false
          const finish = () => {
            if (!resolved) {
              resolved = true
              this.isPlaying = false
              this.onAutoplayBlocked?.(false)
              resolve(true)
            }
          }

          // Natural completion event from Web Audio API
          source.onended = finish

          // Play naturally from start (0). Do NOT call source.stop()!
          source.start(0)

          // Dynamic safety timeout derived directly from buffer duration + 600ms buffer
          const safetyMs = (this.audioBuffer?.duration || 2) * 1000 + 600
          setTimeout(finish, safetyMs)
        })
      } catch (e) {
        console.warn('Web Audio buffer playback failed, falling back to HTMLAudio:', e)
        this.isPlaying = false
      }
    }

    // 2. Secondary Engine: HTMLAudioElement
    // Plays the MP3 naturally until 'ended' event fires
    try {
      const audio = this.getAudioElement()
      if (audio) {
        audio.volume = this.currentVolume
        audio.muted = false

        if (!this.isPlaying || audio.paused || audio.ended) {
          audio.currentTime = 0
        }

        this.isPlaying = true

        return new Promise<boolean>((resolve) => {
          let resolved = false
          const cleanup = () => {
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('error', handleError)
          }

          const handleEnded = () => {
            if (!resolved) {
              resolved = true
              cleanup()
              this.isPlaying = false
              this.onAutoplayBlocked?.(false)
              resolve(true)
            }
          }

          const handleError = (e: Event) => {
            if (!resolved) {
              resolved = true
              cleanup()
              this.isPlaying = false
              console.warn('HTMLAudio error during playback:', e)
              resolve(false)
            }
          }

          audio.addEventListener('ended', handleEnded, { once: true })
          audio.addEventListener('error', handleError, { once: true })

          const playPromise = audio.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                this.onAutoplayBlocked?.(false)
              })
              .catch((err: unknown) => {
                const error = err as Error
                if (error?.name === 'NotAllowedError') {
                  this.onAutoplayBlocked?.(true)
                }
                handleEnded()
              })
          }
        })
      }
    } catch (e) {
      console.warn('HTMLAudio playback failed:', e)
      this.isPlaying = false
    }

    return false
  }

  // Play order chime on new order detection
  async playOrderChime(): Promise<boolean> {
    return this.playNotificationSound()
  }

  // Play test sound on "Tes Suara" button click
  async playTestSound(): Promise<boolean> {
    return this.playNotificationSound()
  }

  // Alias for compatibility
  playTestDing(): Promise<boolean> {
    return this.playNotificationSound()
  }
}

export const soundPlayer = new SoundPlayer()
