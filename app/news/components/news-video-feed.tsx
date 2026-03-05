"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { NewsVideoPlayer } from "./news-video-player"
import type { NewsVideo, ApiNewsVideo, PortalSettings } from "../types"
import { usePathname } from "next/navigation"
import { Loader2, ChevronLeft, RotateCcw } from "lucide-react"

interface NewsVideoFeedProps {
    videos: NewsVideo[]
    initialId?: string
    domainName: string
    settings: PortalSettings | null
}

export function NewsVideoFeed({ videos: initialVideos, initialId, domainName, settings }: NewsVideoFeedProps) {
    const pathname = usePathname()
    const containerRef = useRef<HTMLDivElement>(null)

    const [videos, setVideos] = useState<NewsVideo[]>(initialVideos)
    const [currentPage, setCurrentPage] = useState(0)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasMoreVideos, setHasMoreVideos] = useState(true)
    const [showEndMessage, setShowEndMessage] = useState(false)
    const [messageShownForCurrentVisit, setMessageShownForCurrentVisit] = useState(false)

    const [activeIndex, setActiveIndex] = useState(() => {
        if (initialId) {
            const index = initialVideos.findIndex((v) => v.id === initialId)
            return index > -1 ? index : 0
        }
        return 0
    })

    const isLoadingRef = useRef(false)

    const loadMoreVideos = useCallback(async () => {
        if (isLoadingRef.current || !hasMoreVideos) return

        isLoadingRef.current = true
        setIsLoadingMore(true)

        try {
            const formData = new FormData()
            formData.append("page_no", (currentPage + 1).toString())
            formData.append("domain_name", domainName)
            formData.append("video_id", "") // blank id for pagination

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/newsVideoWatch`, {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const errorText = await res.text().catch(() => "")
                throw new Error(`Failed to fetch more news videos: ${res.status} ${res.statusText} ${errorText}`)
            }

            const response = await res.json()
            const { status, data } = response

            if (status === 200 && (!data || !data.videos || data.videos.length === 0)) {
                setHasMoreVideos(false)
                setShowEndMessage(true)
            } else if (data && Array.isArray(data.videos) && data.videos.length > 0) {
                // Filter out any videos that are already in the list to prevent duplicates
                const existingIds = new Set(videos.map(v => v.id))
                const newVideos: NewsVideo[] = data.videos
                    .filter((apiVideo: ApiNewsVideo) => !existingIds.has(apiVideo.id.toString()))
                    .map((apiVideo: ApiNewsVideo) => ({
                        id: apiVideo.id.toString(),
                        title: apiVideo.news_title,
                        description: apiVideo.news_sub_title,
                        slug: apiVideo.slug,
                        src: apiVideo.news_video_url,
                        thumbnail: apiVideo.thumbnail_url,
                        reporterName: apiVideo.reporter_name,
                        channelName: apiVideo.channel_name,
                        domain: domainName,
                        newsLink: apiVideo.news_link,
                        publishDate: apiVideo.publish_date,
                    }))

                if (newVideos.length === 0) {
                    setHasMoreVideos(false)
                    setShowEndMessage(true)
                } else {
                    setVideos((prev) => [...prev, ...newVideos])
                    setCurrentPage((prev) => prev + 1)
                }
            } else {
                setHasMoreVideos(false)
                setShowEndMessage(true)
            }
        } catch (error) {
            console.error("Failed to load more news videos:", error)
            setHasMoreVideos(false)
            setShowEndMessage(true)
        } finally {
            isLoadingRef.current = false
            setIsLoadingMore(false)
        }
    }, [currentPage, domainName, hasMoreVideos, videos])

    useEffect(() => {
        let timeout: NodeJS.Timeout
        if (showEndMessage) {
            timeout = setTimeout(() => {
                setShowEndMessage(false)
            }, 4000)
        }
        return () => clearTimeout(timeout)
    }, [showEndMessage])

    useEffect(() => {
        const isOnLastVideo = activeIndex === videos.length - 1

        if (!isOnLastVideo) {
            if (messageShownForCurrentVisit) {
                setMessageShownForCurrentVisit(false)
            }
            if (showEndMessage) {
                setShowEndMessage(false)
            }
        } else if (isOnLastVideo && !hasMoreVideos && !messageShownForCurrentVisit && !isLoadingMore) {
            setShowEndMessage(true)
            setMessageShownForCurrentVisit(true)
        }
    }, [activeIndex, videos.length, hasMoreVideos, messageShownForCurrentVisit, isLoadingMore, showEndMessage])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = Number.parseInt(entry.target.getAttribute("data-index") || "0", 10)
                        setActiveIndex(index)
                        const video = videos[index]
                        if (video && pathname !== `/news/${video.id}`) {
                            const basePath = window.location.pathname.split("/news")[0]
                            window.history.replaceState(null, "", `${basePath}/news/${video.id}`)
                        }

                        if (index >= videos.length - 2 && hasMoreVideos && !isLoadingRef.current) {
                            loadMoreVideos()
                        }
                    }
                })
            },
            {
                root: container,
                threshold: 0.5,
            },
        )

        const videoElements = container.querySelectorAll(".video-container")
        videoElements.forEach((el) => observer.observe(el))

        return () => {
            videoElements.forEach((el) => observer.unobserve(el))
        }
    }, [pathname, videos, hasMoreVideos, loadMoreVideos])

    useEffect(() => {
        const initialIndex = (() => {
            if (initialId) {
                const index = initialVideos.findIndex((v) => v.id === initialId)
                return index > -1 ? index : 0
            }
            return 0
        })()
        const container = containerRef.current
        if (container && container.children[initialIndex]) {
            const videoElement = container.children[initialIndex] as HTMLElement
            videoElement.scrollIntoView({ behavior: "auto", block: "start" })
        }
    }, [initialVideos, initialId])

    return (
        <div className="relative h-[100dvh] w-full bg-[#f3f3f3] flex flex-col overflow-hidden">
            {/* Top Header - Inshorts Style */}
            <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-50">
                <button onClick={() => window.location.href = '/'} className="flex items-center gap-1 text-gray-600">
                    <ChevronLeft size={20} />
                    <span className="text-sm font-medium uppercase tracking-wider">Back</span>
                </button>
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5">
                        {settings?.portal_favicon && (
                            <img
                                src={settings.portal_favicon}
                                alt="Favicon"
                                className="w-4 h-4 object-contain rounded-sm"
                            />
                        )}
                        <span className="text-sm font-bold text-gray-900">
                            {settings?.channel_name || "My Feed"}
                        </span>
                    </div>
                    <div className="h-0.5 w-8 bg-blue-500 rounded-full mt-0.5" />
                </div>
            </header>

            <div
                ref={containerRef}
                className="flex-grow w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
            >
                {videos.map((video, index) => (
                    <div
                        key={video.id}
                        data-index={index}
                        className="video-container h-full w-full snap-start snap-always flex items-center justify-center relative md:py-4"
                    >
                        {/* Logo Overlay - Now inside the card context but floating */}
                        {settings?.portal_logo && (
                            <div className="absolute top-6 right-6 md:top-8 md:right-[calc(50%-230px)] z-50 pointer-events-none transition-opacity">
                                <img
                                    src={settings.portal_logo}
                                    alt="Portal Logo"
                                    className="h-7 w-auto object-contain filter drop-shadow-sm"
                                />
                            </div>
                        )}

                        <div className="relative h-full w-full md:w-[480px] md:h-[calc(100vh-100px)] md:rounded-xl overflow-hidden md:shadow-xl bg-white">
                            <NewsVideoPlayer video={video} isActive={index === activeIndex} />

                            {index === activeIndex && isLoadingMore && (
                                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40">
                                    <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-sm border border-gray-100">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                        <span className="text-gray-600 text-xs font-medium">Loading More</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
