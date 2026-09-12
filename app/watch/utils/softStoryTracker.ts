/**
 * Background, chunked view tracking for Soft Stories.
 * Uses navigator.sendBeacon and fetch with keepalive to ensure non-blocking,
 * 60fps smooth scrolling performance while accurately capturing views and watch duration.
 */

export interface SoftStoryViewEvent {
  story_id?: number | string
  slug?: string
  watch_time: number // in seconds
  domain_name?: string
}

let eventQueue: SoftStoryViewEvent[] = []
let flushTimer: NodeJS.Timeout | null = null

function getApiBaseUrl(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  return "/api"
}

export function queueStoryView(event: SoftStoryViewEvent) {
  if (!event.story_id && !event.slug) return

  const existing = eventQueue.find(
    (e) =>
      (event.story_id && e.story_id === event.story_id) ||
      (event.slug && e.slug === event.slug)
  )

  if (existing) {
    existing.watch_time += Math.max(0, event.watch_time)
  } else {
    eventQueue.push({
      story_id: event.story_id,
      slug: event.slug,
      watch_time: Math.max(0, event.watch_time),
      domain_name: event.domain_name,
    })
  }

  // Debounce background flush by 2 seconds so chunked requests are sent smoothly
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushStoryViews()
    }, 2000)
  }
}

export function flushStoryViews() {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }

  if (eventQueue.length === 0) return

  const eventsToSend = [...eventQueue]
  eventQueue = []

  const baseUrl = getApiBaseUrl().replace(/\/+$/, "")
  const endpoint = `${baseUrl}/softStoryTrackView`
  const payload = JSON.stringify({ events: eventsToSend })

  try {
    // 1. Prefer sendBeacon for non-blocking background dispatch (works reliably even on tab close/unload)
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" })
      const sent = navigator.sendBeacon(endpoint, blob)
      if (sent) return
    }

    // 2. Fallback to fetch with keepalive: true
    if (typeof fetch === "function") {
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
        keepalive: true,
      }).catch((err) => {
        // Silently catch tracking errors to never break user UI
        console.debug("Background view track notice:", err)
      })
    }
  } catch (err) {
    console.debug("Soft story tracking catch:", err)
  }
}

// Automatically flush pending views when user switches tabs or navigates away
if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushStoryViews()
    }
  })

  window.addEventListener("beforeunload", () => {
    flushStoryViews()
  })
}
