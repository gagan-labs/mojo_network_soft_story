"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"

interface TimelineBarProps {
  progress: number
  duration: number
  onSeek: (progress: number) => void
  onSeekStart?: () => void
  onSeekEnd?: () => void
}

export function TimelineBar({ progress, duration, onSeek, onSeekStart, onSeekEnd }: TimelineBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isSeeking, setIsSeeking] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [hoverRatio, setHoverRatio] = useState<number | null>(null)

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return "0:00"
    const m = Math.floor(time / 60)
    const s = Math.floor(time % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const getRatioFromClientX = useCallback((clientX: number) => {
    if (!trackRef.current) return 0
    const { left, width } = trackRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - left) / width))
  }, [])

  const startSeek = useCallback(
    (clientX: number) => {
      onSeekStart?.()
      setIsSeeking(true)
      onSeek(getRatioFromClientX(clientX))
    },
    [onSeekStart, onSeek, getRatioFromClientX]
  )

  useEffect(() => {
    if (!isSeeking) return
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      onSeek(getRatioFromClientX(clientX))
    }
    const onEnd = () => {
      setIsSeeking(false)
      onSeekEnd?.()
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onEnd)
    window.addEventListener("touchmove", onMove)
    window.addEventListener("touchend", onEnd)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onEnd)
      window.removeEventListener("touchmove", onMove)
      window.removeEventListener("touchend", onEnd)
    }
  }, [isSeeking, onSeek, onSeekEnd, getRatioFromClientX])

  const active = isHovering || isSeeking
  const trackHeight = active ? 4 : 2
  const thumbSize = active ? 14 : 0

  return (
    <div className="relative w-full select-none">
      {/* Time tooltip on hover */}
      {hoverRatio !== null && active && (
        <div
          className="absolute -top-7 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono pointer-events-none"
          style={{
            left: `${hoverRatio * 100}%`,
            transform: "translateX(-50%)",
            zIndex: 60,
          }}
        >
          {formatTime(hoverRatio * duration)}
        </div>
      )}



      {/* Track — edge-to-edge, no horizontal padding */}
      <div
        ref={trackRef}
        className="w-full relative cursor-pointer"
        style={{
          height: "28px",          // large hit target
          display: "flex",
          alignItems: "flex-end",  // bar sits at the bottom edge
          touchAction: "none",
        }}
        onMouseDown={(e) => { e.preventDefault(); startSeek(e.clientX) }}
        onTouchStart={(e) => startSeek(e.touches[0].clientX)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => { setIsHovering(false); setHoverRatio(null) }}
        onMouseMove={(e) => setHoverRatio(getRatioFromClientX(e.clientX))}
      >
        {/* Background track */}
        <div
          className="w-full rounded-none relative overflow-visible transition-all duration-150"
          style={{ height: `${trackHeight}px`, backgroundColor: "rgba(255,255,255,0.25)" }}
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 h-full rounded-none"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(to right, #ff4545, #ff7b54)",
            }}
          />

          {/* Thumb knob */}
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg transition-all duration-150"
            style={{
              width: thumbSize,
              height: thumbSize,
              left: `calc(${progress * 100}% - ${thumbSize / 2}px)`,
              opacity: active ? 1 : 0,
              boxShadow: active ? "0 0 0 3px rgba(255,69,69,0.35)" : "none",
            }}
          />
        </div>
      </div>
    </div>
  )
}
