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
  const timelineContainerRef = useRef<HTMLDivElement>(null)
  const [isSeeking, setIsSeeking] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverPosition, setHoverPosition] = useState(0)

  const formatTime = (time: number) => {
    if (isNaN(time) || time === Number.POSITIVE_INFINITY) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleSeek = useCallback(
    (clientX: number) => {
      if (!timelineContainerRef.current) return
      const rect = timelineContainerRef.current.getBoundingClientRect()
      const newProgress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      onSeek(newProgress)
    },
    [onSeek],
  )

  const handleInteractionStart = (clientX: number) => {
    onSeekStart?.()
    setIsSeeking(true)
    handleSeek(clientX)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleInteractionStart(e.clientX)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    handleInteractionStart(e.touches[0].clientX)
  }

  useEffect(() => {
    const handleInteractionMove = (clientX: number) => {
      if (isSeeking) {
        handleSeek(clientX)
      }
    }

    const handleMouseMove = (e: MouseEvent) => handleInteractionMove(e.clientX)
    const handleTouchMove = (e: TouchEvent) => handleInteractionMove(e.touches[0].clientX)

    const handleInteractionEnd = () => {
      setIsSeeking(false)
      onSeekEnd?.()
    }

    if (isSeeking) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleInteractionEnd)
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("touchend", handleInteractionEnd)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleInteractionEnd)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleInteractionEnd)
    }
  }, [isSeeking, handleSeek, onSeekEnd])

  const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineContainerRef.current) return
    const rect = timelineContainerRef.current.getBoundingClientRect()
    const hoverProgress = (e.clientX - rect.left) / rect.width
    setHoverTime(hoverProgress * duration)
    setHoverPosition(e.clientX - rect.left)
  }

  const handleMouseLeave = () => {
    setHoverTime(null)
  }

  return (
    <div className="w-full flex items-center gap-2.5 group">
      <span className="text-[11px] font-mono font-medium text-white text-shadow drop-shadow-sm min-w-[36px] text-right tracking-tight">
        {formatTime(progress * duration)}
      </span>
      <div
        ref={timelineContainerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseMove={handleHover}
        onMouseLeave={handleMouseLeave}
        className="relative flex-grow cursor-pointer py-2"
      >
        <div className="relative w-full h-1.5 bg-white/30 rounded-full">
          <div className="absolute top-0 left-0 h-full bg-white rounded-full" style={{ width: `${progress * 100}%` }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow-md transform opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress * 100}% - 8px)` }}
          />
        </div>
        {hoverTime !== null && !isSeeking && (
          <div
            className="absolute bottom-full mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded shadow-lg"
            style={{ left: `${hoverPosition}px`, transform: "translateX(-50%)" }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>
      <span className="text-[11px] font-mono font-medium text-white/90 text-shadow drop-shadow-sm min-w-[36px] tracking-tight">
        {formatTime(duration)}
      </span>
    </div>
  )
}
