import { notFound, redirect } from "next/navigation"
import { createClient as createServerClient } from "@/utils/supabase/server"
import { BreadcrumbNav } from "@/components/dashboard/breadcrumb"
import type { Breadcrumb, Folder, File } from "@/types"
import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import { ContentExplorerShared } from "@/components/dashboard/content-explorer-shared"
import { ContentTableShared } from "@/components/dashboard/content-table-shared"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "eSBMexico SBM Shared Documents | MNHS",
  description: "This  ",
};

interface SharedPageProps {
  params: Promise<{
    folderPath?: string[]
  }>
}

export default async function SharedPage({ params }: SharedPageProps) {
  const { folderPath = [] } = await params;

  const supabase = await createServerClient()

  // Get current user's admin info
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const { data: adminData, error: adminError } = await supabase.from("admins").select("*").eq("id", user.id).single()

  if (adminError || !adminData || !adminData.assigned_dimension_id) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Shared with me</h1>
        <p className="text-muted-foreground">You need to be assigned to a dimension to view shared files.</p>
      </div>
    )
  }

  const currentAdmin = adminData.id

  const userDimensionId = adminData.assigned_dimension_id

  // Determine current folder ID from path
  let currentFolderId: number | null = null
  let breadcrumbs: Breadcrumb[] = []

  if (folderPath.length > 0) {
    currentFolderId = Number.parseInt(folderPath[folderPath.length - 1], 10)

    // Build breadcrumbs by traversing up from current folder
    const { data: folderData } = await supabase
      .from("folders")
      .select("id, name, parent_folder_id, dimension_id")
      .eq("id", currentFolderId)
      .single()

    if (folderData) {
      // Check if this folder or any of its ancestors are shared to the user's dimension
      let isAccessible = false
      let sharedAncestorId: number | null = null

      // Check if current folder is directly shared
      const { data: currentFolderShare } = await supabase
        .from("shared_items")
        .select("*")
        .eq("item_type", "folder")
        .eq("item_id", currentFolderId)
        .eq("shared_to_dimension_id", userDimensionId)
        .single()

      if (currentFolderShare) {
        isAccessible = true
        sharedAncestorId = currentFolderId
      } else {
        // Check if any parent folder is shared
        let folder = folderData
        while (folder.parent_folder_id && !isAccessible) {
          const { data: parentShare } = await supabase
            .from("shared_items")
            .select("*")
            .eq("item_type", "folder")
            .eq("item_id", folder.parent_folder_id)
            .eq("shared_to_dimension_id", userDimensionId)
            .single()

          if (parentShare) {
            isAccessible = true
            sharedAncestorId = folder.parent_folder_id
            break
          }

          const { data: parentFolder } = await supabase
            .from("folders")
            .select("id, name, parent_folder_id, dimension_id")
            .eq("id", folder.parent_folder_id)
            .single()

          if (!parentFolder) break
          folder = parentFolder
        }
      }

      if (!isAccessible) {
        notFound()
      }

      // Build breadcrumbs from current folder up to (but not beyond) the shared ancestor
      let folder = folderData
      const breadcrumbItems: Breadcrumb[] = [
        { id: folder.id, name: folder.name, path: `/dashboard/shared/${folder.id}` },
      ]

      while (folder.parent_folder_id && folder.parent_folder_id !== sharedAncestorId) {
        const { data: parentFolder } = await supabase
          .from("folders")
          .select("id, name, parent_folder_id, dimension_id")
          .eq("id", folder.parent_folder_id)
          .single()

        if (parentFolder) {
          breadcrumbItems.unshift({
            id: parentFolder.id,
            name: parentFolder.name,
            path: `/dashboard/shared/${parentFolder.id}`,
          })
          folder = parentFolder
        } else {
          break
        }
      }

      // If we stopped at a shared ancestor, add it to the beginning
      if (sharedAncestorId && folder.parent_folder_id === sharedAncestorId) {
        const { data: ancestorFolder } = await supabase
          .from("folders")
          .select("id, name, parent_folder_id, dimension_id")
          .eq("id", sharedAncestorId)
          .single()

        if (ancestorFolder) {
          breadcrumbItems.unshift({
            id: ancestorFolder.id,
            name: ancestorFolder.name,
            path: `/dashboard/shared/${ancestorFolder.id}`,
          })
        }
      }

      breadcrumbs = breadcrumbItems
    }
  }

  // Get access level of the current folder if it’s shared
  // let currentFolderAccessLevel = "view-only"

  // if (currentFolderId) {
  //   const { data: sharedInfo, error: sharedInfoError } = await supabase
  //     .from("shared_items")
  //     .select("access_level")
  //     .eq("item_type", "folder")
  //     .eq("item_id", currentFolderId)
  //     .eq("shared_to_dimension_id", userDimensionId)
  //     .single()

  //   if (sharedInfoError) {
  //     console.error("Error fetching shared info for current folder:", sharedInfoError)
  //   }

  //   if (sharedInfo) {
  //     currentFolderAccessLevel = sharedInfo.access_level
  //   }
  // }

  let currentFolderAccessLevel = "view"
  let currentFolderSharedFromDimensionId: number | null = null

