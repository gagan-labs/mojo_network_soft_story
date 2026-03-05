"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Play, Loader2, Heart, ArrowLeft, User, Clock, Volume2, VolumeX, BookOpen } from "lucide-react"
import { DoubleTap } from "../../watch/components/double-tap"
import { TimelineBar } from "../../watch/components/timeline-bar"
import { NewsControlPanel } from "./news-control-panel"
import type { NewsVideo } from "../types"

interface NewsVideoPlayerProps {
    video: NewsVideo
    isActive: boolean
    shouldPreload?: boolean
}

export function NewsVideoPlayer({ video, isActive, shouldPreload = false }: NewsVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const wasPlayingRef = useRef(false)

    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [shouldShowSpinner, setShouldShowSpinner] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const resetControlsTimeout = useCallback(() => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        controlsTimeoutRef.current = setTimeout(() => {
            if (videoRef.current && !videoRef.current.paused) {
                setShowControls(false)
            }
        }, 3000)
    }, [])

    const togglePlayPause = useCallback(() => {
        if (videoRef.current?.paused) {
            videoRef.current?.play().catch(() => { })
        } else {
            videoRef.current?.pause()
        }
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
        [duration],
    )

    const handleSeekStart = useCallback(() => {
        if (videoRef.current) {
            wasPlayingRef.current = !videoRef.current.paused
            videoRef.current.pause()
        }
    }, [])

    const handleSeekEnd = useCallback(() => {
        if (videoRef.current && wasPlayingRef.current) {
            videoRef.current.play().catch(() => { })
        }
        resetControlsTimeout()
    }, [resetControlsTimeout])

    const handleVideoTap = useCallback(() => {
        setShowControls((prev) => !prev)
        if (!showControls) {
            resetControlsTimeout()
        } else {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        }
    }, [showControls, resetControlsTimeout])

    const handleClose = () => {
        window.location.href = window.location.origin;
    }

    const toggleDescription = () => setIsDescriptionExpanded(!isDescriptionExpanded)

    const handleReadNews = () => {
        window.open(video.newsLink, "_blank", "noopener,noreferrer")
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

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
        const video = videoRef.current
        if (!video) return

        if (isActive) {
            const playPromise = video.play()
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    if (error.name === "AbortError") {
                        // Ignore interruption errors during fast scrolling
                    } else {
                        console.error("Playback error:", error)
                        setIsPlaying(false)
                    }
                })
            }
            setShowControls(true)
            resetControlsTimeout()
        } else {
            video.pause()
            video.currentTime = 0
            setIsLoading(true)
            setIsDescriptionExpanded(false)
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        }

        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        }
    }, [isActive, resetControlsTimeout])

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

        if (videoElement.readyState >= 1) setDuration(videoElement.duration)
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

    return (
        <div
            className="relative w-full h-full bg-white flex flex-col"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
        >
            {/* Top Segment: Video Player */}
            <div
                className="relative w-full aspect-video md:aspect-[16/10] bg-black flex-shrink-0 overflow-hidden cursor-pointer"
                onClick={handleVideoTap}
            >
                <DoubleTap onDoubleTap={() => togglePlayPause()}>
                    <video
                        ref={videoRef}
                        src={video.src}
                        className="w-full h-full object-contain"
                        loop
                        playsInline
                        muted={isMuted}
                        preload={isActive || shouldPreload ? "auto" : "metadata"}
                        poster={video.thumbnail}
                    />
                </DoubleTap>

                {/* Video Overlay Controls (Play/Pause/Loading) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {shouldShowSpinner && (
                        <div className="bg-black/30 backdrop-blur-sm p-4 rounded-full">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                    )}
                    {!isPlaying && !isLoading && (
                        <div className="bg-black/30 backdrop-blur-sm p-5 rounded-full">
                            <Play className="w-10 h-10 text-white" fill="white" />
                        </div>
                    )}
                </div>

                {/* Video Controls Overlay (Timeline + Mute) */}
                <div
                    className={`absolute bottom-0 left-0 right-0 z-40 p-4 pt-10 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 flex items-end justify-between ${showControls ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'}`}
                    onClick={(e) => e.stopPropagation()} // Prevent tap from bubbling up and hiding controls immediately
                >
                    <div className="flex-grow pr-4">
                        <TimelineBar
                            progress={progress}
                            duration={duration}
                            onSeek={(p) => { handleSeek(p); resetControlsTimeout(); }}
                            onSeekStart={handleSeekStart}
                            onSeekEnd={handleSeekEnd}
                        />
                    </div>

                    {/* Relocated Mute Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleMute(); resetControlsTimeout(); }}
                        className="p-1 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors flex-shrink-0"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                </div>
            </div>

            {/* Bottom Segment: News Content */}
            <div className="flex-grow flex flex-col px-5 pb-6 pt-2 overflow-hidden relative">
                <div className="flex-grow overflow-y-hidden no-scrollbar pt-4 pb-20">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <User size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] text-gray-700 font-bold leading-none">{video.reporterName}</span>
                                <span className="text-[11px] text-gray-400 font-medium">{video.city_name}{video.city_name && ', '} {video.state_name}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            <Clock size={12} strokeWidth={1.5} />
                            <span className="text-[11px] font-medium">{formatDate(video.publishDate)}</span>
                        </div>
                    </div>

                    <div className="mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100/50">
                            {video.categoryName}
                        </span>
                    </div>

                    <h1 className="text-[18px] md:text-2xl font-bold text-gray-900 leading-tight mb-2 tracking-tight">
                        {video.title}
                    </h1>

                    <div className="prose prose-sm max-w-none">
                        <p className="text-[15px] md:text-base text-gray-700 leading-relaxed font-normal">
                            {video.description}
                        </p>
                    </div>
                </div>

                {/* Persistent Floating "Read Full" Overlay - Pinned above footer */}
                {!isDescriptionExpanded && (
                    <div className="absolute bottom-[80px] left-0 right-0 h-32 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none flex items-end justify-center pb-6 z-20">
                        <button
                            onClick={handleReadNews}
                            className="pointer-events-auto text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center gap-2 px-8 py-2.5 rounded-full shadow-lg shadow-red-200 border border-red-500/20 active:scale-95 transform translate-y-2"
                        >
                            <BookOpen size={18} strokeWidth={2} /> Read Full Article
                        </button>
                    </div>
                )}

                {/* New Ergonomic Footer */}
                <footer className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between bg-white z-30">
                    <div className="flex flex-col">
                        <span className="text-[11px] text-gray-400 font-medium italic">
                            swipe up for more
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[11px] text-gray-500 font-bold">{video.domain}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <NewsControlPanel
                            video={video}
                        />
                    </div>
                </footer>
            </div>
        </div>
    )
}
