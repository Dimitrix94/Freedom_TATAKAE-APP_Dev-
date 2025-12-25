import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Create Supabase client function (matching kv_store pattern for consistency)
const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  // Verify environment variables are set
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("WARNING: Supabase environment variables not set properly!");
    console.error("SUPABASE_URL:", supabaseUrl ? "Set" : "MISSING");
    console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "Set" : "MISSING");
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Create global client instance
const supabase = getSupabaseClient();

// Helper function to verify auth
const verifyAuth = async (authHeader: string | null) => {
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
};

// Health check endpoint
app.get("/make-server-d59960c4/health", (c) => {
  return c.json({ status: "ok" });
});

// Debug endpoint to check all routes
app.get("/make-server-d59960c4/debug/routes", (c) => {
  return c.json({
    message: "Server is running",
    availableRoutes: [
      "POST /signup",
      "PUT /profile",
      "DELETE /profile",
      "GET /user/:id",
      "GET /materials",
      "POST /materials",
      "PUT /materials/:id",
      "DELETE /materials/:id",
      "GET /assessments",
      "POST /assessments",
      "PUT /assessments/:id",
      "DELETE /assessments/:id",
      "POST /assessments/:id/submit",
      "GET /submissions",
      "GET /submissions/student/:studentId",
      "GET /submissions/my-results",
      "PUT /submissions/:submissionId/feedback",
      "GET /progress",
      "GET /progress/:studentId",
      "POST /progress",
      "PUT /progress/:id",
      "DELETE /progress/:id",
      "GET /forum/topics",
      "POST /forum/topics",
      "POST /forum/topics/:id/replies",
      "PUT /forum/topics/:id",
      "DELETE /forum/topics/:id",
      "PUT /forum/topics/:id/pin",
      "DELETE /forum/topics/:id/replies/:replyId",
      "GET /content",
      "GET /content/:page",
      "PUT /content/:page",
      "GET /announcements",
      "POST /announcements",
      "PUT /announcements/:id",
      "DELETE /announcements/:id",
      "POST /send-reset-code",
      "POST /verify-reset-code",
      "GET /ai/test",
      "POST /ai/chat",
    ],
  });
});

// ========== AUTH ROUTES ==========

// Sign up
app.post("/make-server-d59960c4/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();

    // Validate input
    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }

    console.log("Creating user:", { email, name, role });

    const { data, error } =
      await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, role: role || "student" },
      });

    if (error) {
      console.log("Signup error:", error);
      return c.json({ error: error.message }, 400);
    }

    console.log("User created successfully:", data.user?.id);
    return c.json({ user: data.user });
  } catch (error: any) {
    console.log("Signup exception:", error);
    return c.json({ error: error.message || "Signup failed. Please try again." }, 500);
  }
});

// Update profile
app.put("/make-server-d59960c4/profile", async (c) => {
  try {
    const user = await verifyAuth(
      c.req.header("Authorization"),
    );
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { name, bio, preferences, avatar_url } = await c.req.json();

    const { data, error } =
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          name,
          bio,
          preferences,
          avatar_url,
        },
      });

    if (error) return c.json({ error: error.message }, 400);
    return c.json({ user: data.user });
  } catch (error) {
    console.log("Profile update error:", error);
    return c.json({ error: "Update failed" }, 500);
  }
});

// Delete account
app.delete("/make-server-d59960c4/profile", async (c) => {
  try {
    const user = await verifyAuth(
      c.req.header("Authorization"),
    );
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const userId = user.id;
    console.log("Starting account deletion for user:", userId);

    // Delete all user-related data from KV store
    // 1. Delete submissions
    try {
      const submissions = await kv.getByPrefix(
        `submission:${userId}:`,
      );
      console.log(`Deleting ${submissions.length} submissions`);
      for (const submission of submissions) {
        await kv.del(submission.id);
      }
    } catch (error) {
      console.log("Error deleting submissions:", error);
    }

    // 2. Delete progress records from database
    try {
      const { error: progressDeleteError } = await supabase
        .from("progress")
        .delete()
        .eq("student_id", userId);

      if (progressDeleteError) {
        console.log(
          "Error deleting progress from database:",
          progressDeleteError,
        );
      } else {
        console.log("Deleted progress records from database");
      }
    } catch (error) {
      console.log(
        "Exception deleting progress from database:",
        error,
      );
    }

    // 3. Delete progress records from KV store
    try {
      const progressRecords = await kv.getByPrefix(
        `progress:${userId}:`,
      );
      console.log(
        `Deleting ${progressRecords.length} progress records from KV`,
      );
      for (const record of progressRecords) {
        await kv.del(record.id);
      }
    } catch (error) {
      console.log("Error deleting progress from KV:", error);
    }

    // 4. Delete forum topics created by user
    try {
      const topics = await kv.getByPrefix("topic:");
      let deletedTopics = 0;
      for (const topic of topics) {
        const topicData = await kv.get(topic.id);
        if (topicData && topicData.authorId === userId) {
          await kv.del(topic.id);
          deletedTopics++;
        }
      }
      console.log(`Deleted ${deletedTopics} forum topics`);
    } catch (error) {
      console.log("Error deleting forum topics:", error);
    }

    // 5. If teacher, delete materials and assessments created by them
    if (user.user_metadata.role === "teacher") {
      try {
        const materials = await kv.getByPrefix("material:");
        let deletedMaterials = 0;
        for (const material of materials) {
          const materialData = await kv.get(material.id);
          if (
            materialData &&
            materialData.createdBy === userId
          ) {
            await kv.del(material.id);
            deletedMaterials++;
          }
        }
        console.log(`Deleted ${deletedMaterials} materials`);

        const assessments = await kv.getByPrefix("assessment:");
        let deletedAssessments = 0;
        for (const assessment of assessments) {
          const assessmentData = await kv.get(assessment.id);
          if (
            assessmentData &&
            assessmentData.createdBy === userId
          ) {
            await kv.del(assessment.id);
            deletedAssessments++;
          }
        }
        console.log(
          `Deleted ${deletedAssessments} assessments`,
        );
      } catch (error) {
        console.log("Error deleting teacher content:", error);
      }
    }

    // 6. Finally, delete the user from Supabase Auth
    const { error: deleteError } =
      await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.log(
        "Error deleting user from auth:",
        deleteError,
      );
      return c.json(
        { error: "Failed to delete user account" },
        500,
      );
    }

    console.log(
      "Account deletion completed successfully for user:",
      userId,
    );
    return c.json({ success: true });
  } catch (error) {
    console.log("Delete account error:", error);
    return c.json({ error: "Delete failed" }, 500);
  }
});

