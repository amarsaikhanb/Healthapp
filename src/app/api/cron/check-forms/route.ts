import { NextRequest, NextResponse } from "next/server"
import { checkOverdueForms } from "@/app/actions/vapi-calls"
import { verifyQStashSignature } from "@/lib/qstash"

/**
 * QStash job to check for overdue forms and make VAPI calls
 * Scheduled to run every hour via QStash
 */
export async function POST(request: NextRequest) {
  try {
    // Verify QStash signature
    const signature = request.headers.get("upstash-signature")
    const body = await request.text()

    if (signature) {
      const isValid = await verifyQStashSignature(signature, body)
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        )
      }
    }

    console.log("Running overdue forms check...")
    const result = await checkOverdueForms()

    if (result.success) {
      return NextResponse.json({
        success: true,
        ...result.data,
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("QStash job error:", error)
    return NextResponse.json(
      { error: "Job failed" },
      { status: 500 }
    )
  }
}

// Allow GET for manual testing
export async function GET(request: NextRequest) {
  // Verify manual trigger secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized - use Authorization: Bearer <CRON_SECRET>" },
      { status: 401 }
    )
  }

  return POST(request)
}

