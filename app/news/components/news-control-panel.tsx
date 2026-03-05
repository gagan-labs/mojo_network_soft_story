"use client"

import { BookOpen, Forward } from "lucide-react"
import { ShareButton } from "../../watch/components/share-button"
import type { NewsVideo } from "../types"

interface NewsControlPanelProps {
    video: NewsVideo
}

export function NewsControlPanel({ video }: NewsControlPanelProps) {
    const handleReadNews = () => {
        window.open(video.newsLink, "_blank", "noopener,noreferrer")
    }

    const containerClasses = "flex items-center gap-4 py-1"
    const buttonClasses = "flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50/50 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all shadow-sm border border-red-100/50 group"
    const iconWrapperClasses = "text-red-400 group-hover:text-red-600 transition-colors"

    return (
        <div className={containerClasses}>
            <ShareButton
                video={video as any}
                className={buttonClasses}
                customIcon={
                    <>
                        <div className={iconWrapperClasses}>
                            <Forward size={18} strokeWidth={2} />
                        </div>
                        <span className="text-[12px] font-bold tracking-tight">Share</span>
                    </>
                }
            />
        </div>
    )
}
