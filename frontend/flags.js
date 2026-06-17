import { flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";

export const underMaintenanceFlag = flag({
  key: "UnderMaintainence",
  defaultValue: { under_maintainence: false },
  adapter: vercelAdapter(),
});
