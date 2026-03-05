export const dynamic = "force-dynamic"

import { headers } from "next/headers"
import { NewsVideoFeed } from "../components/news-video-feed"
import type { ApiNewsVideo, NewsVideo, PortalSettings } from "../types"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const domainName = await getDomainName("subdomain")
    const { settings } = await getNewsData(id, domainName)

    return {
        title: settings?.channel_name || "Mojo Network",
        icons: {
            icon: settings?.portal_favicon || "/favicon.ico",
        },
    }
}

async function getDomainName(mode: "subdomain" | "full" = "subdomain"): Promise<string> {
    const headersList = await headers()
    const host = headersList.get("host") || ""

    const IS_LOCAL = host.startsWith("localhost") || host.startsWith("127.0.0.1")
    const SAAS_MAIN_DOMAIN = "mojonetwork.in"

    const IS_IP =
        /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || // IPv4
        /^\[?[a-fA-F0-9:]+\]?$/.test(host)

    if (IS_LOCAL || IS_IP) {
        return mode === "full" ? host : "test" // Default to 'test' as per user request
    }

    if (mode === "full") {
        return host
    }

    if (host.endsWith(SAAS_MAIN_DOMAIN)) {
        return host.replace(`.${SAAS_MAIN_DOMAIN}`, "")
    }

    return host.replace(/^www\./, "")
}

async function getNewsData(id: string, domainName: string): Promise<{ videos: NewsVideo[]; settings: PortalSettings | null }> {
    try {
        const fullDomain = await getDomainName("full")
        const formData = new FormData()
        formData.append("page_no", "0")
        formData.append("domain_name", domainName)
        formData.append("video_id", id)

        const res = await fetch(`${process.env.API_URL}/newsVideoWatch`, {
            method: "POST",
            body: formData,
        })

        if (!res.ok) {
            const errorText = await res.text().catch(() => "No error body")
            console.error(`Failed to fetch news data: ${res.status} ${res.statusText} - ${errorText}`)
            return { videos: [], settings: null }
        }

        const response = await res.json()
        const { settings, videos: apiVideos } = response.data

        if (!Array.isArray(apiVideos)) {
            console.error("API did not return an array of news videos")
            return { videos: [], settings }
        }

        const videos = apiVideos.map((apiVideo: ApiNewsVideo) => ({
            id: apiVideo.id.toString(),
            title: apiVideo.news_title,
            description: apiVideo.news_sub_title,
            slug: apiVideo.slug,
            src: apiVideo.news_video_url,
            thumbnail: apiVideo.thumbnail_url,
            reporterName: apiVideo.reporter_name,
            channelName: apiVideo.channel_name,
            domain: fullDomain,
            newsLink: apiVideo.news_link,
            publishDate: apiVideo.publish_date,
        }))

        return { videos, settings }
    } catch (error) {
        console.error("Failed to fetch news data:", error)
        return { videos: [], settings: null }
    }
}

export default async function NewsVideoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const domainName = await getDomainName("subdomain")
    const getFullDomainName = await getDomainName("full")
    const { videos, settings } = await getNewsData(id, domainName)

    if (!videos.length) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black text-white">
                <div className="text-center px-4">
                    <h2 className="text-2xl font-semibold">Video Unavailable</h2>
                    <p className="text-neutral-400 mt-2">The requested news video isn't available at the moment.</p>
                    <p className="text-neutral-500 mt-4">{getFullDomainName}</p>
                </div>
            </div>
        )
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900">
            <NewsVideoFeed videos={videos} initialId={id} domainName={domainName} settings={settings} />
        </main>
    )
}
