const { Hono } = require("hono");
const rateLimiter = require("../middleware/rateLimiter");
const { RegisterSchema } = require("../validators/register");
const supabase = require("../config/supabase");

const router = new Hono();

// Route to handle user registrations with Zod validation, rate-limiting, and Supabase integration.
router.post("/register", rateLimiter, async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Malformed JSON body.",
          details: null,
        },
      }, 400);
    }

    const validationResult = RegisterSchema.safeParse(body);

    // Validate the input parameters and map error messages to their corresponding fields.
    if (!validationResult.success) {
      const fieldErrors = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(err.message);
      });

      return c.json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request parameters failed validation.",
          details: fieldErrors,
        },
      }, 400);
    }

    const { name, email, phone, domain, team } = validationResult.data;

    // Extract the part of the email before the '@' symbol to use as user_id.
    const userId = email.split("@")[0];

    // Connect to Supabase to insert values, or fall back to simulated response if variables are not present.
    if (!supabase || !supabase.from) {
      return c.json({
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message:
            "Database service is uninitialized. Configure SUPABASE_URL and SUPABASE_KEY in environment variables.",
          details: null,
        },
      }, 503);
    }

    const { data, error } = await supabase
      .from("registrations")
      .insert([{ name, email, user_id: userId, phone, domain, team }])
      .select();

    if (error) {
      // Handle database conflict if the email or user ID has already been registered.
      if (
        error.code === "23505" ||
        (error.message &&
          (error.message.includes("unique") ||
            error.message.includes("duplicate")))
      ) {
        return c.json({
          success: false,
          error: {
            code: "CONFLICT_ERROR",
            message:
              "This email address or user ID has already been registered.",
            details: null,
          },
        }, 409);
      }

      throw error;
    }

    return c.json({
      success: true,
      message: "Registration completed successfully.",
      data: data[0],
    }, 201);
  } catch (error) {
    console.error("Server error during registration:", error);
    return c.json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
        details: null,
      },
    }, 500);
  }
});

// Route to fetch and compile aggregated registration statistics for teams and individuals.
router.get("/live-stats", async (c) => {
  try {
    if (!supabase || !supabase.from) {
      return c.json({
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message:
            "Database service is uninitialized. Configure SUPABASE_URL and SUPABASE_KEY in environment variables.",
          details: null,
        },
      }, 503);
    }

    const { data: registrations, error } = await supabase
      .from("registrations")
      .select("user_id, team");

    if (error) {
      throw error;
    }

    const organisation_count = {};
    registrations.forEach((r) => {
      if (r.team) {
        organisation_count[r.team] = (organisation_count[r.team] || 0) + 1;
      }
    });

    const referral_analytics = {};
    registrations.forEach((r) => {
      if (r.user_id) {
        referral_analytics[r.user_id] =
          (referral_analytics[r.user_id] || 0) + 1;
      }
    });

    return c.json({
      success: true,
      response: {
        organisation_count,
        referral_analytics,
      },
    }, 200);
  } catch (error) {
    console.error("Error fetching live stats:", error);
    return c.json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while compiling live stats.",
        details: null,
      },
    }, 500);
  }
});

module.exports = router;
