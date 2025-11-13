"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation"
import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Select from "../Select";
import { ChevronDownIcon } from "@/icons";
import { useDropzone } from "react-dropzone";
import Button from "@/components/ui/button/Button";

import { createClient } from "@/utils/supabase/client"
import Image from "next/image";

interface FileUploadFormProps {
  userId: string | undefined
}

export default function FileUploadForm({ userId }: FileUploadFormProps) {
  const dimensionOptions = [
    { value: "401f5693-084b-4bca-ae80-c1d879630bc7", label: "Leadership" },
    { value: "b8b9d353-1ee9-4fab-a864-21b798a9b1a0", label: "Governance" },
    { value: "fe58ce31-affc-4420-9f61-d20ac1ab2301", label: "Curriculum and Instructions" },
    { value: "4bfa1086-f0eb-42bd-992f-4ff91a87be65", label: "Resource Management and Mobilization" },
    { value: "11368ec8-f7e0-4f21-95a3-a49c39c1a773", label: "Learning Environment" },
  ];

  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderOptions, setFolderOptions] = useState<{ value: string; label: string }[]>([]);


  const handleSelectChange = (value: string) => {
    console.log("Selected value:", value);
    setSelectedFolder(value);
  };

const renderFileIcon = (ext: string | undefined) => {
  switch (ext?.toLowerCase()) {
    case "pdf":
      return <Image src="/images/icons/pdf.svg" alt="PDF Icon" className="w-10 h-10" />;
    case "docx":
      return <Image src="/images/icons/doc-icon.svg" alt="DOCX Icon" className="w-7 h-7" />;
    case "pptx":
      return <Image src="/images/icons/ppt-icon.svg" alt="PPTX Icon" className="w-10 h-10" />;
    case "xlsx":
      return <Image src="/images/icons/excel-icon.svg" alt="XLSX Icon" className="w-10 h-10" />;
    case "txt":
      return <Image src="/images/icons/txt-icon.svg" alt="TXT Icon" className="w-10 h-10" />;
    default:
      return <Image src="/images/icons/txt-icon.svg" alt="Default Icon" className="w-10 h-10" />;
  }
};

  const handleDimensionChange = async (value: string) => {
    setSelectedDimension(value);
    console.log("Selected Dimension ID:", value);

    try {
      const { data, error } = await supabase
        .from("subfolders")
        .select("folder_id, folder_name")
        .eq("dimension_id", value); // assuming foreign key is 'dimension_id'

      if (error) {
        console.error("Error fetching folders:", error.message);
        setFolderOptions([]);
        return;
      }

      const formatted = data.map((folder: any) => ({
        value: folder.folder_id,
        label: folder.folder_name,
      }));

      setFolderOptions(formatted);
    } catch (err) {
      console.error("Unexpected error fetching folders:", err);
      setFolderOptions([]);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]); // Save the dropped file to state
      console.log("Files dropped:", acceptedFiles[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDimension || !selectedFolder || !file) {
    alert("Please select a Dimension, Folder, and upload a File before submitting.");
    return;
  }

    setLoading(true)

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file)

      console.log("Uploading to:", filePath)

      if (uploadError) {
        // toast({
        //   title: "Upload Error",
        //   description: uploadError.message,
        //   variant: "destructive",
        // })
        return
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath)

      // Insert file metadata into database
      const { error: dbError } = await supabase.from("documents").insert([
        {
          name: file.name,
          size: file.size,
          type: file.type,
          path: filePath,
          uploaded_by: userId,
          dimension_id: selectedDimension,
          folder_id: selectedFolder,
        }
      ]);


      if (dbError) {
        // toast({
        //   title: "Database Error",
        //   description: dbError.message,
        //   variant: "destructive",
        // })
        return
      }

      // toast({
      //   title: "Success",
      //   description: "File uploaded successfully",
      // })

      // Reset form
      setFile(null)
      router.refresh()
    } catch (error) {
      console.error(error)
      // toast({
      //   title: "Error",
      //   description: "An unexpected error occurred",
      //   variant: "destructive",
      // })
    } finally {
      setLoading(false)
    }
  }
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [], // .docx
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [], // .pptx
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [], // .xlsx
      "text/plain": [], // .txt
    },
  });


  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2">
          <ComponentCard title="Dimension">
            <div className="space-y-6">
              <div>
                <Label>Select Dimension</Label>
                <div className="relative">
                  <Select
                    options={dimensionOptions}
                    placeholder="Select Option"
                    onChange={handleDimensionChange}
                    className="dark:bg-dark-900"
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                      <ChevronDownIcon/>
                    </span>
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>
        <div className="w-full sm:w-1/2">
          <ComponentCard title="Folder">
            <div className="space-y-6">
              <div>
                <Label>Select Folder</Label>
              <div className="relative">
                <Select
                  options={folderOptions}
                  placeholder="Select Option"
                  onChange={handleSelectChange}
                  className="dark:bg-dark-900"
                />
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <ChevronDownIcon/>
                  </span>
              </div>
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
      
      <div className="w-full mt-6">
      <ComponentCard title="Upload your file here">
      <div className="space-y-2">
  <Label htmlFor="file">File</Label>
  {file ? (
    <div className="flex items-center gap-2 rounded-md border p-2">
      <div className="flex items-center justify-start w-full gap-2">
        {renderFileIcon(file?.name.split(".").pop())}
        <span className="truncate text-md font-light tracking-wide">{file.name}</span>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => setFile(null)}
      >
        x
      </Button>
    </div>
  ) : (
    <div
      {...getRootProps()}
      className="flex items-center justify-center rounded-md border border-dashed p-6 cursor-pointer hover:border-blue-400 transition"
    >
      <input {...getInputProps()} className="sr-only" />
          <div className="dz-message flex flex-col items-center m-0!">
            {/* Icon Container */}
            <div className="mb-[22px] flex justify-center">
              <div className="flex h-[68px] w-[68px]  items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <svg
                  className="fill-current"
                  width="29"
                  height="28"
                  viewBox="0 0 29 28"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                  />
                </svg>
              </div>
            </div>

            {/* Text Content */}
            <h4 className="mb-3 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
              {isDragActive ? "Drop Files Here" : "Drag & Drop Files Here"}
            </h4>

            <span className=" text-center mb-5 block w-full max-w-[290px] text-sm text-gray-700 dark:text-gray-400">
              Drag and drop your PNG, JPG, WebP, SVG images here or browse
            </span>

            <span className="font-medium underline text-theme-sm text-brand-500">
              Browse File
            </span>
          </div>
    </div>
  )}
</div>
      </ComponentCard>
      </div>
      <div>
        <Button type="submit" className="w-full mt-6" size="sm" disabled={loading || !selectedDimension || !selectedFolder || !file}>
            {loading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </form>
  );
}
