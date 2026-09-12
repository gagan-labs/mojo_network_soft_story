"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Play, Loader2, ArrowLeft, Volume2, VolumeX, ChevronDown, Maximize, Minimize } from "lucide-react"
import { DoubleTap } from "./double-tap"
import { TimelineBar } from "./timeline-bar"
import { ShareButton } from "./share-button"
import type { Video } from "../types"

interface VideoPlayerProps {
  video: Video
  isActive: boolean
  isUiHidden: boolean
  onToggleUiHidden: () => void
}

export function VideoPlayer({ video, isActive, isUiHidden, onToggleUiHidden }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wasPlayingRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [shouldShowSpinner, setShouldShowSpinner] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isLoading && isActive) {
      timer = setTimeout(() => setShouldShowSpinner(true), 500)
    } else {
      setShouldShowSpinner(false)
    }
    return () => clearTimeout(timer)
  }, [isLoading, isActive])

  useEffect(() => {
    if (isActive && videoRef.current && video.src) {
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name === "AbortError") {
          } else if (error.name === "NotAllowedError") {
            if (videoRef.current) {
              videoRef.current.muted = true
              setIsMuted(true)
              videoRef.current.play().catch((fallbackError) => {
                console.error("Playback error after muting fallback:", fallbackError)
                setIsPlaying(false)
              })
            }
          } else if (error.name === "NotSupportedError") {
            console.error("Video format not supported or source invalid:", video.src)
            setIsPlaying(false)
          } else {
            console.error("Playback error:", error)
            setIsPlaying(false)
          }
        })
      }
    } else {
      videoRef.current?.pause()
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        setIsLoading(true)
        setIsDescriptionExpanded(false)
      }
    }
  }, [isActive, video.src])

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => {
      if (videoElement.duration > 0) setProgress(videoElement.currentTime / videoElement.duration)
    }
    const handleLoadedMetadata = () => setDuration(videoElement.duration)
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlayThrough = () => setIsLoading(false)

    videoElement.addEventListener("play", handlePlay)
    videoElement.addEventListener("pause", handlePause)
    videoElement.addEventListener("timeupdate", handleTimeUpdate)
    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata)
    videoElement.addEventListener("waiting", handleWaiting)
    videoElement.addEventListener("canplaythrough", handleCanPlayThrough)

    if (videoElement.readyState >= 3) setIsLoading(false)

    return () => {
      videoElement.removeEventListener("play", handlePlay)
      videoElement.removeEventListener("pause", handlePause)
      videoElement.removeEventListener("timeupdate", handleTimeUpdate)
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
      videoElement.removeEventListener("waiting", handleWaiting)
      videoElement.removeEventListener("canplaythrough", handleCanPlayThrough)
    }
  }, [])

  const togglePlayPause = useCallback(() => {
    if (videoRef.current?.paused) videoRef.current?.play()
    else videoRef.current?.pause()
  }, [])

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }, [])

  const handleSeek = useCallback(
    (newProgress: number) => {
      if (videoRef.current && isFinite(duration)) {
        videoRef.current.currentTime = newProgress * duration
        setProgress(newProgress)
      }
    },
    [duration]
  )

  const handleSeekStart = useCallback(() => {
    if (videoRef.current) {
      wasPlayingRef.current = !videoRef.current.paused
      videoRef.current.pause()
    }
  }, [])

  const handleSeekEnd = useCallback(() => {
    if (videoRef.current && wasPlayingRef.current) {
      videoRef.current.play()
    }
  }, [])

  const handleClose = () => {
    window.location.href = window.location.origin
  }

  const toggleDescription = () => setIsDescriptionExpanded((prev) => !prev)

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">

      {/* ── VIDEO ── */}
      <DoubleTap onDoubleTap={togglePlayPause}>
        <video
          ref={videoRef}
          src={video.src}
          className="w-full h-full object-cover"
          loop
          autoPlay
          playsInline
          /* @ts-ignore */
          webkit-playsinline="true"
          muted={isMuted}
          preload={isActive ? "auto" : "metadata"}
        />
      </DoubleTap>

      {/* ── CENTRE INDICATORS (spinner / pause icon) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
        {shouldShowSpinner && (
          <div className="bg-black/40 p-4 rounded-full backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}
        {!isPlaying && !isLoading && (
          <div className="bg-black/40 p-6 rounded-full backdrop-blur-sm">
            <Play className="w-12 h-12 text-white" fill="white" />
          </div>
        )}
      </div>

      {/* ── GRADIENT SCRIM (bottom 55%) ── */}
      <div
        className={`absolute bottom-0 left-0 right-0 pointer-events-none transition-opacity duration-300 ${isUiHidden ? 'opacity-0' : 'opacity-100'}`}
        style={{
          height: "55%",
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 45%, transparent 100%)",
          zIndex: 20,
        }}
      />

      {/* ── TOP BAR: Back button ── */}
      <div className={`absolute top-0 left-0 right-0 flex items-center px-3 pt-4 transition-opacity duration-300 ${isUiHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ zIndex: 40 }}>
        <button
          onClick={handleClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white active:scale-95 transition-transform"
          aria-label="Back"
        >
          <ArrowLeft size={13} strokeWidth={2.5} />
          <span className="text-[11px] font-bold tracking-wide">Back</span>
        </button>
      </div>

      {/* ── RIGHT SIDEBAR: Actions ── */}
      <div
        className="absolute right-3 flex flex-col items-center gap-4"
        style={{ bottom: "36px", zIndex: 40 }}
      >
        <div className={`flex flex-col gap-4 transition-opacity duration-300 ${isUiHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Mute */}
          <button
            onClick={toggleMute}
            className="flex flex-col items-center gap-1 group"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white group-active:scale-95 transition-transform">
              {isMuted
                ? <VolumeX size={18} strokeWidth={2} />
                : <Volume2 size={18} strokeWidth={2} />}
            </div>
            <span className="text-[9px] font-semibold text-white/75 tracking-wide uppercase">
              {isMuted ? "Unmute" : "Sound"}
            </span>
          </button>

          {/* Share */}
          <button
            className="flex flex-col items-center gap-1 group"
            aria-label="Share"
          >
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white group-active:scale-95 transition-transform">
              <ShareButton video={video} iconSize={18} className="" />
            </div>
            <span className="text-[9px] font-semibold text-white/75 tracking-wide uppercase">Share</span>
          </button>
        </div>

        {/* Clear Mode Toggle */}
        <button
          onClick={onToggleUiHidden}
          className="flex flex-col items-center gap-1 group"
          aria-label={isUiHidden ? "Show UI" : "Clear UI"}
        >
          <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white group-active:scale-95 transition-transform">
            {isUiHidden ? <Minimize size={18} strokeWidth={2} /> : <Maximize size={18} strokeWidth={2} />}
          </div>
          <span className={`text-[9px] font-semibold text-white/75 tracking-wide uppercase transition-opacity duration-300 ${isUiHidden ? 'opacity-0' : 'opacity-100'}`}>
            Clear
          </span>
        </button>
      </div>

      {/* ── BOTTOM INFO PANEL ── */}
      <div
        className={`absolute bottom-0 left-0 right-0 flex flex-col transition-opacity duration-300 ${isUiHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ zIndex: 30, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Info content — sits above timeline */}
        <div className="px-4 pb-0 pr-16">
          {/* Reporter · Channel row */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mb-1.5">
            <span className="text-white font-bold text-[15px] leading-tight">{video.reporterName}</span>
            <span className="text-white/40 text-[13px]">·</span>
            <span className="text-emerald-400 font-semibold text-[14px] leading-tight">{video.channelName}</span>
          </div>

          {/* ─ Title (1 line collapsed, full when expanded) ─ */}
          <h3
            className={`text-white font-extrabold text-[17px] leading-snug tracking-tight ${isDescriptionExpanded ? "mb-2" : "mb-0 truncate"
              }`}
          >
            {video.title}
          </h3>

          {/* ─ Description + more/less toggle ─ */}
          <div
            onClick={() => setIsDescriptionExpanded((p) => !p)}
            className="cursor-pointer pointer-events-auto mt-1"
          >
            {isDescriptionExpanded ? (
              <>
                <p className="text-white/80 text-[13px] leading-relaxed">
                  {video.description}
                </p>
                <span className="text-white/50 text-[12px] font-bold mt-1 inline-block">less</span>
              </>
            ) : (
              <span className="text-white/55 text-[12px] font-bold">more</span>
            )}
          </div>
        </div>

        {/* ── DOMAIN NAME ── */}
        <div className="w-full flex justify-center pb-1.5 pointer-events-none">
          <span className="text-white/40 text-[10px] font-semibold tracking-wider">
            {video.domain}
          </span>
        </div>

        {/* ── TIMELINE — pinned to absolute bottom edge ── */}
        <div className="w-full" style={{ zIndex: 50 }}>
          <TimelineBar
            progress={progress}
            duration={duration}
            onSeek={handleSeek}
            onSeekStart={handleSeekStart}
            onSeekEnd={handleSeekEnd}
          />
        </div>
      </div>
    </div>
  )
}