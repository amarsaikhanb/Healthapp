"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { scheduleFormCall } from "@/lib/qstash";

export type Form = {
  id: string;
  doctor_id: string;
  patient_id: string;
  title: string;
  created_at: string;
  submitted_at: string | null;
};

export type Question = {
  id: string;
  form_id: string;
  question_text: string;
  question_order: number;
  created_at: string;
};

export type Answer = {
  id: string;
  form_id: string;
  question_id: string;
  answer_text: string | null;
  created_at: string;
};

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: any;
};

/**
 * Create a new form for a patient
 */
export async function createForm(
  patientId: string,
  title: string,
  questions: string[],
  deadline?: string,
): Promise<ActionResult> {
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
      return { success: false, error: "Patient not found" };
    }

    // Create form
    const { data: form, error: formError } = await supabase
      .from("form")
      .insert({
        doctor_id: user.id,
        patient_id: patientId,
        title: title || "Health Assessment Form",
        deadline: deadline || null,
      })
      .select()
      .single();

    if (formError || !form) {
      return {
        success: false,
        error: formError?.message || "Failed to create form",
      };
    }

    // Create questions
    const questionsData = questions.map((q, index) => ({
      form_id: form.id,
      question_text: q,
      question_order: index,
    }));

    const { error: questionsError } = await supabase
      .from("question")
      .insert(questionsData);

    if (questionsError) {
      // Rollback: delete the form
      await supabase.from("form").delete().eq("id", form.id);
      return { success: false, error: "Failed to create questions" };
    }

    // Schedule VAPI call at deadline if provided
    if (deadline) {
      try {
        const deadlineDate = new Date(deadline);
        await scheduleFormCall(form.id, deadlineDate);
        console.log(`Scheduled call for form ${form.id} at ${deadlineDate}`);
      } catch (error) {
        console.error("Failed to schedule call:", error);
        // Don't fail form creation if scheduling fails
      }
    }

    revalidatePath(`/dashboard/patients/${patientId}`);
    revalidatePath("/patient/dashboard");

    return { success: true, data: form };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create form",
    };
  }
}

/**
 * Get all forms for a patient (doctor view)
 */
export async function getPatientForms(
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
      .from("form")
      .select(
        `
        *,
        questions:question(*)
      `,
      )
      .eq("patient_id", patientId)
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch forms",
    };
  }
}

/**
 * Get form with questions and answers (patient view)
 */
export async function getFormForPatient(formId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get form
    const { data: form, error: formError } = await supabase
      .from("form")
      .select("*")
      .eq("id", formId)
      .eq("patient_id", user.id)
      .single();

    if (formError || !form) {
      return { success: false, error: "Form not found" };
    }

    // Get questions
    const { data: questions, error: questionsError } = await supabase
      .from("question")
      .select("*")
      .eq("form_id", formId)
      .order("question_order", { ascending: true });

    if (questionsError) {
      return { success: false, error: "Failed to fetch questions" };
    }

    // Get existing answers
    const { data: answers } = await supabase
      .from("answer")
      .select("*")
      .eq("form_id", formId);

    return {
      success: true,
      data: {
        form,
        questions: questions || [],
        answers: answers || [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch form",
    };
  }
}

/**
 * Submit form answers (patient action)
 */
export async function submitFormAnswers(
  formId: string,
  answers: { questionId: string; answerText: string }[],
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify form belongs to this patient
    const { data: form } = await supabase
      .from("form")
      .select("id")
      .eq("id", formId)
      .eq("patient_id", user.id)
      .single();

    if (!form) {
      return { success: false, error: "Form not found" };
    }

    // Delete existing answers
    await supabase.from("answer").delete().eq("form_id", formId);

    // Insert new answers
    const answersData = answers.map((a) => ({
      form_id: formId,
      question_id: a.questionId,
      answer_text: a.answerText,
    }));

    const { error: answersError } = await supabase
      .from("answer")
      .insert(answersData);

    if (answersError) {
      return { success: false, error: "Failed to save answers" };
    }

    // Mark form as submitted
    const { data: updatedForm, error: updateError } = await supabase
      .from("form")
      .update({
        submitted_at: new Date().toISOString(),
        submitted_via: "manual",
      })
      .eq("id", formId)
      .select("patient_id")
      .single();

    if (updateError) {
      return { success: false, error: "Failed to update form status" };
    }

    revalidatePath("/patient/dashboard");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit answers",
    };
  }
}

/**
 * Get patient's pending forms
 */
export async function getPatientPendingForms(): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("form")
      .select(
        `
        *,
        doctor:doctor_id(name)
      `,
      )
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch forms",
    };
  }
}

/**
 * Update a form's metadata (doctor action)
 */
