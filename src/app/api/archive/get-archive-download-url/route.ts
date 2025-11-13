import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const fileName = url.searchParams.get("file")

    if (!fileName) {
      return NextResponse.json({ error: "Missing file name" }, { status: 400 })
    }

    const authResp = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      headers: {
        Authorization: "Basic " + Buffer.from(`${process.env.B2_APPLICATION_KEY_ID}:${process.env.B2_APPLICATION_KEY}`).toString("base64"),
      },
    })

    const authData = await authResp.json()
    if (!authResp.ok) {
      console.error("Auth Error:", authData)
      return NextResponse.json({ error: "Failed to authorize Backblaze" }, { status: 400 })
    }

    const downloadAuthResp = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_download_authorization`, {
      method: "POST",
      headers: {
        Authorization: authData.authorizationToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bucketId: process.env.B2_BUCKET_ID,
        fileNamePrefix: fileName,
        validDurationInSeconds: 300,
      }),
    })

    const downloadAuth = await downloadAuthResp.json()
    if (!downloadAuthResp.ok) {
      console.error("Download Auth Error:", downloadAuth)
      return NextResponse.json({ error: "Failed to get download authorization" }, { status: 400 })
    }

    const signedUrl = `${authData.downloadUrl}/file/${process.env.B2_BUCKET_NAME}/${fileName}?Authorization=${downloadAuth.authorizationToken}`

    // After getting signedUrl
    const fileResp = await fetch(signedUrl)
    const arrayBuffer = await fileResp.arrayBuffer()

    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        "Content-Type": fileResp.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName.split("/").pop()}"`,
      },
    })
  } catch (err: any) {
    console.error("Error generating signed URL:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
