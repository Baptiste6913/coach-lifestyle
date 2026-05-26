'use client'

import { useEffect, useRef, useState } from 'react'
import { Timer } from 'lucide-react'

type Props = {
  totalSeconds: number
  onComplete: (actualSeconds: number) => void
  onSkip: (actualSeconds: number) => void
  nextLabel?: string
}

export function RestTimer({
  totalSeconds,
  onComplete,
  onSkip,
  nextLabel,
}: Props) {
  const [adjustedTotal, setAdjustedTotal] = useState(totalSeconds)
  const startedAtRef = useRef<number>(Date.now())
  const [now, setNow] = useState(Date.now())
  const completedRef = useRef(false)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  const elapsedS = Math.floor((now - startedAtRef.current) / 1000)
  const remaining = Math.max(0, adjustedTotal - elapsedS)

  useEffect(() => {
    if (remaining === 0 && !completedRef.current) {
      completedRef.current = true
      try {
        navigator.vibrate?.([200, 80, 200])
      } catch {}
      try {
        const ctx = new (window.AudioContext ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = 880
        osc.connect(gain)
        gain.connect(ctx.destination)
        gain.gain.setValueAtTime(0.18, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        osc.start()
        osc.stop(ctx.currentTime + 0.4)
        setTimeout(() => ctx.close(), 600)
      } catch {}
      onComplete(elapsedS)
    }
  }, [remaining, elapsedS, onComplete])

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const progress = adjustedTotal > 0 ? elapsedS / adjustedTotal : 1

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950/98 px-4 text-white">
      <div className="mb-4 flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400">
        <Timer size={14} aria-hidden="true" />
        Repos
      </div>
      <div className="text-[88px] font-mono font-semibold leading-none tabular-nums">
        {mm}:{ss}
      </div>
      <div className="mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full bg-orange-500 transition-all duration-200"
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>
      {nextLabel && (
        <div className="mt-6 max-w-xs text-center text-sm text-neutral-400">
          Prochain : <span className="text-neutral-200">{nextLabel}</span>
        </div>
      )}
      <div className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={() => setAdjustedTotal((t) => Math.max(elapsedS, t - 15))}
          className="min-h-12 rounded-md border border-neutral-700 bg-neutral-900 px-4 font-mono text-sm tabular-nums hover:bg-neutral-800"
        >
          −15 s
        </button>
        <button
          type="button"
          onClick={() => onSkip(elapsedS)}
          className="min-h-12 rounded-md bg-green-600 px-6 text-sm font-semibold text-white hover:bg-green-500"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={() => setAdjustedTotal((t) => t + 15)}
          className="min-h-12 rounded-md border border-neutral-700 bg-neutral-900 px-4 font-mono text-sm tabular-nums hover:bg-neutral-800"
        >
          +15 s
        </button>
      </div>
    </div>
  )
}
