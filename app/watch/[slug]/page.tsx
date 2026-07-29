export const dynamic = "force-dynamic"

import { headers } from "next/headers"
import { VideoFeed } from "../components/video-feed"
import type { ApiVideo, Video } from "../types"
import type { Metadata, ResolvingMetadata } from "next"


async function getDomainName(mode: "subdomain" | "full" = "subdomain"): Promise<string> {
  const headersList = await headers()
  const host = headersList.get("host") || ""

  const IS_LOCAL = host.startsWith("localhost") || host.startsWith("127.0.0.1")
  const SAAS_MAIN_DOMAIN = "mojonetwork.in"

    const IS_IP =
    /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || // IPv4
    /^\[?[a-fA-F0-9:]+\]?$/.test(host)

  if (IS_LOCAL || IS_IP) {
    return mode === "full" ? host : "digitaldesknews.com"
  }

  if (mode === "full") {
    return host // Always return entire host as it is
  }

  // MODE: 'subdomain'
  if (host.endsWith(SAAS_MAIN_DOMAIN)) {
    return host.replace(`.${SAAS_MAIN_DOMAIN}`, "") // return subdomain
  }

  return host.replace(/^www\./, "") // returns sagar.com (as domain identifier)
}

async function getVideos(slug: string, domainName: string): Promise<Video[]> {
  try {
    const fullDomain = await getDomainName("full")
    const formData = new FormData()
    formData.append("page_no", "0")
    formData.append("domain_name", domainName)
    formData.append("slug", slug)

    const res = await fetch(`${process.env.API_URL}/softStoryWatch`, {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => "No error body")
      console.error(`Failed to fetch videos: ${res.status} ${res.statusText} - ${errorText}`)
      return []
    }

    const response = await res.json()
    const data = response.data

    if (!Array.isArray(data)) {
      console.error("API did not return an array of videos")
      return []
    }

    return data.map((apiVideo: any) => ({
      id: apiVideo.slug,
      title: apiVideo.story_title,
      description: apiVideo.story_description,
      slug: apiVideo.slug,
      src: apiVideo.generated_story_url,
      reporterName: apiVideo.reporter_name,
      channelName: apiVideo.channel_name,
      domain: fullDomain,
      thumbnail: apiVideo.story_thumbnail,
      favicon: apiVideo.favicon,
    }))
  } catch (error) {
    console.error("Failed to fetch videos:", error)
    return []
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params
  const domainName = await getDomainName('subdomain')
  const videos = await getVideos(slug, domainName)

  if (!videos.length) {
    return {
      title: 'Story Not Found',
    }
  }

  const video = videos.find(v => v.slug === slug) || videos[0]
  
  const previousImages = (await parent).openGraph?.images || []
  const images = video.thumbnail ? [video.thumbnail, ...previousImages] : previousImages

  return {
    title: video.title,
    description: video.description,
    openGraph: {
      title: video.title,
      description: video.description,
      images,
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: video.title,
      description: video.description,
      images,
    },
    icons: video.favicon ? {
      icon: video.favicon,
      shortcut: video.favicon,
      apple: video.favicon,
    } : undefined,
  }
}

export default async function SoftStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const domainName = await getDomainName('subdomain');
  const getFullDomainName = await getDomainName('full');
  const videos = await getVideos(slug, domainName);

  if (!videos.length) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="text-center px-4">
          <h2 className="text-2xl font-semibold">Story Unavailable</h2>
          <p className="text-neutral-400 mt-2">The requested story isn't available at the moment.</p>
          <p className="text-neutral-500 mt-4">{getFullDomainName}</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900">
      <VideoFeed videos={videos} initialSlug={slug} domainName={domainName} />
    </main>
  )
}