if (currentFolderId !== null && !isNaN(currentFolderId)) {
  // Step 1: Try to get direct shared info first
  const { data: sharedInfo, error: sharedInfoError } = await supabase
    .from("shared_items")
    .select("access_level, shared_from_dimension_id")
    .eq("item_type", "folder")
    .eq("item_id", currentFolderId)
    .eq("shared_to_dimension_id", userDimensionId)
    .maybeSingle()

  if (sharedInfoError) {
    console.error("Error fetching shared info for current folder:", sharedInfoError)
  }

  if (sharedInfo) {
    currentFolderAccessLevel = sharedInfo.access_level
    currentFolderSharedFromDimensionId = sharedInfo.shared_from_dimension_id
  } else {
    // Step 2: No direct share found → inherit from ancestor
    let folderToCheck = currentFolderId
    let inheritedAccess: string | null = null
    let inheritedSharedToDimensionId: number | null = null

    while (folderToCheck && !inheritedAccess) {
      // Get parent folder
      const { data: parentFolder } = await supabase
        .from("folders")
        .select("parent_folder_id")
        .eq("id", folderToCheck)
        .maybeSingle()

      if (!parentFolder?.parent_folder_id) break

      // Check if that parent folder is shared
      const { data: parentShare } = await supabase
        .from("shared_items")
        .select("access_level, shared_from_dimension_id")
        .eq("item_type", "folder")
        .eq("item_id", parentFolder.parent_folder_id)
        .eq("shared_to_dimension_id", userDimensionId)
        .maybeSingle()

      if (parentShare) {
        inheritedAccess = parentShare.access_level
        inheritedSharedToDimensionId = parentShare.shared_from_dimension_id
        break
      }

      folderToCheck = parentFolder.parent_folder_id
    }

    if (inheritedAccess) {
      currentFolderAccessLevel = inheritedAccess
      currentFolderSharedFromDimensionId = inheritedSharedToDimensionId
    }
  }
}

