"use client"

import { Heart, MessageCircle, Volume2, VolumeX } from "lucide-react"
import { ShareButton } from "./share-button"
import type { Video } from "../types"

interface ControlPanelProps {
  video: Video
  isMuted: boolean
  onMuteToggle: () => void
}

export function ControlPanel({ video, isMuted, onMuteToggle }: ControlPanelProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button className="hidden flex flex-col items-center gap-1 text-white group">
        <div className="p-2.5 rounded-full bg-black/30 group-hover:bg-pink-500 transition-colors">
          <Heart size={26} className="icon-shadow" />
        </div>
        <span className="text-[11px] font-semibold text-shadow">1.2M</span>
      </button>
      <button className="hidden flex flex-col items-center gap-1 text-white group">
        <div className="p-2.5 rounded-full bg-black/30 group-hover:bg-blue-500 transition-colors">
          <MessageCircle size={26} className="icon-shadow" />
        </div>
        <span className="text-[11px] font-semibold text-shadow">3,456</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-white group" aria-label="Share video">
        <div className="p-2.5 rounded-full group-hover:bg-green-500 transition-colors">
          <ShareButton video={video} iconSize={26} className="icon-shadow" />
        </div>
        <span className="text-[11px] font-semibold text-shadow">Share</span>
      </button>
      <button onClick={onMuteToggle} className="flex flex-col items-center gap-1 text-white group mt-2">
        <div className="p-2.5 rounded-full transition-colors">
          {isMuted ? <VolumeX size={26} className="icon-shadow" /> : <Volume2 size={26} className="icon-shadow" />}
        </div>
      </button>
    </div>
  )
}