// Get user by ID (for fetching user email and info)
app.get("/make-server-d59960c4/user/:id", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const userId = c.req.param("id");

    // Get user details from Supabase Auth
    const { data: userData, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !userData?.user) {
      console.log("Get user error:", error);
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      id: userData.user.id,
      email: userData.user.email,
      name: userData.user.user_metadata?.name || "",
      role: userData.user.user_metadata?.role || "student",
    });
  } catch (error) {
    console.log("Get user by ID error:", error);
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

// ========== LEARNING MATERIALS ROUTES ==========

// Get all materials
app.get("/make-server-d59960c4/materials", async (c) => {
  try {
    const materials = await kv.getByPrefix("material:");
    return c.json({ materials });
  } catch (error) {
    console.log("Get materials error:", error);
    return c.json({ error: "Failed to fetch materials" }, 500);
  }
});

// Add material
app.post("/make-server-d59960c4/materials", async (c) => {
  try {
    const user = await verifyAuth(
      c.req.header("Authorization"),
    );
    if (!user || user.user_metadata.role !== "teacher") {
      return c.json(
        { error: "Unauthorized - Teachers only" },
        401,
      );
    }

    const material = await c.req.json();
    const id = `material:${Date.now()}`;
    await kv.set(id, {
      ...material,
      id,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, id });
  } catch (error) {
    console.log("Add material error:", error);
    return c.json({ error: "Failed to add material" }, 500);
  }
});

// Update material
app.put("/make-server-d59960c4/materials/:id", async (c) => {
  try {
    const user = await verifyAuth(
      c.req.header("Authorization"),
    );
    if (!user || user.user_metadata.role !== "teacher") {
      return c.json(
        { error: "Unauthorized - Teachers only" },
        401,
      );
    }

    const id = c.req.param("id");
    const updates = await c.req.json();
    const existing = await kv.get(`material:${id}`);

    if (!existing)
      return c.json({ error: "Material not found" }, 404);

    await kv.set(`material:${id}`, {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return c.json({ success: true });
  } catch (error) {
    console.log("Update material error:", error);
    return c.json({ error: "Failed to update material" }, 500);
  }
});

// Delete material
app.delete("/make-server-d59960c4/materials/:id", async (c) => {
  try {
    const user = await verifyAuth(
      c.req.header("Authorization"),
    );
    if (!user || user.user_metadata.role !== "teacher") {
      return c.json(
        { error: "Unauthorized - Teachers only" },
        401,
      );
    }

    const id = c.req.param("id");
    await kv.del(`material:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log("Delete material error:", error);
    return c.json({ error: "Failed to delete material" }, 500);
  }
});

// ========== ASSESSMENT ROUTES ==========

// Get all assessments
app.get("/make-server-d59960c4/assessments", async (c) => {
  try {
    const assessments = await kv.getByPrefix("assessment:");
    return c.json({ assessments });
  } catch (error) {
    console.log("Get assessments error:", error);
    return c.json(
      { error: "Failed to fetch assessments" },
      500,
    );
  }
});

// Create assessment
app.post("/make-server-d59960c4/assessments", async (c) => {
  try {
    const user = await verifyAuth(
      c.req.header("Authorization"),
    );
    if (!user || user.user_metadata.role !== "teacher") {
      return c.json(
        { error: "Unauthorized - Teachers only" },
        401,
      );
    }

    const assessment = await c.req.json();
    const id = `assessment:${Date.now()}`;
    await kv.set(id, {
      ...assessment,
      id,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, id });
  } catch (error) {
    console.log("Create assessment error:", error);
    return c.json(
      { error: "Failed to create assessment" },
      500,
    );
  }
});

// Update assessment
app.put("/make-server-d59960c4/assessments/:id", async (c) => {
  try {
    const user = await verifyAuth(
      c.req.header("Authorization"),
    );
    if (!user || user.user_metadata.role !== "teacher") {
      return c.json(
        { error: "Unauthorized - Teachers only" },
        401,
      );
    }

    const id = c.req.param("id");
    const updates = await c.req.json();
    const existing = await kv.get(`assessment:${id}`);

    if (!existing)
      return c.json({ error: "Assessment not found" }, 404);

    await kv.set(`assessment:${id}`, {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return c.json({ success: true });
  } catch (error) {
    console.log("Update assessment error:", error);
    return c.json(
      { error: "Failed to update assessment" },
      500,
    );
  }
});

// Delete assessment
app.delete(
  "/make-server-d59960c4/assessments/:id",
  async (c) => {
    try {
      const user = await verifyAuth(
        c.req.header("Authorization"),
      );
      if (!user || user.user_metadata.role !== "teacher") {
        return c.json(
          { error: "Unauthorized - Teachers only" },
          401,
        );
      }

      const id = c.req.param("id");
      await kv.del(`assessment:${id}`);
      return c.json({ success: true });
    } catch (error) {
      console.log("Delete assessment error:", error);
      return c.json(
        { error: "Failed to delete assessment" },
        500,
      );
    }
  },
);

// Submit assessment (student)
app.post(
  "/make-server-d59960c4/assessments/:id/submit",
  async (c) => {
    try {
      const user = await verifyAuth(
        c.req.header("Authorization"),
      );
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const assessmentId = c.req.param("id");
      const { answers } = await c.req.json();

      const assessment = await kv.get(
        `assessment:${assessmentId}`,
      );
      if (!assessment)
        return c.json({ error: "Assessment not found" }, 404);

      // Auto-grade objective questions
      let score = 0;
      const totalQuestions = assessment.questions?.length || 0;

      assessment.questions?.forEach((q: any, index: number) => {
        if (
          q.type === "multiple-choice" &&
          answers[index] === q.correctAnswer
        ) {
          score++;
        } else if (q.type === "short-answer") {
          // Compare short-answer responses (case-insensitive, trimmed)
          const studentAnswer = (answers[index] || "")
            .toString()
            .trim()
            .toLowerCase();
          const correctAnswer = (q.correctAnswer || "")
            .toString()
            .trim()
            .toLowerCase();

          if (studentAnswer === correctAnswer) {
            score++;
          }
        }
      });

      // Save submission to KV store
      const submissionId = `submission:${user.id}:${assessmentId}:${Date.now()}`;
      await kv.set(submissionId, {
        userId: user.id,
        assessmentId,
        answers,
        score,
        totalQuestions,
        submittedAt: new Date().toISOString(),
      });

      // Automatically create progress record in both database and KV store
      const percentage = Math.round(
        (score / totalQuestions) * 100,
      );
      const timestamp = new Date().toISOString();
      const notes = `Completed ${assessment.title} - ${score}/${totalQuestions} correct`;

      // Store in progress table
      console.log("Attempting to create progress record...", {
        studentId: user.id,
        topic: assessment.title,
        score: percentage,
      });

      let progressRecord = null;
      let progressError = null;

      // Get a fresh Supabase client (matching kv_store pattern for reliable connection)
      let dbClient;
      try {
        dbClient = getSupabaseClient();
        console.log("Supabase client created successfully");
      } catch (clientError) {
        console.error("Failed to create Supabase client:", clientError);
        dbClient = null;
      }

      // Try inserting with recorded_by first
      let initialRecord = null;
      let initialError = null;
      
      if (dbClient) {
        try {
          const result = await dbClient
            .from("progress")
            .insert({
              student_id: user.id,
              topic: assessment.title,
              assessment_type: assessment.category || "General",
              score: percentage,
              notes,
              recorded_by: user.id,
              recorded_at: timestamp,
            })
            .select()
            .single();
          initialRecord = result.data;
          initialError = result.error;
        } catch (insertError) {
          console.error("Exception during progress insert:", insertError);
          initialError = insertError as any;
        }
      } else {
        console.error("Cannot insert progress - Supabase client not available");
        initialError = { message: "Supabase client not available", code: "CLIENT_ERROR" } as any;
      }

      if (initialError) {
        const error = initialError as any;
        console.error("Progress creation error (initial attempt):", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          studentId: user.id,
          assessmentTitle: assessment.title,
        });

        // Try without recorded_by if foreign key constraint error
        if (error.code === "23503" || error.message?.includes("foreign key")) {
          console.log("Retrying progress insert without recorded_by field...");
          if (dbClient) {
            try {
              const retryResult = await dbClient
                .from("progress")
                .insert({
                  student_id: user.id,
                  topic: assessment.title,
                  assessment_type: assessment.category || "General",
                  score: percentage,
                  notes,
                  recorded_at: timestamp,
                })
                .select()
                .single();
              
              if (retryResult.error) {
                console.error("Retry also failed:", retryResult.error);
                progressError = retryResult.error;
              } else if (retryResult.data) {
                const retryData = retryResult.data as any;
                console.log("Progress record created on retry:", retryData.id);
                progressRecord = retryData;
              }
            } catch (retryException) {
              console.error("Exception during retry insert:", retryException);
              progressError = retryException as any;
            }
          } else {
            progressError = initialError;
          }
        } else {
          progressError = initialError;
        }
      } else if (initialRecord) {
        const record = initialRecord as any;
        console.log("Progress record created successfully (initial attempt):", record.id);
        progressRecord = record;
      }

      // Always save to KV store as backup, even if database insert fails
      const kvKey = `progress:${user.id}:${assessment.title}:${Date.now()}`;
      const progressData = {
        studentId: user.id,
        topic: assessment.title,
        assessmentType: assessment.category || "General",
        score: percentage,
        notes,
        recordedBy: user.id,
        recordedAt: timestamp,
      };

      // Verify the record was actually created by querying it back
      if (progressRecord && (progressRecord as any).id && dbClient) {
        const recordId = (progressRecord as any).id;
        let verifyRecord = null;
        let verifyError = null;
        
        try {
          const verifyResult = await dbClient
            .from("progress")
            .select("*")
            .eq("id", recordId)
            .single();
          verifyRecord = verifyResult.data;
          verifyError = verifyResult.error;
        } catch (verifyException) {
          console.error("Exception during verification:", verifyException);
          verifyError = verifyException as any;
        }

        if (verifyError || !verifyRecord) {
          console.error("WARNING: Progress record was created but cannot be verified:", verifyError);
          // Still save to KV store as backup
          try {
            await kv.set(kvKey, { ...progressData, id: recordId });
            console.log("Progress saved to KV store as backup (database verification failed)");
          } catch (kvError) {
            console.error("Failed to save progress to KV store:", kvError);
          }
        } else {
          console.log("Progress record verified in database:", (verifyRecord as any).id);
          // Save to KV store with database ID
          try {
            await kv.set(kvKey, { ...progressData, id: recordId });
            console.log("Progress saved to both database and KV store");
          } catch (kvError) {
            console.error("Failed to save progress to KV store:", kvError);
          }
        }
      } else if (progressError) {
        console.error("CRITICAL: Failed to create progress record in database after all attempts:", progressError);
        // Save to KV store as fallback even though database insert failed
        try {
          await kv.set(kvKey, { ...progressData, id: `temp-${Date.now()}` });
          console.log("Progress saved to KV store only (database insert failed, using KV store as fallback)");
        } catch (kvError) {
          console.error("CRITICAL: Failed to save progress to both database AND KV store:", kvError);
        }
      } else {
        // No record and no error - this shouldn't happen, but save to KV store anyway
        console.error("WARNING: Progress insert returned no record and no error (unexpected state)");
        try {
          await kv.set(kvKey, { ...progressData, id: `temp-${Date.now()}` });
          console.log("Progress saved to KV store only (unexpected state)");
        } catch (kvError) {
          console.error("Failed to save progress to KV store:", kvError);
        }
      }

      return c.json({ success: true, score, totalQuestions });
    } catch (error) {
      console.log("Submit assessment error:", error);
      return c.json(
        { error: "Failed to submit assessment" },
        500,
      );
    }
  },
);

// ========== ASSESSMENT SUBMISSION & FEEDBACK ROUTES ==========

// Get current user's submissions (for students to view their results)
app.get("/make-server-d59960c4/submissions/my-results", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const submissions = await kv.getByPrefix(`submission:${user.id}:`);
    
    // Enrich with assessment details
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission: any) => {
        const assessment = await kv.get(submission.assessmentId);
        return {
          ...submission,
          assessmentTitle: assessment?.title || "Unknown Assessment",
          assessmentCategory: assessment?.category || "General",
        };
      })
    );

    return c.json({ submissions: enrichedSubmissions });
  } catch (error) {
    console.log("Get my results error:", error);
    return c.json({ error: "Failed to fetch results" }, 500);
  }
});

// Get submissions for a specific student
app.get("/make-server-d59960c4/submissions/student/:studentId", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const studentId = c.req.param("studentId");

    // Only allow teachers or the student themselves
    if (
      user.user_metadata.role !== "teacher" &&
      user.id !== studentId
    ) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const submissions = await kv.getByPrefix(`submission:${studentId}:`);
    
    // Enrich with assessment details
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission: any) => {
        const assessment = await kv.get(submission.assessmentId);
        return {
          ...submission,
          assessmentTitle: assessment?.title || "Unknown Assessment",
          assessmentCategory: assessment?.category || "General",
        };
      })
    );

    return c.json({ submissions: enrichedSubmissions });
  } catch (error) {
    console.log("Get student submissions error:", error);
    return c.json({ error: "Failed to fetch submissions" }, 500);
  }
});

// Get all submissions (for teachers)
app.get("/make-server-d59960c4/submissions", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user || user.user_metadata.role !== "teacher") {
      return c.json({ error: "Unauthorized - Teachers only" }, 401);
    }

    const submissions = await kv.getByPrefix("submission:");
    
    // Enrich submissions with user and assessment details
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission: any) => {
        // Get user details
        const { data: userData } = await supabase.auth.admin.getUserById(
          submission.userId
        );
        
        // Get assessment details
        const assessment = await kv.get(submission.assessmentId);
        
        return {
          ...submission,
          studentName: userData?.user?.user_metadata?.name || "Unknown",
          studentEmail: userData?.user?.email || "Unknown",
          assessmentTitle: assessment?.title || "Unknown Assessment",
        };
      })
    );

    return c.json({ submissions: enrichedSubmissions });
  } catch (error) {
    console.log("Get submissions error:", error);
    return c.json({ error: "Failed to fetch submissions" }, 500);
  }
});

// Add or update feedback for a submission
app.put("/make-server-d59960c4/submissions/:submissionId/feedback", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user || user.user_metadata.role !== "teacher") {
      return c.json({ error: "Unauthorized - Teachers only" }, 401);
    }

    const submissionId = c.req.param("submissionId");
    const { feedback, manualScore } = await c.req.json();

    const submission = await kv.get(submissionId);
    if (!submission) {
      return c.json({ error: "Submission not found" }, 404);
    }

    // Update submission with feedback
    const updatedSubmission = {
      ...submission,
      feedback,
      manualScore: manualScore !== undefined ? manualScore : submission.score,
      feedbackProvidedBy: user.id,
      feedbackProvidedByName: user.user_metadata.name,
      feedbackProvidedAt: new Date().toISOString(),
    };

    await kv.set(submissionId, updatedSubmission);

    return c.json({ success: true });
  } catch (error) {
    console.log("Add feedback error:", error);
    return c.json({ error: "Failed to add feedback" }, 500);
  }
});

// ========== PROGRESS TRACKING ROUTES ==========

// Get all progress records (teachers only)
app.get("/make-server-d59960c4/progress", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user || user.user_metadata.role !== "teacher") {
      return c.json({ error: "Unauthorized - Teachers only" }, 401);
    }

    // Get a fresh Supabase client for reliable connection
    const dbClient = getSupabaseClient();

    // Read all progress from progress table
    const { data, error } = await dbClient
      .from("progress")
      .select("*")
      .order("recorded_at", { ascending: false });

    if (error) throw error;

    // Transform to match frontend expectations
    const progress =
      data?.map((record) => ({
        id: record.id,
        studentId: record.student_id,
        topic: record.topic,
        assessmentType: record.assessment_type,
        score: record.score,
        notes: record.notes,
        recordedBy: record.recorded_by,
        recordedAt: record.recorded_at,
      })) || [];

    return c.json({ progress });
  } catch (error) {
    console.log("Get all progress error:", error);
    return c.json({ error: "Failed to fetch progress" }, 500);
  }
});

// Get student progress
app.get(
  "/make-server-d59960c4/progress/:studentId",
  async (c) => {
    try {
      const user = await verifyAuth(
        c.req.header("Authorization"),
      );
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const studentId = c.req.param("studentId");
      
      // Check if studentId is an email address and resolve to actual user ID
      let actualStudentId = studentId;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (emailRegex.test(studentId)) {
        console.log("Student identifier is an email, looking up user ID:", studentId);
        
        try {
          // Look up the user by email
          const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
          
          if (listError) {
            console.error("Error listing users:", listError);
            return c.json({ error: "Failed to lookup student by email" }, 500);
          }
          
          const studentUser = authUsers?.users?.find(u => u.email === studentId);
          
          if (!studentUser) {
            return c.json({ error: `Student not found with email: ${studentId}` }, 404);
          }
          
          actualStudentId = studentUser.id;
          console.log("Resolved email to user ID:", actualStudentId);
        } catch (emailLookupError) {
          console.error("Error during email lookup:", emailLookupError);
          return c.json({ error: "Failed to lookup student" }, 500);
        }
      }

      // Only allow teachers or the student themselves
      if (
        user.user_metadata.role !== "teacher" &&
        user.id !== actualStudentId
      ) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      let progress: any[] = [];

      // Read from progress table
      const { data, error } = await supabase
        .from("progress")
        .select("*")
        .eq("student_id", actualStudentId)
        .order("recorded_at", { ascending: false });

      if (error) {
        console.error("Error fetching progress from database:", error);
        // Don't throw, continue to check KV store
      }

      // Transform database records to match frontend expectations
      if (data && data.length > 0) {
        progress = data.map((record) => ({
          id: record.id,
          studentId: record.student_id,
          topic: record.topic,
          assessmentType: record.assessment_type,
          score: record.score,
          notes: record.notes,
          recordedBy: record.recorded_by,
          recordedAt: record.recorded_at,
        }));
        console.log(`Fetched ${progress.length} progress records from database for student ${actualStudentId}`);
      } else {
        console.log(`No progress records found in database for student ${actualStudentId}, checking KV store...`);
        
        // Fallback: Check KV store for progress records
        try {
          const kvRecords = await kv.getByPrefix(`progress:${actualStudentId}:`);
          console.log(`Found ${kvRecords.length} progress records in KV store for student ${actualStudentId}`);
          
          const kvProgress: any[] = kvRecords.map((record: any) => ({
            id: record.id || record.key,
            studentId: record.studentId,
            topic: record.topic,
            assessmentType: record.assessmentType,
            score: record.score,
            notes: record.notes,
            recordedBy: record.recordedBy,
            recordedAt: record.recordedAt,
          }));
          
          // Sort by recordedAt descending
          kvProgress.sort((a, b) => {
            const dateA = new Date(a.recordedAt).getTime();
            const dateB = new Date(b.recordedAt).getTime();
            return dateB - dateA;
          });
          
          progress = kvProgress;
          console.log(`Fetched ${progress.length} progress records from KV store for student ${actualStudentId}`);
        } catch (kvError) {
          console.error("Error fetching from KV store:", kvError);
        }
      }

      console.log(`Total progress records returned: ${progress.length}`);
      return c.json({ progress });
    } catch (error) {
      console.error("Get progress error:", error);
      return c.json({ error: "Failed to fetch progress" }, 500);
    }
  },
);

// Add student progress
app.post("/make-server-d59960c4/progress", async (c) => {
  try {
    const user = await verifyAuth(
      c.req.header("Authorization"),
    );
    if (!user || user.user_metadata.role !== "teacher") {
      return c.json(
        { error: "Unauthorized - Teachers only" },
        401,
      );
    }

    const body = await c.req.json();
    console.log("Add progress request body:", body);
    
    const { studentId, topic, assessmentType, score, notes } = body;
    
    // Validate required fields
    if (!studentId || !topic || score === undefined || score === null) {
      return c.json({ 
        error: "Missing required fields: studentId, topic, and score are required" 
      }, 400);
    }
    
    const timestamp = new Date().toISOString();
    
    // Check if studentId is an email address and resolve to actual user ID
    let actualStudentId = studentId;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emailRegex.test(studentId)) {
      console.log("Student identifier is an email, looking up user ID:", studentId);
      
      try {
        // Look up the user by email
        const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          console.error("Error listing users:", listError);
          return c.json({ error: "Failed to lookup student by email" }, 500);
        }
        
        const studentUser = authUsers?.users?.find(u => u.email === studentId);
        
        if (!studentUser) {
          return c.json({ error: `Student not found with email: ${studentId}` }, 404);
        }
        
        actualStudentId = studentUser.id;
        console.log("Resolved email to user ID:", actualStudentId);
      } catch (emailLookupError) {
        console.error("Error during email lookup:", emailLookupError);
        return c.json({ error: "Failed to lookup student" }, 500);
      }
    }
    
    const kvKey = `progress:${actualStudentId}:${topic}:${Date.now()}`;

    console.log("Attempting to insert progress record:", {
      student_id: actualStudentId,
      topic,
      assessment_type: assessmentType || "General",
      score,
      notes: notes || "",
      recorded_by: user.id,
    });

    // Store in progress table
    const { data: progressRecord, error: dbError } =
      await supabase
        .from("progress")
        .insert({
          student_id: actualStudentId,
          topic,
          assessment_type: assessmentType || "General",
          score,
          notes: notes || "",
          recorded_by: user.id,
          recorded_at: timestamp,
        })
        .select()
        .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      console.error("Error details:", {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
      });
      throw dbError;
    }

    console.log("Progress record created successfully:", progressRecord.id);

    // Also store in KV store
    try {
      await kv.set(kvKey, {
        id: progressRecord.id,
        studentId: actualStudentId,
        topic,
        assessmentType: assessmentType || "General",
        score,
        notes: notes || "",
        recordedBy: user.id,
        recordedAt: timestamp,
      });
      console.log("Progress record saved to KV store");
    } catch (kvError) {
      console.error("KV store error (non-critical):", kvError);
      // Don't fail the request if KV store fails
    }

    return c.json({ success: true, id: progressRecord.id });
  } catch (error) {
    console.error("Add progress error:", error);
    const errorMessage = error?.message || "Failed to add progress";
    return c.json({ error: errorMessage }, 500);
  }
});

// Update student progress
app.put("/make-server-d59960c4/progress/:id", async (c) => {
  try {
    const user = await verifyAuth(
      c.req.header("Authorization"),
    );
    if (!user || user.user_metadata.role !== "teacher") {
      return c.json(
        { error: "Unauthorized - Teachers only" },
        401,
      );
    }

    const id = c.req.param("id");
    const { topic, assessmentType, score, notes } =
      await c.req.json();
    const timestamp = new Date().toISOString();

    // Update in progress table
    const { data: updatedRecord, error: dbError } =
      await supabase
        .from("progress")
        .update({
          topic,
          assessment_type: assessmentType,
          score,
          notes,
          updated_at: timestamp,
        })
        .eq("id", id)
        .select()
        .single();

    if (dbError) throw dbError;

    // Update in KV store
    const kvRecords = await kv.getByPrefix(
      `progress:${updatedRecord.student_id}:`,
    );
    for (const record of kvRecords) {
      const kvKey = record.id;
      const recordData = await kv.get(kvKey);
      if (recordData && recordData.id === id) {
        await kv.set(kvKey, {
          ...recordData,
          topic,
          assessmentType,
          score,
          notes,
          updatedAt: timestamp,
        });
        break;
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.log("Update progress error:", error);
    return c.json({ error: "Failed to update progress" }, 500);
  }
});

// Delete student progress
app.delete("/make-server-d59960c4/progress/:id", async (c) => {
  try {
    const user = await verifyAuth(
      c.req.header("Authorization"),
    );
    if (!user || user.user_metadata.role !== "teacher") {
      return c.json(
        { error: "Unauthorized - Teachers only" },
        401,
      );
    }

    const id = c.req.param("id");

    // Get the record first to find student_id
    const { data: record, error: fetchError } = await supabase
      .from("progress")
      .select("student_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Delete from progress table
    const { error: dbError } = await supabase
      .from("progress")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    // Delete from KV store
    const kvRecords = await kv.getByPrefix(
      `progress:${record.student_id}:`,
    );
    for (const kvRecord of kvRecords) {
      const kvKey = kvRecord.id;
      const recordData = await kv.get(kvKey);
      if (recordData && recordData.id === id) {
        await kv.del(kvKey);
        break;
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.log("Delete progress error:", error);
    return c.json({ error: "Failed to delete progress" }, 500);
  }
});

// ========== FORUM ROUTES ==========

// Get all topics
app.get("/make-server-d59960c4/forum/topics", async (c) => {
  try {
    const search = c.req.query("search")?.toLowerCase() || "";
    const category = c.req.query("category") || "";
    const author = c.req.query("author")?.toLowerCase() || "";
    const sortBy = c.req.query("sortBy") || "";
    const sortOrder = c.req.query("sortOrder") || "asc";

    // Fetch all topics
    let topics = await kv.getByPrefix("topic:");

    // --- SEARCH ---
    if (search) {
      topics = topics.filter((t: any) =>
        t.title?.toLowerCase().includes(search) ||
        t.content?.toLowerCase().includes(search)
      );
    }

    // --- CATEGORY FILTER ---
    if (category) {
      topics = topics.filter((t: any) => t.category === category);
    }

    // --- AUTHOR FILTER ---
    if (author) {
      topics = topics.filter((t: any) => 
        t.authorName?.toLowerCase().includes(author)
      );
    }

    // --- SORTING ---
    if (sortBy === "date") {
      topics.sort((a: any, b: any) => {
        return sortOrder === "desc"
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    }

    if (sortBy === "title") {
      topics.sort((a: any, b: any) => {
        return sortOrder === "desc"
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title);
      });
    }

    // Always sort pinned topics to the top
    topics.sort((a: any, b: any) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    return c.json({ topics });

  } catch (error) {
    console.log("Get topics error:", error);
    return c.json({ error: "Failed to fetch topics" }, 500);
  }
});

// Create new topic
app.post("/make-server-d59960c4/forum/topics", async (c) => {
  try {
    const user = await verifyAuth(
      c.req.header("Authorization"),
    );
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { title, content, category } = await c.req.json();
    const id = `topic:${Date.now()}`;

    await kv.set(id, {
      id,
      title,
      content,
      category,
      authorId: user.id,
      authorName: user.user_metadata.name,
      createdAt: new Date().toISOString(),
      replies: [],
      isPinned: false,
    });

    return c.json({ success: true, id });
  } catch (error) {
    console.log("Create topic error:", error);
    return c.json({ error: "Failed to create topic" }, 500);
  }
});

// Reply to topic
app.post(
  "/make-server-d59960c4/forum/topics/:id/replies",
  async (c) => {
    try {
      const user = await verifyAuth(
        c.req.header("Authorization"),
      );
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const topicId = c.req.param("id");
      const { content } = await c.req.json();

      const topic = await kv.get(`topic:${topicId}`);
      if (!topic)
        return c.json({ error: "Topic not found" }, 404);

      const reply = {
        id: `reply:${Date.now()}`,
        content,
        authorId: user.id,
        authorName: user.user_metadata.name,
        createdAt: new Date().toISOString(),
      };

      topic.replies = topic.replies || [];
      topic.replies.push(reply);

      await kv.set(`topic:${topicId}`, topic);
      return c.json({ success: true });
    } catch (error) {
      console.log("Reply to topic error:", error);
      return c.json({ error: "Failed to add reply" }, 500);
    }
  },
);

// Edit topic
app.put("/make-server-d59960c4/forum/topics/:id", async (c) => {
  try {
    const user = await verifyAuth(
      c.req.header("Authorization"),
    );
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const topicId = c.req.param("id");
    const topic = await kv.get(`topic:${topicId}`);

    if (!topic)
      return c.json({ error: "Topic not found" }, 404);
    if (
      topic.authorId !== user.id &&
      user.user_metadata.role !== "teacher"
    ) {
      return c.json(
        { error: "Unauthorized - Can only edit own posts" },
        401,
      );
    }

    const { title, content } = await c.req.json();
    await kv.set(`topic:${topicId}`, {
      ...topic,
      title,
      content,
      editedAt: new Date().toISOString(),
    });

    return c.json({ success: true });
  } catch (error) {
    console.log("Edit topic error:", error);
    return c.json({ error: "Failed to edit topic" }, 500);
  }
});

// Delete topic
app.delete(
  "/make-server-d59960c4/forum/topics/:id",
  async (c) => {
    try {
      const user = await verifyAuth(
        c.req.header("Authorization"),
      );
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const topicId = c.req.param("id");
      const topic = await kv.get(`topic:${topicId}`);

      if (!topic)
        return c.json({ error: "Topic not found" }, 404);
      if (
        topic.authorId !== user.id &&
        user.user_metadata.role !== "teacher"
      ) {
        return c.json(
          { error: "Unauthorized - Can only delete own posts" },
          401,
        );
      }

      await kv.del(`topic:${topicId}`);
      return c.json({ success: true });
    } catch (error) {
      console.log("Delete topic error:", error);
      return c.json({ error: "Failed to delete topic" }, 500);
    }
  },
);

// Pin/Unpin topic (Teachers only)
app.put(
  "/make-server-d59960c4/forum/topics/:id/pin",
  async (c) => {
    try {
      const user = await verifyAuth(
        c.req.header("Authorization"),
      );
      if (!user) return c.json({ error: "Unauthorized" }, 401);
      
      // Only teachers can pin topics
      if (user.user_metadata.role !== "teacher") {
        return c.json(
          { error: "Unauthorized - Teachers only" },
          401,
        );
      }

      const topicId = c.req.param("id");
      const topic = await kv.get(`topic:${topicId}`);

      if (!topic)
        return c.json({ error: "Topic not found" }, 404);

      const { isPinned } = await c.req.json();
      
      await kv.set(`topic:${topicId}`, {
        ...topic,
        isPinned: isPinned,
      });

      return c.json({ success: true });
    } catch (error) {
      console.log("Pin topic error:", error);
      return c.json({ error: "Failed to pin topic" }, 500);
    }
  },
);

// Delete reply (Teachers only or reply author)
app.delete(
  "/make-server-d59960c4/forum/topics/:id/replies/:replyId",
  async (c) => {
    try {
      const user = await verifyAuth(
        c.req.header("Authorization"),
      );
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const topicId = c.req.param("id");
      const replyId = c.req.param("replyId");
      const topic = await kv.get(`topic:${topicId}`);

      if (!topic)
        return c.json({ error: "Topic not found" }, 404);

      const replyIndex = topic.replies.findIndex((r: any) => r.id === replyId);
      if (replyIndex === -1)
        return c.json({ error: "Reply not found" }, 404);

      const reply = topic.replies[replyIndex];
      
      // Check if user is the reply author or a teacher
      if (
        reply.authorId !== user.id &&
        user.user_metadata.role !== "teacher"
      ) {
        return c.json(
          { error: "Unauthorized - Can only delete own replies" },
          401,
        );
      }

      // Remove the reply
      topic.replies.splice(replyIndex, 1);
      await kv.set(`topic:${topicId}`, topic);

      return c.json({ success: true });
    } catch (error) {
      console.log("Delete reply error:", error);
      return c.json({ error: "Failed to delete reply" }, 500);
    }
  },
);

// ========== CONTENT MANAGEMENT ROUTES ==========

// Get website content
app.get("/make-server-d59960c4/content", async (c) => {
  try {
    const content = await kv.getByPrefix("content:");
    return c.json({ content });
  } catch (error) {
    console.log("Get content error:", error);
    return c.json({ error: "Failed to fetch content" }, 500);
  }
});

// Get specific page content (public access for landing/about pages)
app.get("/make-server-d59960c4/content/:page", async (c) => {
  try {
    const page = c.req.param("page");
    const content = await kv.get(`content:${page}`);

    if (!content) {
      return c.json({ content: {} });
    }

    return c.json({ content });
  } catch (error) {
    console.log("Get page content error:", error);
    return c.json(
      { error: "Failed to fetch page content" },
      500,
    );
  }
});

// Update website content
app.put("/make-server-d59960c4/content/:page", async (c) => {
  const user = await verifyAuth(c.req.header("Authorization"));

  // 1. Authorization Check (Must be a teacher)
  if (!user || user.user_metadata.role !== "teacher") {
    return c.json(
      { error: "Unauthorized - Teachers only" },
      401,
    );
  }

  const page = c.req.param("page");

  try {
    const updates = await c.req.json();

    // --- Dual Write Preparations ---
    const currentTime = new Date().toISOString();

    // Data for KV Store (Single source of truth)
    const kvValue = {
      ...updates,
      updatedAt: currentTime,
      updatedBy: user.id,
    };

    // Data for Content Table (Audit/History Log)
    const auditData = {
      page: page,
      data: updates, // Store the raw change payload
      updated_by: user.id,
    };

    // 2. KV Store UPSERT (Updates the most current content)
    await kv.set(`content:${page}`, kvValue);

    // 3. Content Table INSERT (Creates a new historical record)
    // NOTE: This requires the 'supabase' client object to be initialized globally.
    const { error: insertError } = await supabase
      .from("content")
      .insert([auditData]);

    if (insertError) {
      // Log the error for auditing, but allow the primary KV update to succeed
      console.error("Audit log insertion failed:", insertError);
    }

    // 4. Return Success
    return c.json({ success: true });
  } catch (error) {
    console.log("Update content error:", error);
    return c.json({ error: "Failed to update content" }, 500);
  }
});

// ========== ANNOUNCEMENTS ROUTES ==========

// Get all announcements
app.get("/make-server-d59960c4/announcements", async (c) => {
  try {
    const announcements = await kv.getByPrefix("announcement:");
    return c.json({ announcements });
  } catch (error) {
    console.log("Get announcements error:", error);
    return c.json({ error: "Failed to fetch announcements" }, 500);
  }
});

// Create new announcement
app.post("/make-server-d59960c4/announcements", async (c) => {
  const user = await verifyAuth(c.req.header("Authorization"));

  if (!user || user.user_metadata.role !== "teacher") {
    return c.json(
      { error: "Unauthorized - Teachers only" },
      401,
    );
  }

  try {
    const { title, message, priority } = await c.req.json();
    const timestamp = Date.now();
    const id = `announcement:${timestamp}`;

    const announcement = {
      id,
      title,
      message,
      priority: priority || "medium",
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    };

    await kv.set(id, announcement);

    return c.json({ success: true, announcement });
  } catch (error) {
    console.log("Create announcement error:", error);
    return c.json({ error: "Failed to create announcement" }, 500);
  }
});

// Update announcement
app.put("/make-server-d59960c4/announcements/:id", async (c) => {
  const user = await verifyAuth(c.req.header("Authorization"));

  if (!user || user.user_metadata.role !== "teacher") {
    return c.json(
      { error: "Unauthorized - Teachers only" },
      401,
    );
  }

  try {
    const announcementId = c.req.param("id");
    const fullId = announcementId.startsWith("announcement:")
      ? announcementId
      : `announcement:${announcementId}`;
    
    const existing = await kv.get(fullId);
    if (!existing) {
      return c.json({ error: "Announcement not found" }, 404);
    }

    const { title, message, priority } = await c.req.json();

    const updated = {
      ...existing,
      title,
      message,
      priority: priority || existing.priority,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };

    await kv.set(fullId, updated);

    return c.json({ success: true, announcement: updated });
  } catch (error) {
    console.log("Update announcement error:", error);
    return c.json({ error: "Failed to update announcement" }, 500);
  }
});

// Delete announcement
app.delete("/make-server-d59960c4/announcements/:id", async (c) => {
  const user = await verifyAuth(c.req.header("Authorization"));

  if (!user || user.user_metadata.role !== "teacher") {
    return c.json(
      { error: "Unauthorized - Teachers only" },
      401,
    );
  }

  try {
    const announcementId = c.req.param("id");
    const fullId = announcementId.startsWith("announcement:")
      ? announcementId
      : `announcement:${announcementId}`;

    await kv.del(fullId);

    return c.json({ success: true });
  } catch (error) {
    console.log("Delete announcement error:", error);
    return c.json({ error: "Failed to delete announcement" }, 500);
  }
});

// ========== CLASS MANAGEMENT ROUTES ==========

// Get all classes for the teacher
app.get("/make-server-d59960c4/classes", async (c) => {
  const user = await verifyAuth(c.req.header("Authorization"));

  if (!user || user.user_metadata.role !== "teacher") {
    return c.json({ error: "Unauthorized - Teachers only" }, 401);
  }

  try {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return c.json({ classes: data || [] });
  } catch (error) {
    console.error("Get classes error:", error);
    return c.json({ error: "Failed to fetch classes" }, 500);
  }
});

// Create a new class
app.post("/make-server-d59960c4/classes", async (c) => {
  const user = await verifyAuth(c.req.header("Authorization"));

  if (!user || user.user_metadata.role !== "teacher") {
    return c.json({ error: "Unauthorized - Teachers only" }, 401);
  }

  try {
    const { name } = await c.req.json();

    if (!name || !name.trim()) {
      return c.json({ error: "Class name is required" }, 400);
    }

    const { data, error } = await supabase
      .from("classes")
      .insert({
        name: name.trim(),
        teacher_id: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, class: data });
  } catch (error) {
    console.error("Create class error:", error);
    return c.json({ error: "Failed to create class" }, 500);
  }
});

// Get all students (for assignment)
app.get("/make-server-d59960c4/students", async (c) => {
  const user = await verifyAuth(c.req.header("Authorization"));

  if (!user || user.user_metadata.role !== "teacher") {
    return c.json({ error: "Unauthorized - Teachers only" }, 401);
  }

  try {
    // Get all users with student role
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const students = authUsers?.users?.filter(
      (u) => u.user_metadata?.role === "student"
    ) || [];

    return c.json({ students });
  } catch (error) {
    console.error("Get students error:", error);
    return c.json({ error: "Failed to fetch students" }, 500);
  }
});

// Get class assignments
app.get("/make-server-d59960c4/class-assignments", async (c) => {
  const user = await verifyAuth(c.req.header("Authorization"));

  if (!user || user.user_metadata.role !== "teacher") {
    return c.json({ error: "Unauthorized - Teachers only" }, 401);
  }

  try {
    const classId = c.req.query("class_id");

    if (!classId) {
      return c.json({ error: "class_id is required" }, 400);
    }

    // Verify the class belongs to this teacher
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id")
      .eq("id", classId)
      .eq("teacher_id", user.id)
      .single();

    if (classError || !classData) {
      return c.json({ error: "Class not found or unauthorized" }, 404);
    }

    const { data, error } = await supabase
      .from("class_assignments")
      .select("*")
      .eq("class_id", classId);

    if (error) throw error;

    return c.json({ assignments: data || [] });
  } catch (error) {
    console.error("Get class assignments error:", error);
    return c.json({ error: "Failed to fetch assignments" }, 500);
  }
});

// Assign students to class
app.post("/make-server-d59960c4/class-assignments", async (c) => {
  const user = await verifyAuth(c.req.header("Authorization"));

  if (!user || user.user_metadata.role !== "teacher") {
    return c.json({ error: "Unauthorized - Teachers only" }, 401);
  }

  try {
    const { class_id, student_ids } = await c.req.json();

    if (!class_id || !student_ids || !Array.isArray(student_ids)) {
      return c.json({ error: "class_id and student_ids array are required" }, 400);
    }

    // Verify the class belongs to this teacher
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id")
      .eq("id", class_id)
      .eq("teacher_id", user.id)
      .single();

    if (classError || !classData) {
      return c.json({ error: "Class not found or unauthorized" }, 404);
    }

    // Create assignments
    const assignments = student_ids.map((student_id) => ({
      class_id,
      student_id,
      assigned_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("class_assignments")
      .insert(assignments)
      .select();

    if (error) throw error;

    return c.json({ success: true, assignments: data });
  } catch (error) {
    console.error("Assign students error:", error);
    return c.json({ error: "Failed to assign students" }, 500);
  }
});

// Remove student from class
app.delete("/make-server-d59960c4/class-assignments", async (c) => {
  const user = await verifyAuth(c.req.header("Authorization"));

  if (!user || user.user_metadata.role !== "teacher") {
    return c.json({ error: "Unauthorized - Teachers only" }, 401);
  }

  try {
    const { class_id, student_id } = await c.req.json();

    if (!class_id || !student_id) {
      return c.json({ error: "class_id and student_id are required" }, 400);
    }

    // Verify the class belongs to this teacher
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id")
      .eq("id", class_id)
      .eq("teacher_id", user.id)
      .single();

    if (classError || !classData) {
      return c.json({ error: "Class not found or unauthorized" }, 404);
    }

    const { error } = await supabase
      .from("class_assignments")
      .delete()
      .eq("class_id", class_id)
      .eq("student_id", student_id);

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    console.error("Remove student error:", error);
    return c.json({ error: "Failed to remove student" }, 500);
  }
});

// Get class comparison data
app.get("/make-server-d59960c4/class-comparison", async (c) => {
  const user = await verifyAuth(c.req.header("Authorization"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check if user is a teacher
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "teacher") {
    return c.json({ error: "Unauthorized - Teachers only" }, 401);
  }

  try {
    const classIds = c.req.queries("class_ids") || [];
    const topic = c.req.query("topic");
    const startDate = c.req.query("start_date");
    const endDate = c.req.query("end_date");

    if (classIds.length === 0) {
      return c.json({ error: "At least one class_id is required" }, 400);
    }

    const comparisonData = [];

    for (const classId of classIds) {
      // Verify the class belongs to this teacher
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .eq("teacher_id", user.id)
        .single();

      if (classError || !classData) {
        continue; // Skip unauthorized classes
      }

      // Get students in this class
      const { data: assignments } = await supabase
        .from("class_assignments")
        .select("student_id")
        .eq("class_id", classId);

      const studentIds = assignments?.map((a) => a.student_id) || [];

      if (studentIds.length === 0) {
        comparisonData.push({
          class_id: classId,
          class_name: classData.name,
          average_score: 0,
          total_students: 0,
          at_risk_count: 0,
          improving_count: 0,
          declining_count: 0,
          topic_scores: {},
        });
        continue;
      }

      // Build progress query
      let progressQuery = supabase
        .from("progress")
        .select("*")
        .in("student_id", studentIds);

      if (topic) {
        progressQuery = progressQuery.eq("assessment_type", topic);
      }

      if (startDate) {
        progressQuery = progressQuery.gte("recorded_at", startDate);
      }

      if (endDate) {
        progressQuery = progressQuery.lte("recorded_at", endDate);
      }

      const { data: progressData } = await progressQuery;

      // Calculate metrics - filter out null scores
      const scores = (progressData || [])
        .filter((p) => p.score != null)
        .map((p) => p.score);
      
      const averageScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

      // Calculate topic scores - filter out null values
      const topicScores: { [key: string]: number[] } = {};
      (progressData || []).forEach((p) => {
        if (p.assessment_type && p.score != null) {
          if (!topicScores[p.assessment_type]) {
            topicScores[p.assessment_type] = [];
          }
          topicScores[p.assessment_type].push(p.score);
        }
      });

      const topicAverages: { [key: string]: number } = {};
      Object.keys(topicScores).forEach((t) => {
        const tScores = topicScores[t];
        if (tScores.length > 0) {
          topicAverages[t] = tScores.reduce((a, b) => a + b, 0) / tScores.length;
        }
      });

      // Calculate at-risk, improving, declining counts
      let atRiskCount = 0;
      let improvingCount = 0;
      let decliningCount = 0;

      for (const studentId of studentIds) {
        const studentProgress = (progressData || []).filter((p) => p.student_id === studentId);
        const studentScores = studentProgress
          .filter((p) => p.score != null)
          .map((p) => p.score);

        if (studentScores.length > 0) {
          const avgScore = studentScores.reduce((a, b) => a + b, 0) / studentScores.length;
          if (avgScore < 60) atRiskCount++;

          if (studentScores.length >= 2) {
            const recentScores = studentScores.slice(-3);
            const trend = recentScores[recentScores.length - 1] - recentScores[0];
            if (trend > 5) improvingCount++;
            if (trend < -5) decliningCount++;
          }
        }
      }

      comparisonData.push({
        class_id: classId,
        class_name: classData.name,
        average_score: Math.round(averageScore * 10) / 10,
        total_students: studentIds.length,
        at_risk_count: atRiskCount,
        improving_count: improvingCount,
        declining_count: decliningCount,
        topic_scores: topicAverages,
      });
    }

    return c.json({ comparison: comparisonData });
  } catch (error) {
    console.error("Class comparison error:", error);
    return c.json({ error: "Failed to generate comparison" }, 500);
  }
});

// ========== PASSWORD RESET ROUTES ==========

// Generate and send password reset code
app.post("/make-server-d59960c4/send-reset-code", async (c) => {
  try {
    const { email } = await c.req.json();

    console.log("Password reset request for email:", email);

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    // Check if user exists
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === email);

    if (!authUser) {
      // Don't reveal if user exists or not for security, but don't generate code
      console.log("User not found for email:", email);
      return c.json({ 
        success: true, 
        message: "If an account exists with this email, a reset code has been generated"
      });
    }

    // Generate a random 4-character alphanumeric code
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    console.log("Generated reset code:", code);

    // Store the code in KV store with 15-minute expiry
    const resetKey = `password_reset:${email}`;
    const resetData = {
      code,
      email,
      userId: authUser.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
    };

    await kv.set(resetKey, resetData);
    console.log("Reset code stored in KV for:", email);

    // Log the code to server console (visible in Supabase Edge Function logs)
    console.log(`✅ Password reset code for ${email}: ${code}`);
    
    // Return the code directly (no email sending)
    // In a production environment with email configured, you would:
    // 1. Set up SMTP settings in Supabase Auth
    // 2. Send the code via email instead of returning it
    // 3. Remove the devCode from the response
    return c.json({ 
      success: true, 
      message: "Reset code generated",
      devCode: code // Return code directly since we're not sending emails
    });
  } catch (error) {
    console.error("Send reset code error:", error);
    console.error("Error stack:", error.stack);
    return c.json({ error: `Failed to send reset code: ${error.message}` }, 500);
  }
});

// Verify reset code and update password
app.post("/make-server-d59960c4/verify-reset-code", async (c) => {
  try {
    const { email, code, newPassword } = await c.req.json();

    if (!email || !code || !newPassword) {
      return c.json({ error: "Email, code, and new password are required" }, 400);
    }

    // Retrieve the stored code
    const resetKey = `password_reset:${email}`;
    const resetData = await kv.get(resetKey);

    if (!resetData) {
      return c.json({ error: "Invalid or expired code" }, 400);
    }

    // Check if code matches
    if (resetData.code !== code.toUpperCase()) {
      return c.json({ error: "Invalid code" }, 400);
    }

    // Check if code is expired
    const expiresAt = new Date(resetData.expiresAt);
    if (expiresAt < new Date()) {
      await kv.del(resetKey);
      return c.json({ error: "Code has expired" }, 400);
    }

    // Get user from auth
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === email);

    if (!authUser) {
      return c.json({ error: "User not found" }, 404);
    }

    // Update the password using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password: newPassword }
    );

    if (error) {
      console.error("Password update error:", error);
      return c.json({ error: "Failed to update password" }, 500);
    }

    // Delete the used code
    await kv.del(resetKey);

    return c.json({ 
      success: true, 
      message: "Password updated successfully" 
    });
  } catch (error) {
    console.error("Verify reset code error:", error);
    return c.json({ error: "Failed to verify code" }, 500);
  }
});

Deno.serve(app.fetch);