console.log("🧩 Folder ID:", currentFolderId)
console.log("🔐 Final access level:", currentFolderAccessLevel)
console.log("🏷️ Shared to dimension ID:", currentFolderSharedFromDimensionId)
  
  // Get folders and files to display
  let folders: (Folder & { shared_info: any })[] = []
  let files: (File & { shared_info: any })[] = []

  if (currentFolderId === null) {
    // Root level: show all directly shared items

    // Get directly shared folders
    // const { data: sharedFolders } = await supabase
    //   .from("shared_items")
    //   .select("item_id")
    //   .eq("item_type", "folder")
    //   .eq("shared_to_dimension_id", userDimensionId)
    const { data: sharedFolders, error: sharedFoldersError } = await supabase
      .from("shared_items")
      .select(`
        id,
        item_id,
        item_type,
        access_level,
        created_at,
        shared_from_dimension:dimensions!shared_items_shared_from_dimension_id_fkey(id, name, slug)
      `)
      .eq("item_type", "folder")
      .eq("shared_to_dimension_id", userDimensionId)

      if (sharedFoldersError) {
  console.error("Error fetching shared folders:", sharedFoldersError)
}

    // if (sharedFolders && sharedFolders.length > 0) {
    //   const folderIds = sharedFolders.map((s) => s.item_id)
    //   const { data: folderData } = await supabase.from("folders").select("*").in("id", folderIds).order("name")

    //   folders = folderData || []
    // }

    if (sharedFolders && sharedFolders.length > 0) {
      const folderIds = sharedFolders.map((s) => s.item_id)
      const { data: folderData } = await supabase
        .from("folders")
        .select("*")
        .in("id", folderIds)
        .order("name")

      folders = (folderData || []).map(folder => ({
        ...folder,
        shared_info: sharedFolders?.find(sf => sf.item_id === folder.id) || null
      }))
    }

    // Get directly shared files
    // const { data: sharedFiles } = await supabase
    //   .from("shared_items")
    //   .select("item_id")
    //   .eq("item_type", "file")
    //   .eq("shared_to_dimension_id", userDimensionId)

    const { data: sharedFiles, error: sharedFilesError } = await supabase
      .from("shared_items")
      .select(`
        id,
        item_id,
        item_type,
        access_level,
        created_at,
        shared_from_dimension:dimensions!shared_items_shared_from_dimension_id_fkey(id, name, slug)
      `)
      .eq("item_type", "file")
      .eq("shared_to_dimension_id", userDimensionId)

      if (sharedFilesError) {
        console.error("Error fetching shared files:", sharedFilesError)
      }

    // if (sharedFiles && sharedFiles.length > 0) {
    //   const fileIds = sharedFiles.map((s) => s.item_id)
    //   const { data: fileData } = await supabase.from("files").select("*").in("id", fileIds).order("name")

    //   files = fileData || []
    // }

    if (sharedFiles && sharedFiles.length > 0) {
      const fileIds = sharedFiles.map((s) => s.item_id)
      const { data: fileData } = await supabase
        .from("files")
        .select("*")
        .in("id", fileIds)
        .order("name")

      files = (fileData || []).map(file => ({
        ...file,
        shared_info: sharedFiles?.find(sf => sf.item_id === file.id) || null
      }))
    }

    // console.log("📁 Shared Folders:", folders)
    // console.log("📄 Shared Files:", files)
  } else {
    // Inside a shared folder: show child folders and files

    // Get child folders
    const { data: childFolders, error: childFolderError } = await supabase
      .from("folders")
      .select("*")
      .eq("parent_folder_id", currentFolderId)
      .order("name")

    if (childFolderError) console.error("Error fetching child folders:", childFolderError)

    folders = childFolders || []

    // Get files in this folder
    const { data: folderFiles, error: folderFilesError } = await supabase
      .from("files")
      .select("*")
      .eq("folder_id", currentFolderId)
      .order("name")

    if (folderFilesError) console.error("Error fetching files:", folderFilesError)

    files = folderFiles || []
  }

  return (
    <div>
    <PageBreadcrumb pageTitle="Shared Documents"/>
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/3 xl:px-10 xl:py-12">
         <div className="mx-auto w-full text-center">
            <div className="mb-10">

              <BreadcrumbNav items={breadcrumbs} dimensionSlug="shared" isSharedPage={true} />
            </div>
            <ContentExplorerShared
                folders={folders}
                files={files}
                dimensionId={userDimensionId}
                currentUserId={currentAdmin.id}
                dimensionSlug="shared"
                currentFolderId={currentFolderId}
                isSharedView={true}
                accessLevel={currentFolderAccessLevel}
                sharedFromDimensionId={currentFolderSharedFromDimensionId}
                />
        </div>
      </div>

      <div className="h-fit rounded-2xl border mt-6 border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/3 xl:px-10 xl:py-12">
        <div className="mx-auto w-full text-center">
          <ContentTableShared
            folders={folders}
                files={files}
                dimensionId={userDimensionId}
                dimensionSlug="shared"
                currentFolderId={currentFolderId}
                isSharedView={true}
                accessLevel={currentFolderAccessLevel}
                sharedFromDimensionId={currentFolderSharedFromDimensionId}
                />
        </div>
      </div>
    </div>
  )
}
