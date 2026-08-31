import { useState, useEffect } from "react"
import { useDashboardSettings } from "@/hooks/useDashboardSettings"

type SlideshowImage = {
  id: string
  url: string
  caption?: string
}

export default function SmartDisplayPhotos() {
  const { settings, loading: settingsLoading } = useDashboardSettings()
  const albumUrl = settings?.icloud_shared_album_url ?? null

  const [images, setImages] = useState<SlideshowImage[]>([])
  const [index, setIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (settingsLoading) {
      return
    }

    if (!albumUrl) {
      setImages([])
      setError(null)
      return
    }

    let cancelled = false

    const fetchFreshPhotos = async () => {
      try {
        const res = await fetch(
          `/.netlify/functions/get-icloud-photos?url=${encodeURIComponent(albumUrl)}`
        )
        const contentType = res.headers.get("content-type") ?? ""

        if (!contentType.includes("application/json")) {
          throw new Error(
            "Photo sync endpoint returned HTML instead of JSON. Run the app with `npm run dev:netlify` so Netlify functions are available."
          )
        }

        const data: unknown = await res.json()

        if (!res.ok) {
          const message =
            data &&
            typeof data === "object" &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string"
              ? (data as { error: string }).error
              : `Photo sync failed (${res.status})`
          throw new Error(message)
        }

        if (!Array.isArray(data)) {
          throw new Error("Unexpected photo sync response")
        }

        const nextImages = data.filter(
          (item): item is SlideshowImage =>
            !!item &&
            typeof item === "object" &&
            typeof (item as SlideshowImage).id === "string" &&
            typeof (item as SlideshowImage).url === "string"
        )

        if (!cancelled) {
          setImages(nextImages)
          setIndex(0)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed background syncing iCloud stream"
          )
        }
      }
    }

    fetchFreshPhotos()
    const syncInterval = setInterval(fetchFreshPhotos, 8 * 60 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(syncInterval)
    }
  }, [albumUrl, settingsLoading])

  useEffect(() => {
    if (images.length === 0) return
    const slideInterval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 15000)
    return () => clearInterval(slideInterval)
  }, [images])

  if (settingsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Loading photo settings…
      </div>
    )
  }

  if (!albumUrl) {
    return (<div></div>)
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted px-4 text-center text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (!images.length) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Syncing Apple Photo Stream…
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-black rounded-lg overflow-hidden">
      <img
        src={images[index]?.url}
        alt={images[index]?.caption || "Shared album photo"}
        className="h-full w-full object-contain"
      />
    </div>
  )
}
