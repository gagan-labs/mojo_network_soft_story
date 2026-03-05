"use client"

import { Share2 } from "lucide-react"
import { useState } from "react"
import type { Video } from "../types"

interface ShareButtonProps {
  video: Video
  customIcon?: React.ReactNode
  className?: string
  iconSize?: number
}

export function ShareButton({ video, customIcon, className, iconSize = 26 }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const shareUrl = window.location.href
    const shareData = {
      title: `Check out this story: ${video.title}`,
      text: `Watch "${video.title}" from ${video.channelName}`,
      url: shareUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      onClick={handleShare}
      className={`cursor-pointer ${className}`}
      aria-label="Share video"
    >
      {copied ? (
        <span className="text-[10px] font-bold">Copied!</span>
      ) : (
        customIcon || <Share2 size={iconSize} className="icon-shadow" />
      )}
    </div>
  )
}
