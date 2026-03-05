"use client"

import { Volume2, VolumeX, BookOpen, Forward } from "lucide-react"
import { ShareButton } from "../../watch/components/share-button"
import type { NewsVideo } from "../types"

interface NewsControlPanelProps {
    video: NewsVideo
    isMuted: boolean
    onMuteToggle: () => void
    layout?: "vertical" | "horizontal"
}

export function NewsControlPanel({ video, isMuted, onMuteToggle, layout = "vertical" }: NewsControlPanelProps) {
    const handleReadNews = () => {
        window.open(video.newsLink, "_blank", "noopener,noreferrer")
    }

    const containerClasses = layout === "horizontal"
        ? "flex items-center gap-5"
        : "flex flex-col items-center gap-4"

    const buttonClasses = "flex flex-col items-center gap-1.5 group transition-all"
    const iconWrapperClasses = layout === "horizontal"
        ? "p-2 rounded-full bg-gray-50 text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm border border-gray-100"
        : "p-2.5 rounded-full bg-black/20 text-white group-hover:bg-blue-600 transition-all backdrop-blur-sm"

    return (
        <div className={containerClasses}>
            <button onClick={handleReadNews} className={buttonClasses} aria-label="Read news article">
                <div className={iconWrapperClasses}>
                    <BookOpen size={20} strokeWidth={1.5} />
                </div>
                {layout === "vertical" && <span className="text-[11px] font-bold tracking-tight">Read</span>}
            </button>

            <div className={buttonClasses}>
                <div className={iconWrapperClasses}>
                    <ShareButton video={video as any} customIcon={<Forward size={20} strokeWidth={1.5} />} />
                </div>
                {layout === "vertical" && <span className="text-[11px] font-bold tracking-tight">Share</span>}
            </div>

            <button onClick={onMuteToggle} className={buttonClasses} aria-label={isMuted ? "Unmute" : "Mute"}>
                <div className={iconWrapperClasses}>
                    {isMuted ? <VolumeX size={20} strokeWidth={1.5} /> : <Volume2 size={20} strokeWidth={1.5} />}
                </div>
                {layout === "vertical" && <span className="text-[11px] font-bold tracking-tight">Mute</span>}
            </button>
        </div>
    )
}
