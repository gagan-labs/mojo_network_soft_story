export interface ApiNewsVideo {
    id: number
    create_date: string
    update_date: string
    user_news_id: number
    user_id: number
    news_video: string
    status: number
    news_title: string
    news_sub_title: string
    news_thumbnail: string
    slug: string
    news_category: string
    publish_date: string
    news_video_url: string
    thumbnail_url: string
    reporter_name: string
    channel_name: string
    news_link: string
}

export interface PortalSettings {
    portal_logo: string
    portal_favicon: string
    channel_name: string
}

export interface NewsVideo {
    id: string
    title: string
    description: string
    slug: string
    src: string
    thumbnail: string
    reporterName: string
    channelName: string
    domain: string
    newsLink: string
    publishDate: string
}
