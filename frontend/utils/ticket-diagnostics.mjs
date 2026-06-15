/**
 * Enhanced Ticket Generation with Better Error Handling & Debugging
 * 
 * This module wraps the standard ticket generation with:
 * - Detailed error logging
 * - Performance monitoring
 * - Fallback options
 * - Validation checks
 * 
 * Usage:
 * import { generateTicketWithDiagnostics } from "@/utils/ticket-diagnostics"
 * const { png, diagnostics } = await generateTicketWithDiagnostics(player);
 */

import { createCanvas, loadImage } from "@napi-rs/canvas";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Detailed diagnostics object returned with ticket
 */
export class TicketDiagnostics {
  constructor() {
    this.startTime = Date.now();
    this.steps = [];
    this.errors = [];
    this.warnings = [];
    this.environment = {
      platform: process.platform,
      nodeVersion: process.version,
      cwd: process.cwd(),
      env: process.env.NODE_ENV || "unknown"
    };
  }

  addStep(name, duration = 0) {
    this.steps.push({ name, duration, timestamp: Date.now() });
    console.log(`[Ticket] ✓ ${name} (${duration}ms)`);
  }

  addError(message) {
    this.errors.push(message);
    console.error(`[Ticket] ✗ ERROR: ${message}`);
  }

  addWarning(message) {
    this.warnings.push(message);
    console.warn(`[Ticket] ⚠ WARNING: ${message}`);
  }

  getReport() {
    return {
      success: this.errors.length === 0,
      totalTime: Date.now() - this.startTime,
      steps: this.steps,
      errors: this.errors,
      warnings: this.warnings,
      environment: this.environment
    };
  }

  logReport() {
    const report = this.getReport();
    console.log("\n" + "═".repeat(60));
    console.log("TICKET GENERATION DIAGNOSTICS");
    console.log("═".repeat(60));
    console.log(`Success: ${report.success ? "✓" : "✗"}`);
    console.log(`Total Time: ${report.totalTime}ms`);
    console.log(`Platform: ${report.environment.platform}`);
    console.log(`Environment: ${report.environment.env}`);
    
    if (report.steps.length > 0) {
      console.log("\nSteps:");
      report.steps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step.name} (${step.duration}ms)`);
      });
    }
    
    if (report.warnings.length > 0) {
      console.log("\nWarnings:");
      report.warnings.forEach(w => console.log(`  ⚠ ${w}`));
    }
    
    if (report.errors.length > 0) {
      console.log("\nErrors:");
      report.errors.forEach(e => console.log(`  ✗ ${e}`));
    }
    console.log("═".repeat(60) + "\n");
    
    return report;
  }
}

/**
 * Generate ticket with comprehensive diagnostics
 * Returns: { png: Buffer, diagnostics: TicketDiagnostics }
 */
export async function generateTicketWithDiagnostics(player) {
  const diag = new TicketDiagnostics();
  let stepStart = Date.now();

  try {
    // Validate input
    const { name, user_id, created_at } = player;
    if (!name || !user_id) {
      throw new Error("Missing required player data: name and user_id");
    }
    diag.addStep("Input validation", Date.now() - stepStart);

    // Format date
    stepStart = Date.now();
    const dateObj = created_at ? new Date(created_at) : new Date();
    const issuedOn = dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    diag.addStep("Date formatting", Date.now() - stepStart);

    // Verify file exists
    stepStart = Date.now();
    const ticketPath = path.join(process.cwd(), "public", "ticket.png");
    if (!fs.existsSync(ticketPath)) {
      throw new Error(`ticket.png not found at ${ticketPath}`);
    }
    diag.addStep("File verification", Date.now() - stepStart);

    // Load image
    stepStart = Date.now();
    let baseImage;
    try {
      baseImage = await loadImage(ticketPath);
    } catch (err) {
      throw new Error(`Failed to load image: ${err.message}`);
    }
    const imageLoadTime = Date.now() - stepStart;
    diag.addStep(`Image loading (${baseImage.width}x${baseImage.height})`, imageLoadTime);

    // Create canvas
    stepStart = Date.now();
    let canvas;
    try {
      canvas = createCanvas(baseImage.width, baseImage.height);
    } catch (err) {
      throw new Error(`Failed to create canvas: ${err.message}`);
    }
    diag.addStep("Canvas creation", Date.now() - stepStart);

    // Draw image
    stepStart = Date.now();
    const ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height);
    diag.addStep("Base image rendering", Date.now() - stepStart);

    // Draw text
    stepStart = Date.now();
    const displayUserId = user_id.startsWith("@") ? user_id : `@${user_id}`;

    // Player name
    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "#2A1E17";
    ctx.textAlign = "left";
    ctx.fillText(name, 510, 582);

    // User ID
    ctx.font = "bold 38px Arial";
    ctx.fillStyle = "#E53935";
    ctx.fillText(displayUserId, 470, 742);

    // Date
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#2A1E17";
    ctx.fillText(issuedOn, 430, 898);

    diag.addStep("Text rendering", Date.now() - stepStart);

    // Encode PNG
    stepStart = Date.now();
    let pngBuffer;
    try {
      pngBuffer = await canvas.encode("png");
    } catch (err) {
      throw new Error(`Failed to encode PNG: ${err.message}`);
    }
    const encodeTime = Date.now() - stepStart;
    diag.addStep(`PNG encoding (${pngBuffer.length} bytes)`, encodeTime);

    return { png: pngBuffer, diagnostics: diag };

  } catch (error) {
    diag.addError(error.message);
    diag.logReport();
    throw error;
  }
}

/**
 * Simple wrapper for existing code - drop-in replacement
 */
export async function generateTicketPngWithLogging(player) {
  const { png } = await generateTicketWithDiagnostics(player);
  return png;
}

/**
 * CLI usage: Generate a test ticket with full diagnostics
 * Usage: node -r @/utils/ticket-diagnostics.mjs
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    console.log("Testing Ticket Generation with Diagnostics\n");

    try {
      const { png, diagnostics } = await generateTicketWithDiagnostics({
        name: "Diagnostic Test User",
        user_id: "diag_test_001",
        created_at: new Date().toISOString()
      });

      diagnostics.logReport();

      // Save test output
      const outputPath = path.join(process.cwd(), "public", "ticket-diagnostic-test.png");
      fs.writeFileSync(outputPath, png);
      console.log(`✅ Test ticket saved to: ${outputPath}\n`);

    } catch (error) {
      console.error("❌ Test failed:", error.message);
      process.exit(1);
    }
  })();
}
