const supabaseUrl = "https://ncqnqrxchgthpauhtnce.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcW5xcnhjaGd0aHBhdWh0bmNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTQxMzg1MywiZXhwIjoyMDk2OTg5ODUzfQ.RxMAMVuuiJ0tQnAyc5bQK1ib583i3xkN5wSS61Qb7j0";

async function main() {
  console.log("Seeding task 100 in Supabase...");
  const res = await fetch(`${supabaseUrl}/rest/v1/tasks?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id: 100,
      title: "Kuzhiundo Pothole Report",
      description: "Awarded for each verified pothole submission on kuzhiundo.com",
      short_desc: "Pothole mapping submission",
      mupoint: 1,
      xp_creativity: 0,
      xp_branding: 0,
      xp_innovation: 0,
      xp_teamwork: 0,
      xp_execution: 1,
      tier: 0,
      action_label: "Map Potholes",
      action_url: "https://kuzhiundo.com",
      guidelines: "",
    }),
  });

  if (!res.ok) {
    console.error("Failed to seed task:", await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log("Task 100 successfully seeded:", data);
}

main().catch(console.error);
