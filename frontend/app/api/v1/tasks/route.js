import { NextResponse } from "next/server";
import { verifyToken, requireRole } from "@/utils/auth";

const PLAYER_COOKIE = "player_token";

// In-memory cache for static tasks list
let cachedTasks = null;
let cacheExpiry = 0;
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    // 1. Authenticate user (optional for GET, but let's check for completions)
    let userId = null;
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`));
    if (cookieMatch) {
      const decoded = verifyToken(cookieMatch[1]);
      if (decoded && decoded.role === "player") {
        userId = decoded.user_id;
      }
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page") || "1";
    const categoryParam = searchParams.get("category") || "All";
    const flatParam = searchParams.get("flat") === "true";
    const previewParam = searchParams.get("preview") === "true";

    if (previewParam) {
      const auth = requireRole(request, "admin", "superadmin", "iglead", "viewer");
      if (auth.error) {
        return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
      }
    }

    // Fetch all tasks from Supabase (or use in-memory cache) to filter and paginate programmatically
    let tasks = null;
    const now = Date.now();
    if (cachedTasks && now < cacheExpiry) {
      tasks = cachedTasks;
    } else {
      const url = `${supabaseUrl}/rest/v1/tasks?select=*&order=id.asc`;
      const headers = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      };

      const tasksRes = await fetch(url, {
        headers,
        next: { revalidate: 0 },
      });

      if (!tasksRes.ok) {
        throw new Error(`Failed to fetch tasks: ${await tasksRes.text()}`);
      }
      tasks = await tasksRes.json();
      cachedTasks = tasks;
      cacheExpiry = now + CACHE_DURATION;
    }

    // 3. Fetch user completions if logged in
    let completionsMap = {};
    let overallCompletedPoints = 0;
    if (userId) {
      const compRes = await fetch(`${supabaseUrl}/rest/v1/user_completed_tasks?user_id=eq.${encodeURIComponent(userId)}&select=*`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        next: { revalidate: 0 },
      });
      if (compRes.ok) {
        const completions = await compRes.json();
        completions.forEach((c) => {
          completionsMap[c.task_id] = c;
          overallCompletedPoints += (c.points_awarded || 0);
        });
      }
    }

    // 4. Map completions to tasks
    let visibleTasks = tasks.filter((t) => t.id !== 100);
    if (!previewParam) {
      visibleTasks = visibleTasks.filter((t) => t.visibility === "public");
    }

    const processedTasks = visibleTasks.map((t) => {
      const completion = completionsMap[t.id];
      const completed = !!completion;

      return {
        ...t,
        completed,
        completed_at: completion ? completion.completed_at : null,
        points_awarded: completion ? completion.points_awarded : 0,
        xp_earned: completion
          ? {
              creativity: completion.xp_creativity,
              branding: completion.xp_branding,
              innovation: completion.xp_innovation,
              teamwork: completion.xp_teamwork,
              execution: completion.xp_execution,
            }
          : null,
      };
    });

    // Separate parents and children
    const parentTasks = processedTasks.filter(t => t.parent_id === null || t.parent_id === undefined);
    const childTasks = processedTasks.filter(t => t.parent_id !== null && t.parent_id !== undefined);

    let finalTasksList;
    let processedParents = [];

    if (flatParam) {
      finalTasksList = processedTasks;
    } else {
      // Map parent tasks completion derived from children (if any) first
      const parentTasksWithCompletions = parentTasks.map(t => {
        const subLevels = childTasks.filter(c => c.parent_id === t.id);
        const parentCompleted = subLevels.length > 0 ? subLevels.every(sl => sl.completed) : t.completed;
        return {
          ...t,
          completed: parentCompleted,
        };
      });

      // Apply global locking barrier to parent tasks and process sub-levels locking
      let firstUncompletedCompulsoryTaskId = null;
      processedParents = parentTasksWithCompletions.map((t) => {
        let isLocked = false;
        // If we found an uncompleted compulsory task, lock any task with a higher ID
        if (firstUncompletedCompulsoryTaskId !== null && t.id > firstUncompletedCompulsoryTaskId) {
          isLocked = true;
        }
        
        // If this task is compulsory and not completed, mark it as the lock barrier for subsequent tasks
        if (t.compulsory && !t.completed && firstUncompletedCompulsoryTaskId === null) {
          firstUncompletedCompulsoryTaskId = t.id;
        }

        // Find children for this parent
        const subLevels = childTasks
          .filter((c) => c.parent_id === t.id)
          .sort((a, b) => a.id - b.id);

        // Compute locking for child sub-levels
        const processedSubLevels = subLevels.map((sl, index) => {
          let childLocked = isLocked; // If parent is locked, child is locked
          if (!childLocked && index > 0) {
            // Locked if previous level in sequence is not completed
            childLocked = !subLevels[index - 1].completed;
          }
          return {
            ...sl,
            isLocked: childLocked,
          };
        });

        return {
          ...t,
          isLocked,
          sub_levels: processedSubLevels,
        };
      });

      finalTasksList = processedParents;
    }

    // Helper to categorize tasks dynamically based on content attributes
    const getTaskCategory = (task) => {
      const title = (task.title || "").toLowerCase();
      const desc = (task.short_desc || task.description || "").toLowerCase();
      
      if (title.includes("uiux") || title.includes("ui/ux") || title.includes("ui") || title.includes("ux") || title.includes("design") || desc.includes("design") || desc.includes("ui/ux") || desc.includes("uiux")) return "UIUX";
      if (title.includes("cyber") || title.includes("security") || title.includes("kuzhi") || title.includes("pothole")) return "Cyber";
      if (title.includes("web") || title.includes("website") || title.includes("frontend") || title.includes("backend") || title.includes("nextjs") || title.includes("api") || desc.includes("web")) return "Web";
      if (title.includes("social") || title.includes("discord") || title.includes("referral") || title.includes("invite") || title.includes("git") || title.includes("profile")) return "Social";
      if (title.includes("iot") || title.includes("hardware") || title.includes("sensor")) return "IoT";
      if (title.includes("dsa") || title.includes("leetcode") || title.includes("algorithm") || title.includes("data structure") || title.includes("codeforces") || title.includes("coding")) return "DSA";
      
      return "Other";
    };

    // 5. Filter by category
    let filteredTasks = finalTasksList;
    if (categoryParam !== "All") {
      filteredTasks = finalTasksList.filter(t => {
        if (t.category && typeof t.category === "string") {
          const categories = t.category.split(",").map(c => c.trim().toLowerCase());
          return categories.includes(categoryParam.toLowerCase());
        }
        // Fallback to title/description heuristic if no explicit database category is set
        return getTaskCategory(t) === categoryParam;
      });
    }

    // 6. Paginate
    const totalCount = filteredTasks.length;
    let paginatedTasks = filteredTasks;

    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      const page = parseInt(pageParam, 10);
      const offset = (page - 1) * limit;
      paginatedTasks = filteredTasks.slice(offset, offset + limit);
    }

    const overallTotalTasks = flatParam ? processedTasks.length : processedParents.length;
    const overallCompletedTasks = flatParam ? processedTasks.filter(t => t.completed).length : processedParents.filter(t => t.completed).length;

    const responseData = { 
      success: true, 
      data: paginatedTasks,
      overallStats: {
        totalTasks: overallTotalTasks,
        completedTasks: overallCompletedTasks,
        completedPoints: overallCompletedPoints
      }
    };
    if (limitParam) {
      responseData.pagination = {
        page: parseInt(pageParam, 10),
        limit: parseInt(limitParam, 10),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limitParam, 10)),
      };
    }
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("GET tasks error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 1. Authenticate Admin
    const auth = requireRole(request, "admin", "superadmin", "iglead");
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    const body = await request.json();
    const {
      id,
      title,
      description,
      short_desc,
      guidelines,
      action_label,
      action_url,
      mupoint,
      xp_creativity,
      xp_branding,
      xp_innovation,
      xp_teamwork,
      xp_execution,
      category,
      logo_url,
      compulsory,
      verification,
      parent_id,
      visibility,
    } = body;

    if (!id || !title || !description) {
      return NextResponse.json({ success: false, error: "Task ID, title, and description are required." }, { status: 400 });
    }

    // Insert task into Supabase
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/tasks?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id: parseInt(id, 10),
        title,
        description,
        short_desc: short_desc || description,
        guidelines: guidelines || "",
        action_label: action_label || "View Details",
        action_url: action_url || "#",
        mupoint: parseInt(mupoint || 0, 10),
        xp_creativity: parseInt(xp_creativity || 0, 10),
        xp_branding: parseInt(xp_branding || 0, 10),
        xp_innovation: parseInt(xp_innovation || 0, 10),
        xp_teamwork: parseInt(xp_teamwork || 0, 10),
        xp_execution: parseInt(xp_execution || 0, 10),
        tier: 1,
        category: category ? category.split(",").map(c => c.trim()).filter(Boolean).join(",") : "",
        logo_url: logo_url || null,
        compulsory: compulsory || false,
        verification: verification || "none",
        parent_id: parent_id ? parseInt(parent_id, 10) : null,
        visibility: visibility || "preview",
      }),
    });

    if (!insertRes.ok) {
      throw new Error(`Failed to insert task: ${await insertRes.text()}`);
    }

    const savedTasks = await insertRes.json();
    
    // Invalidate in-memory tasks cache
    cachedTasks = null;
    cacheExpiry = 0;

    return NextResponse.json({ success: true, data: savedTasks[0] });
  } catch (error) {
    console.error("POST task error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
