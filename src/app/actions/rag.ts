"use server";

import { createClient } from "@/lib/supabase/server";
import { generatePatientDocument } from "@/lib/pathway-rag";
import fs from "fs/promises";
import path from "path";

export interface ActionResult {
  success: boolean;
  data?: { result?: string; message?: string; path?: string };
  error?: string;
}

/**
 * Sync patient data to filesystem for Pathway RAG indexing
 */
export async function syncPatientDataToRAG(patientId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Fetch patient data
    const { data: patient, error: patientError } = await supabase
      .from("patient")
      .select("*")
      .eq("id", patientId)
      .eq("doctor_id", user.id)
      .single();

    if (patientError || !patient) {
      return { success: false, error: "Patient not found" };
    }

    // Fetch all sessions for this patient
    const { data: sessions } = await supabase
      .from("session")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    // Fetch all forms for this patient with questions and answers
    const { data: forms } = await supabase
      .from("form")
      .select(`
        *,
        questions:question(id, question_text),
        answers:answer(id, question_id, answer_text)
      `)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    // Generate patient document
    const document = generatePatientDocument(patient, sessions || [], forms || []);

    // Write to filesystem in pathway_rag/patient_data directory
    const dataDir = path.join(process.cwd(), "pathway_rag", "patient_data");
    
    // Create directory if it doesn't exist
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (mkdirError) {
      console.error("Failed to create directory:", mkdirError);
    }

    const filePath = path.join(dataDir, `${patientId}.txt`);
    await fs.writeFile(filePath, document, "utf-8");

    return { 
      success: true, 
      data: { message: "Patient data synced to RAG", path: filePath } 
    };
  } catch (error) {
    console.error("Failed to sync patient data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync patient data",
    };
  }
}

/**
 * Query the RAG system for a specific patient
 */
export async function queryPatientRAG(
  patientId: string,
  message: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify doctor has access to this patient and fetch all data
    const { data: patient } = await supabase
      .from("patient")
      .select("*")
      .eq("id", patientId)
      .eq("doctor_id", user.id)
      .single();

    if (!patient) {
      return { success: false, error: "Patient not found or unauthorized" };
    }

    // Fetch all sessions for this patient
    const { data: sessions } = await supabase
      .from("session")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    // Fetch all forms for this patient with questions and answers
    const { data: forms } = await supabase
      .from("form")
      .select(`
        *,
        questions:question(*),
        answers:answer(*)
      `)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    // Generate comprehensive patient document
    const patientDocument = generatePatientDocument(patient, sessions || [], forms || []);

    // Query OpenAI directly with all patient data
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return { success: false, error: "OpenAI API key not configured" };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a medical assistant helping a doctor review patient information. 
            
Here is the complete patient record:

${patientDocument}

Provide helpful, accurate answers based on this patient's medical records. If the information is not available in the records, please state that clearly. Focus on:
- Session transcripts and summaries
- Clinical inferences and observations
- Medications discussed
- Form responses and health assessments`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { 
        success: false, 
        error: `OpenAI API error: ${error}` 
      };
    }

    const result = await response.json();
    const answer = result.choices[0]?.message?.content;
    
    if (!answer) {
      return { success: false, error: "No response from AI" };
    }

    return { success: true, data: { result: answer } };
  } catch (error) {
    console.error("Failed to query RAG:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to query patient data",
    };
  }
}

/**
 * Auto-sync patient data when sessions or forms are updated
 */
export async function autoSyncPatientData(patientId: string): Promise<void> {
  try {
    await syncPatientDataToRAG(patientId);
    console.log(`Auto-synced patient ${patientId} to RAG`);
  } catch (error) {
    console.error(`Failed to auto-sync patient ${patientId}:`, error);
  }
}

