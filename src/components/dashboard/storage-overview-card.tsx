"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface StorageOverview {
  totalStorageUsed: number
  totalStorageLimit: number
  percentageUsed: number
  totalFiles: number
}

export function StorageOverviewCard() {
  const [storage, setStorage] = useState<StorageOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const response = await fetch("/api/storage/overall")
        if (!response.ok) throw new Error("Failed to fetch storage data")
        const data = await response.json()
        setStorage(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStorage()
  }, [])

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-white dark:border-gray-700">
        <CardHeader>
          <CardTitle>Storage Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error || !storage) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-white dark:border-gray-700">
        <CardHeader>
          <CardTitle>Storage Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error || "Failed to load storage data"}</p>
        </CardContent>
      </Card>
    )
  }

  const usedGB = storage.totalStorageUsed.toFixed(2)
  const percentageUsed = storage.percentageUsed.toFixed(1)

  // Determine progress bar color based on usage
  let progressColor = "bg-green-500"
  if (storage.percentageUsed > 80) {
    progressColor = "bg-red-500"
  } else if (storage.percentageUsed > 60) {
    progressColor = "bg-yellow-500"
  }

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-white dark:border-gray-700">
      <CardHeader>
        <CardTitle>Storage Overview</CardTitle>
        <CardDescription>Total storage usage across all dimensions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Storage Used</span>
            <span className="font-semibold">
              {usedGB} GB / {storage.totalStorageLimit} GB
            </span>
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColor} rounded-full transition-all duration-500`}
              style={{ width: `${storage.percentageUsed}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">{percentageUsed}% used</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Total Files</p>
            <p className="text-2xl font-bold">{storage.totalFiles}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Available Space</p>
            <p className="text-2xl font-bold">{(storage.totalStorageLimit - storage.totalStorageUsed).toFixed(2)} GB</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
