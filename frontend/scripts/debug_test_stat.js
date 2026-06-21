const supabaseUrl = "https://ncqnqrxchgthpauhtnce.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcW5xcnhjaGd0aHBhdWh0bmNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTQxMzg1MywiZXhwIjoyMDk2OTg5ODUzfQ.RxMAMVuuiJ0tQnAyc5bQK1ib583i3xkN5wSS61Qb7j0";

async function main() {
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  // 1. Fetch Registrations
  const regRes = await fetch(`${supabaseUrl}/rest/v1/registrations?select=id,user_id,name,team&limit=5000`, { headers });
  const registrations = await regRes.json();

  // Fetch completions
  const compRes = await fetch(`${supabaseUrl}/rest/v1/user_completed_tasks?task_id=in.(4,100)&select=user_id,task_id,xp_execution`, { headers });
  const completions = await compRes.json();
  
  const userTask4Completed = {};
  const userKuzhiundoSubmissions = {};
  completions.forEach(c => {
    if (c.task_id === 4) {
      userTask4Completed[c.user_id] = true;
    }
    if (c.task_id === 100) {
      userKuzhiundoSubmissions[c.user_id] = Number(c.xp_execution) || 0;
    }
  });

  // 2. Fetch Live Kuzhiundo API
  let kuzhiundoApiReports = {};
  const kuzhiRes = await fetch("https://kuzhiundo.com/api/leaderboard/individuals", { cache: "no-store" });
  if (kuzhiRes.ok) {
    const kuzhiData = await kuzhiRes.json();
    const users = kuzhiData.users || [];
    users.forEach((u) => {
      if (u.id) {
        kuzhiundoApiReports[u.id] = parseInt(u.reports || "0", 10);
      }
    });
    console.log("Kuzhiundo API individuals mapping table:");
    console.log(kuzhiundoApiReports);
  }

  // 3. Test matching for Portugal members
  const portugalMembers = registrations.filter(r => r.team === "Portugal");
  console.log("\nPortugal squad matching diagnostics:");
  portugalMembers.forEach(r => {
    const dbCount = userKuzhiundoSubmissions[r.user_id] !== undefined
      ? userKuzhiundoSubmissions[r.user_id]
      : (userTask4Completed[r.user_id] ? 1 : 0);
    
    const matchedCountDefault = kuzhiundoApiReports[r.id];
    const matchedCountLower = kuzhiundoApiReports[String(r.id).toLowerCase()];
    
    console.log(`- Member: ${r.name} (${r.user_id})`);
    console.log(`  r.id (type: ${typeof r.id}): "${r.id}"`);
    console.log(`  Kuzhiundo submissions (DB completions): ${dbCount}`);
    console.log(`  Matched by r.id (exact): ${matchedCountDefault}`);
    console.log(`  Matched by r.id.toLowerCase(): ${matchedCountLower}`);
  });
}

main().catch(console.error);
