import { notFound } from "next/navigation"
import { Metadata } from "next";
import { createClient as createServerClient } from "@/utils/supabase/server"
import { createClient } from "@/utils/supabase/server";
import { BreadcrumbNav } from "@/components/dashboard/breadcrumb"
import { ContentExplorer } from "@/components/dashboard/content-explorer"
import { SharedFilesSection } from "@/components/dashboard/shared-files-section"
import type { Breadcrumb } from "@/types/index"
import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import { ContentTable } from "@/components/dashboard/content-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


export const metadata: Metadata = {
  title: "eSBMexico SBM Documents | MNHS",
  description: "This  ",
};

interface DimensionPageProps {
  params: Promise<{
    dimension: string
    folderPath?: string[]
  }>
}

export default async function DimensionPage({ params }: DimensionPageProps) {
  const { dimension, folderPath = [] } = await params

  const supabaseServer = await createServerClient()
  const supabase = await createClient()

  // Get dimension info
  const { data: dimensionData, error: dimensionError } = await supabase
    .from("dimensions")
    .select("*")
    .eq("slug", dimension)
    .single()

  if (dimensionError || !dimensionData) {
    notFound()
  }

  // Get current user's admin info to check permissions
  const {
    data: { user },
  } = await supabaseServer.auth.getUser()
  let currentAdmin = null
  let hasAccessToThisDimension = false

  if (user) {
    const { data: adminData } = await supabase.from("admins").select("*").eq("id", user.id).single()

    currentAdmin = adminData

    // Check if user has access to this dimension
    if (currentAdmin) {
      // Master admin and overall focal person can access all dimensions
      if (currentAdmin.role_id === 2 || currentAdmin.role_id === 3) {
        hasAccessToThisDimension = true
      }
      // Dimension leaders and members can only access their assigned dimension
      else if (currentAdmin.assigned_dimension_id === dimensionData.id) {
        hasAccessToThisDimension = true 
      }
    }
  }

  // If user doesn't have access to this dimension, only show shared files
  // if (!hasAccessToThisDimension) {
  //   return (
  //     <div className="p-6 space-y-6">
  //       <div className="flex items-center justify-between">
  //         <div>
  //           <h1 className="text-3xl font-bold mb-2">{dimensionData.name}</h1>
  //           <p className="text-muted-foreground">You can only view files shared with your dimension</p>
  //         </div>
  //       </div>

  //       {/* Show message that user doesn't have direct access */}
  //       <Card>
  //         <CardHeader>
  //           <CardTitle>Access Restricted</CardTitle>
  //           <CardDescription>
  //             You don't have direct access to this dimension. Only shared files are visible below.
  //           </CardDescription>
  //         </CardHeader>
  //         <CardContent>
  //           <p className="text-sm text-muted-foreground">
  //             To access files in this dimension directly, you need to be assigned as a leader or member of this
  //             dimension.
  //           </p>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   )
  // }

  if (!hasAccessToThisDimension) {
    notFound();
  }

  // Determine current folder ID from path
  let currentFolderId: number | null = null
  let breadcrumbs: Breadcrumb[] = []
  let currentFolderData = null;

  if (folderPath.length > 0) {
    currentFolderId = Number.parseInt(folderPath[folderPath.length - 1], 10)

    // Get folder info for breadcrumbs
    const { data: folderData } = await supabase
      .from("folders")
      .select("*")
      .eq("id", currentFolderId)
      .single()

      currentFolderData = folderData;

    if (folderData) {
      // Build breadcrumbs by traversing parent folders
      let folder = folderData
      const breadcrumbItems: Breadcrumb[] = [
        { id: folder.id, name: folder.name, path: `/dashboard/${dimension}/${folder.id}` },
      ]

      while (folder.parent_folder_id) {
        const { data: parentFolder } = await supabase
          .from("folders")
          .select("id, name, parent_folder_id")
          .eq("id", folder.parent_folder_id)
          .single()

        if (parentFolder) {
          breadcrumbItems.unshift({
            id: parentFolder.id,
            name: parentFolder.name,
            path: `/dashboard/${dimension}/${parentFolder.id}`,
          })
          folder = parentFolder
        } else {
          break
        }
      }

      breadcrumbs = breadcrumbItems
    }
  }

  // Get folders in current location
  let foldersQuery = supabase.from("folders").select("*").eq("dimension_id", dimensionData.id).order("name")

  // Apply the correct filter based on whether currentFolderId is null or not
  if (currentFolderId === null) {
    foldersQuery = foldersQuery.is("parent_folder_id", null)
  } else {
    foldersQuery = foldersQuery.eq("parent_folder_id", currentFolderId)
  }

  const { data: foldersData } = await foldersQuery

  // Get files in current location
  let filesQuery = supabase
  .from("files")
  .select(`
    *,
    folder:folder_id ( id, name ),
    dimension:dimension_id ( id, name )
  `)
  .eq("dimension_id", dimensionData.id)
  .order("name")

  // Apply the correct filter based on whether currentFolderId is null or not
  if (currentFolderId === null) {
    filesQuery = filesQuery.is("folder_id", null)
  } else {
    filesQuery = filesQuery.eq("folder_id", currentFolderId)
  }

  const { data: filesData } = await filesQuery

  // Ensure we have arrays even if the query returns null
  const folders = foldersData || []
  const files = filesData || []

  return (
    <div>
      <PageBreadcrumb pageTitle={dimensionData.name}/>
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/3 xl:px-10 xl:py-12">
         <div className="mx-auto w-full text-center">
            <div className="mb-10">

              <BreadcrumbNav items={breadcrumbs} dimensionSlug={dimension} />
            </div>
            <ContentExplorer
              folders={folders}
              files={files}
              currentUserId={currentAdmin.id}
              dimensionId={dimensionData.id}
              dimensionSlug={dimension}
              currentFolderId={currentFolderId}
              currentlyFolder={currentFolderData}
              currentAdminRole={currentAdmin.role_id}
              hasAccessToThisDimension={hasAccessToThisDimension}
            />
        </div>
      </div>

      <div className="h-fit rounded-2xl border mt-6 border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/3 xl:px-10 xl:py-12">
        <div className="mx-auto w-full text-center">
          <ContentTable
            folders={folders}
            files={files}
            dimensionId={dimensionData.id}
            dimensionSlug={dimension}
            currentFolderId={currentFolderId}
            currentlyFolder={currentFolderData}
            currentAdminRole={currentAdmin.role_id}
            hasAccessToThisDimension={hasAccessToThisDimension}
          />
        </div>
      </div>

    </div>
  )
}
