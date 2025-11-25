"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { AparaviDTC } from "aparavi-dtc-node-sdk";

export type Session = {
  id: string;
  patient_id: string;
  doctor_id: string;
  transcript: string | null;
  summary: string | null;
  inferences: string[] | null;
  medications: string[] | null;
  created_at: string;
  ended_at: string | null;
};

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: Session;
};

/**
 * Create a new session
 */
export async function createSession(patientId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify patient belongs to this doctor
    const { data: patient } = await supabase
      .from("patient")
      .select("id")
      .eq("id", patientId)
      .eq("doctor_id", user.id)
      .single();

    if (!patient) {
      return { success: false, error: "Patient not found or unauthorized" };
    }

    const { data, error } = await supabase
      .from("session")
      .insert({
        patient_id: patientId,
        doctor_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/patients/${patientId}`);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create session",
    };
  }
}

/**
 * Update session with transcript and generate AI analysis
 */
export async function updateSessionTranscript(
  sessionId: string,
  transcript: string,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Generate AI analysis using OpenAI GPT-4o-mini (cheapest model)
    let summary = null;
    let inferences: string[] | null = null;
    let medications: Array<{ name: string; reason: string; frequency: string }> | null = null;

    try {
      const analysisResult = await generateSessionAnalysis(transcript);
      summary = analysisResult.summary;
      inferences = analysisResult.inferences;
      medications = analysisResult.medications;
    } catch (analysisError) {
      console.error("Failed to generate AI analysis:", analysisError);
      // Continue without analysis - transcript will still be saved
    }

    const { data, error } = await supabase
      .from("session")
      .update({ 
        transcript,
        summary,
        inferences,
        medications: medications as unknown as object // Cast to object for JSONB type
      })
      .eq("id", sessionId)
      .eq("doctor_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update transcript",
    };
  }
}

/**
 * Generate session analysis using OpenAI
 */
async function generateSessionAnalysis(transcript: string): Promise<{
  summary: string;
  inferences: string[];
  medications: Array<{
    name: string;
    reason: string;
    frequency: string;
  }>;
}> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Cheapest OpenAI model
      messages: [
        {
          role: "system",
          content: `You are a medical assistant analyzing doctor-patient consultation transcripts. 
Extract key information and provide it in valid JSON format with these fields:
- summary: A concise 2-3 sentence summary of the consultation
- inferences: Array of clinical observations, symptoms, or diagnoses mentioned (strings)
- medications: Array of medication objects, each with:
  - name: Medication name
  - reason: Why it was prescribed/discussed
  - frequency: How often to take it (e.g., "twice daily", "once at bedtime", "as needed")

Example medications format:
[
  {
    "name": "Lisinopril 10mg",
    "reason": "High blood pressure management",
    "frequency": "Once daily"
  },
  {
    "name": "Metformin 500mg",
    "reason": "Type 2 diabetes management",
    "frequency": "Twice daily with meals"
  }
]

Return ONLY valid JSON, no additional text.`
        },
        {
          role: "user",
          content: `Analyze this consultation transcript:\n\n${transcript}`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const result = await response.json();
  const content = result.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  const analysis = JSON.parse(content);
  
  return {
    summary: analysis.summary || "No summary generated",
    inferences: Array.isArray(analysis.inferences) ? analysis.inferences : [],
    medications: Array.isArray(analysis.medications) ? analysis.medications : []
  };
}

/**
 * End a session
 */
export async function endSession(sessionId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("session")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("doctor_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.patient_id) {
      revalidatePath(`/dashboard/patients/${data.patient_id}`);
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to end session",
    };
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // First, get the session to verify ownership and get patient_id for revalidation
    const { data: session } = await supabase
      .from("session")
      .select("patient_id")
      .eq("id", sessionId)
      .eq("doctor_id", user.id)
      .single();

    if (!session) {
      return { success: false, error: "Session not found or unauthorized" };
    }

    // Delete the session
    const { error } = await supabase
      .from("session")
      .delete()
      .eq("id", sessionId)
      .eq("doctor_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Revalidate the patient page
    if (session.patient_id) {
      revalidatePath(`/dashboard/patients/${session.patient_id}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete session",
    };
  }
}

/**
 * Get sessions for a patient
 */
export async function getPatientSessions(
  patientId: string,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("session")
      .select("*")
      .eq("patient_id", patientId)
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as any };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch sessions",
    };
  }
}

/**
 * Get sessions for a patient by the patient (user is patient)
 */
export async function getPatientSessionsByPatient(): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("session")
      .select("*")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as any };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch sessions",
    };
  }
}

export async function processWithAparavi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(); // patient side function, user is patient

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const sessions = await getPatientSessionsByPatient();

  try {
    const aparaviClient = new AparaviDTC(process.env.APARAVI_API_KEY);

    const pipeline = {
      pipeline: {
        components: [
          {
            id: "webhook_1",
            provider: "webhook",
            config: {
              hideForm: true,
              mode: "Source",
              parameters: {},
              type: "webhook",
            },
            ui: {
              position: {
                x: 320,
                y: 220,
              },
              measured: {
                width: 150,
                height: 36,
              },
              data: {
                provider: "webhook",
                class: "source",
                type: "default",
              },
              formDataValid: true,
            },
          },
          {
            id: "parse_1",
            provider: "parse",
            config: {},
            ui: {
              position: {
                x: 580,
                y: 220,
              },
              measured: {
                width: 150,
                height: 36,
              },
              data: {
                provider: "parse",
                class: "data",
                type: "default",
              },
              formDataValid: true,
            },
            input: [
              {
                lane: "tags",
                from: "webhook_1",
              },
            ],
          },
          {
            id: "response_1",
            provider: "response",
            config: {
              lanes: [],
            },
            ui: {
              position: {
                x: 860,
                y: 200,
              },
              measured: {
                width: 150,
                height: 36,
              },
              data: {
                provider: "response",
                class: "infrastructure",
                type: "default",
              },
              formDataValid: true,
            },
            input: [
              {
                lane: "text",
                from: "parse_1",
              },
            ],
          },
        ],
        servicesVersion: 1,
        id: "b9be2081-eccc-45b9-ba1a-3cf33311398e",
      },
    };

    await aparaviClient.startTask(pipeline);
    const result = await aparaviClient.sendToWebhook(sessions);

    return { sessions, result };
  } catch {
    return { sessions };
  }
}
