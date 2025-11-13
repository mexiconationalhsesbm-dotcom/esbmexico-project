export interface Dimension {
  id: number
  name: string
  slug: string
  created_at: string
}

export type Role = "Master Admin" | "Overall Focal Person" | "Dimension Leader" | "Dimension Member"

export interface Folder {
  id: number
  name: string
  dimension_id: number
  parent_folder_id: number | null
  created_at: string
  updated_at: string
  status: "draft" | "for_checking" | "checked" | "revisions"
  pin?: string | null
  is_locked?: boolean
  for_archiving?: boolean
  local_archive?: boolean
  cloud_archive?: boolean
  archived_at?: string
  archived_by?: string
  shared_info?: {
    id: number
    item_id: number
    item_type: "folder" | "file"
    access_level: "view" | "full_access"
    created_at: string
    shared_from_dimension?: {
      id: number
      name: string
      slug: string
    }
  } | null
}

export interface File {
  id: number
  name: string
  file_path: string
  file_type: string
  file_size: number
  dimension_id: number
  folder_id?: number | null
  dimension?: {
    id: number
    name: string
  } | null
  folder?: {
    id: number
    name: string
  } | null
  uploaded_by: string
  public_url?: string
  created_at: string
  updated_at: string
  status: "draft" | "for_checking" | "checked" | "revisions"
    shared_info?: {
    id: number
    item_id: number
    item_type: "folder" | "file"
    access_level: "view" | "full_access"
    created_at: string
    shared_from_dimension?: {
      id: number
      name: string
      slug: string
    }
  } | null  
}

export interface Breadcrumb {
  id: number | null
  name: string
  path: string
}

export interface SharedItem {
  id: number
  item_type: "file" | "folder"
  item_id: number
  shared_from_dimension_id: number
  shared_to_dimension_id: number
  access_level: "view" | "full_access"
  shared_by: string
  created_at: string
  updated_at: string
  // Joined data
  item_name?: string
  item_data?: File | Folder
  shared_from_dimension?: Dimension
}

export interface Admin {
  id: string
  email: string
  full_name: string | null
  role_id: number
  role: { 
    id: number
    name: "Unassigned" | "Master Admin" | "Overall Focal Person" | "Dimension Leader" | "Dimension Member"
  } | null
  assigned_dimension_id: number | null
  account_status: "active" | "suspended" | "pending"
  last_active_at: string | null
  created_at: string
  updated_at: string
}

export interface RevisionRequest {
  id: number
  item_type: "file" | "folder"
  item_id: number
  dimension_id: number
  requested_by: string
  status: "pending" | "approved" | "rejected"
  request_reason?: string
  reviewer_notes?: string
  reviewed_by?: string
  created_at: string
  updated_at: string
}

export interface FolderStatus {
  status: "draft" | "for_checking" | "checked" | "revisions"
  label: string
  description: string
  color: string
}

export interface ArchivedFolder {
  id: number
  folder_id: number
  folder_name: string
  dimension_id: number
  original_folder_structure: any
  archived_at: string
  archived_by: string
  storage_provider: string
  storage_path: string
  storage_url: string
  created_at: string
  archived: boolean
}

export interface FolderTask {
  id: number
  folder_id: number
  dimension_id: number
  title: string
  description: string | null
  assigned_to_admins: string[];
  assigned_to_everyone: boolean
  status: "pending" | "completed" | "revision"
  created_by: string
  created_at: string
  updated_at: string
}

export interface TaskReview {
  id: number
  original_task_id: number
  folder_id: number
  dimension_id: number
  review_type: "initial" | "review"
  assigned_to: string
  submitted_by: string | null
  task_title: string
  task_description: string | null
  status: "pending" | "approved" | "revision"
  created_at: string
  updated_at: string
}