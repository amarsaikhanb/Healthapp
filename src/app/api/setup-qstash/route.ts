import { NextRequest, NextResponse } from "next/server"
import { scheduleFormCheckJob } from "@/lib/qstash"

/**
 * One-time setup endpoint to create QStash schedule
 * Call this once after deployment to set up the hourly job
 * 
 * GET /api/setup-qstash?secret=YOUR_SETUP_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Verify setup secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")
    const setupSecret = process.env.CRON_SECRET

    if (!setupSecret || secret !== setupSecret) {
      return NextResponse.json(
        { error: "Unauthorized - provide ?secret=CRON_SECRET" },
        { status: 401 }
      )
    }

    console.log("Setting up QStash schedule...")
    const result = await scheduleFormCheckJob()

    return NextResponse.json({
      success: true,
      message: "QStash schedule created successfully",
      schedule: result,
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Setup failed",
      },
      { status: 500 }
    )
  }
}

