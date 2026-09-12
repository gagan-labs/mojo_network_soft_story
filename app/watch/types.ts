// The structure of the video data coming from your API
export interface ApiVideo {
  id: number
  story_title: string
  story_description: string
  slug: string
  generated_story_url: string
  reporter_name: string
  channel_name: string
  domain: string
  story_thumbnail?: string
  favicon?: string | null
}

// The structure of the video data used by our components
export interface Video {
  id: string // Using slug for unique ID in the app
  storyId?: number
  title: string
  description: string
  slug: string
  src: string
  reporterName: string
  channelName: string
  domain: string
  thumbnail?: string
  favicon?: string | null
}