export async function updateForm(
  formId: string,
  updates: Partial<{ title: string; deadline: string | null }>,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify form belongs to this doctor
    const { data: form } = await supabase
      .from("form")
      .select("id, patient_id")
      .eq("id", formId)
      .eq("doctor_id", user.id)
      .single();

    if (!form) {
      return { success: false, error: "Form not found" };
    }

    const { data: updated, error } = await supabase
      .from("form")
      .update({
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.deadline !== undefined
          ? { deadline: updates.deadline }
          : {}),
      })
      .eq("id", formId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/patients/${form.patient_id}`);
    revalidatePath("/patient/dashboard");

    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update form",
    };
  }
}

/**
 * Delete a form and its questions/answers (doctor action)
 */
export async function deleteForm(formId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify form belongs to this doctor
    const { data: form } = await supabase
      .from("form")
      .select("id, patient_id")
      .eq("id", formId)
      .eq("doctor_id", user.id)
      .single();

    if (!form) {
      return { success: false, error: "Form not found" };
    }

    // Delete dependent rows first
    await supabase.from("answer").delete().eq("form_id", formId);
    await supabase.from("question").delete().eq("form_id", formId);

    const { error } = await supabase.from("form").delete().eq("id", formId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/patients/${form.patient_id}`);
    revalidatePath("/patient/dashboard");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete form",
    };
  }
}

/**
 * Create a question for a form (doctor action)
 */
export async function createQuestion(
  formId: string,
  questionText: string,
  questionOrder?: number,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify form belongs to this doctor
    const { data: form } = await supabase
      .from("form")
      .select("id, patient_id")
      .eq("id", formId)
      .eq("doctor_id", user.id)
      .single();

    if (!form) {
      return { success: false, error: "Form not found" };
    }

    let order = questionOrder;
    if (order === undefined) {
      const { data: existing } = await supabase
        .from("question")
        .select("question_order")
        .eq("form_id", formId)
        .order("question_order", { ascending: false })
        .limit(1);

      order =
        existing && existing.length > 0 ? existing[0].question_order + 1 : 0;
    }

    const { data: question, error } = await supabase
      .from("question")
      .insert({
        form_id: formId,
        question_text: questionText,
        question_order: order,
      })
      .select()
      .single();

    if (error || !question) {
      return {
        success: false,
        error: error?.message || "Failed to create question",
      };
    }

    revalidatePath(`/dashboard/patients/${form.patient_id}`);

    return { success: true, data: question };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create question",
    };
  }
}

/**
 * Update a question (doctor action)
 */
export async function updateQuestion(
  questionId: string,
  updates: Partial<{ questionText: string; questionOrder: number }>,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Join question -> form to enforce doctor ownership
    const { data: question } = await supabase
      .from("question")
      .select("id, form:form_id ( id, doctor_id, patient_id )")
      .eq("id", questionId)
      .single();

    if (!question || !question.form || question.form.doctor_id !== user.id) {
      return { success: false, error: "Question not found" };
    }

    const { data: updated, error } = await supabase
      .from("question")
      .update({
        ...(updates.questionText !== undefined
          ? { question_text: updates.questionText }
          : {}),
        ...(updates.questionOrder !== undefined
          ? { question_order: updates.questionOrder }
          : {}),
      })
      .eq("id", questionId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/patients/${question.form.patient_id}`);

    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update question",
    };
  }
}

/**
 * Delete a question (doctor action)
 */
export async function deleteQuestion(
  questionId: string,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Join question -> form to enforce doctor ownership
    const { data: question } = await supabase
      .from("question")
      .select("id, form_id, form:form_id ( id, doctor_id, patient_id )")
      .eq("id", questionId)
      .single();

    if (!question || !question.form || question.form.doctor_id !== user.id) {
      return { success: false, error: "Question not found" };
    }

    // Delete dependent answers for this question
    await supabase.from("answer").delete().eq("question_id", questionId);

    const { error } = await supabase
      .from("question")
      .delete()
      .eq("id", questionId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/patients/${question.form.patient_id}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete question",
    };
  }
}

/**
 * Get all answers for a form (doctor view)
 */
export async function getFormAnswers(formId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify form belongs to this doctor
    const { data: form } = await supabase
      .from("form")
      .select("id")
      .eq("id", formId)
      .eq("doctor_id", user.id)
      .single();

    if (!form) {
      return { success: false, error: "Form not found" };
    }

    const { data: answers, error } = await supabase
      .from("answer")
      .select("*")
      .eq("form_id", formId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: answers || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch answers",
    };
  }
}

/**
 * Delete all answers for a form (doctor action)
 */
export async function deleteFormAnswers(formId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify form belongs to this doctor
    const { data: form } = await supabase
      .from("form")
      .select("id, patient_id")
      .eq("id", formId)
      .eq("doctor_id", user.id)
      .single();

    if (!form) {
      return { success: false, error: "Form not found" };
    }

    const { error } = await supabase
      .from("answer")
      .delete()
      .eq("form_id", formId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/patients/${form.patient_id}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete answers",
    };
  }
}
