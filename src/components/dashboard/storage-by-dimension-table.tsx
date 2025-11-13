"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"

interface DimensionStorage {
  dimension_id: number
  dimension_name: string
  dimension_slug: string
  totalStorageGB: number
  totalFiles: number
}

export function StorageByDimensionTable() {
  const [dimensions, setDimensions] = useState<DimensionStorage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDimensionStorage = async () => {
      try {
        const response = await fetch("/api/storage/by-dimension")
        if (!response.ok) throw new Error("Failed to fetch dimension storage data")
        const data = await response.json()
        setDimensions(data.sort((a: DimensionStorage, b: DimensionStorage) => b.totalStorageGB - a.totalStorageGB))
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDimensionStorage()
  }, [])

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-white dark:border-gray-700">
        <CardHeader>
          <CardTitle>Storage by Dimension</CardTitle>
          <CardDescription>Breakdown of storage usage across each dimension</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-white dark:border-gray-700">
        <CardHeader>
          <CardTitle>Storage by Dimension</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-white dark:border-gray-700">
      <CardHeader>
        <CardTitle>Storage by Dimension</CardTitle>
        <CardDescription>Breakdown of storage usage across each dimension</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dimension</TableHead>
              <TableHead className="text-right">Storage Used (GB)</TableHead>
              <TableHead className="text-right">Total Files</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dimensions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No storage data available
                </TableCell>
              </TableRow>
            ) : (
              dimensions.map((dimension) => (
                <TableRow key={dimension.dimension_id}>
                  <TableCell className="font-medium">{dimension.dimension_name}</TableCell>
                  <TableCell className="text-right">{dimension.totalStorageGB.toFixed(2)} GB</TableCell>
                  <TableCell className="text-right">{dimension.totalFiles}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
