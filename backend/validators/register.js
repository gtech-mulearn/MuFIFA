const { z } = require("zod");

// Input validation schema for registration request payloads.
const RegisterSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Please enter a valid email address"),
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .regex(/^(?:\+91|91|0)?[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
  domain: z.enum(["Maker", "Creative", "Coder", "Strategist"], {
    errorMap: () => ({ message: "Invalid domain selected. Must be Maker, Creative, Coder, or Strategist." }),
  }),
  team: z.enum(
    [
      "Brazil",
      "Argentina",
      "Portugal",
      "Germany",
      "France",
      "England",
      "Spain",
      "Netherlands",
      "Belgium",
      "Croatia",
      "Uruguay",
      "Japan",
    ],
    {
      errorMap: () => ({ message: "Invalid team selected. Must be a valid FIFA country team." }),
    }
  ),
});

module.exports = {
  RegisterSchema,
};
