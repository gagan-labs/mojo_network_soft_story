"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Play, Loader2, Heart, ArrowLeft, User, Clock } from "lucide-react"
import { DoubleTap } from "../../watch/components/double-tap"
import { TimelineBar } from "../../watch/components/timeline-bar"
import { NewsControlPanel } from "./news-control-panel"
import type { NewsVideo } from "../types"

interface NewsVideoPlayerProps {
    video: NewsVideo
    isActive: boolean
}

export function NewsVideoPlayer({ video, isActive }: NewsVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const wasPlayingRef = useRef(false)

    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

    useEffect(() => {
        if (isActive) {
            videoRef.current?.play().catch(() => setIsPlaying(false))
        } else {
            videoRef.current?.pause()
            if (videoRef.current) {
                videoRef.current.currentTime = 0
                setIsLoading(true)
                setIsDescriptionExpanded(false)
            }
        }
    }, [isActive])

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
            videoRef.current.play()
        }
    }, [])

    const handleClose = () => {
        window.location.href = window.location.origin;
    }

    const toggleDescription = () => setIsDescriptionExpanded(!isDescriptionExpanded)

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    return (
        <div className="relative w-full h-full bg-white flex flex-col">
            {/* Back Button - Positioned over video */}
            {/* <button
                onClick={handleClose}
                className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-colors"
                aria-label="Back"
            >
                <ArrowLeft size={20} />
            </button> */}

            {/* Top Segment: Video Player */}
            <div className="relative w-full aspect-video md:aspect-[16/10] bg-black flex-shrink-0 overflow-hidden">
                <DoubleTap onDoubleTap={togglePlayPause}>
                    <video
                        ref={videoRef}
                        src={video.src}
                        className="w-full h-full object-contain"
                        loop
                        playsInline
                        muted={isMuted}
                        preload="metadata"
                        poster={video.thumbnail}
                    />
                </DoubleTap>

                {/* Video Overlay Controls */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {isLoading && (
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

                {/* Video Progress Bar - Moved up to avoid overlap with floating channel tag */}
                <div className="absolute bottom-2 left-0 right-0 z-40 px-3">
                    <TimelineBar
                        progress={progress}
                        duration={duration}
                        onSeek={handleSeek}
                        onSeekStart={handleSeekStart}
                        onSeekEnd={handleSeekEnd}
                    />
                </div>
            </div>

            {/* Bottom Segment: News Content */}
            <div className="flex-grow flex flex-col px-5 py-6 overflow-hidden relative">
                <div className="flex-grow overflow-y-auto no-scrollbar pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <User size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-medium">Article by</span>
                                <span className="text-[11px] text-gray-700 font-bold leading-none">{video.reporterName}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            <Clock size={12} strokeWidth={1.5} />
                            <span className="text-[11px] font-medium">{formatDate(video.publishDate)}</span>
                        </div>
                    </div>

                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-4 tracking-tight">
                        {video.title}
                    </h1>

                    <div className="prose prose-sm max-w-none">
                        <p className="text-[15px] md:text-base text-gray-700 leading-relaxed font-normal">
                            {video.description}
                        </p>
                    </div>
                </div>

                {/* New Ergonomic Footer */}
                <footer className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
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
                            isMuted={isMuted}
                            onMuteToggle={toggleMute}
                            layout="horizontal"
                        />
                    </div>
                </footer>
            </div>
        </div>
    )
}
