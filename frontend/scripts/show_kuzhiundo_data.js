const supabaseUrl = "https://ncqnqrxchgthpauhtnce.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcW5xcnhjaGd0aHBhdWh0bmNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTQxMzg1MywiZXhwIjoyMDk2OTg5ODUzfQ.RxMAMVuuiJ0tQnAyc5bQK1ib583i3xkN5wSS61Qb7j0";

async function main() {
  console.log("======================================================================");
  console.log("   LIVE KUZHIUNDO & MuFIFA DATA AUDIT");
  console.log("======================================================================\n");

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  // 1. Fetch MuFIFA Linked Users
  console.log("1. Fetching MuFIFA registrations with linked Kuzhiundo IDs...");
  const regRes = await fetch(`${supabaseUrl}/rest/v1/registrations?select=id,user_id,name,team,socials,mu_points`, { headers });
  if (!regRes.ok) {
    console.error("Failed to fetch registrations:", await regRes.text());
    return;
  }
  const registrations = await regRes.json();
  const linkedUsers = registrations.filter(r => {
    if (!r.socials) return false;
    const socialsObj = typeof r.socials === 'string' ? JSON.parse(r.socials) : r.socials;
    return !!socialsObj.kuzhiundo_uuid;
  }).map(r => {
    const socialsObj = typeof r.socials === 'string' ? JSON.parse(r.socials) : r.socials;
    return {
      mu_id: r.id,
      user_id: r.user_id,
      name: r.name,
      team: r.team,
      kuzhi_uuid: socialsObj.kuzhiundo_uuid,
      kuzhi_submissions: socialsObj.kuzhiundo_submissions,
      mu_points: r.mu_points
    };
  });

  console.log(`Found ${linkedUsers.length} linked user(s):`);
  console.table(linkedUsers);

  // 2. Fetch MuFIFA Task Completions (Task 4 & 100)
  console.log("\n2. Fetching MuFIFA Kuzhiundo Task Completions (user_completed_tasks)...");
  const compRes = await fetch(`${supabaseUrl}/rest/v1/user_completed_tasks?task_id=in.(4,100)&select=id,user_id,task_id,points_awarded,xp_execution,completed_at`, { headers });
  if (compRes.ok) {
    const completions = await compRes.json();
    console.log(`Found ${completions.length} task completion row(s) (Task 4 = Base Link, Task 100 = Submissions):`);
    console.table(completions.map(c => ({
      id: c.id,
      user_id: c.user_id,
      task: c.task_id === 4 ? "Task 4 (Base)" : "Task 100 (Submissions)",
      points: c.points_awarded,
      xp_exec: c.xp_execution,
      completed_at: c.completed_at
    })));
  } else {
    console.error("Failed to fetch completions:", await compRes.text());
  }

  // 3. Fetch live Kuzhiundo API Individuals Leaderboard
  console.log("\n3. Fetching Live Kuzhiundo API Individuals Leaderboard...");
  try {
    const indRes = await fetch("https://kuzhiundo.com/api/leaderboard/individuals", { cache: "no-store" });
    if (indRes.ok) {
      const indJson = await indRes.json();
      const users = (indJson.users || []).slice(0, 10); // Show top 10
      console.log(`Top ${users.length} Mappers on Kuzhiundo API:`);
      console.table(users.map(u => ({
        rank: u.rank,
        name: u.name,
        user_id: u.user_id,
        team: u.team,
        reports: u.reports,
        mu_uuid: u.id
      })));
    } else {
      console.error("Failed to fetch Kuzhiundo individuals:", indRes.statusText);
    }
  } catch (err) {
    console.error("Error fetching Kuzhiundo individuals:", err.message);
  }

  // 4. Fetch live Kuzhiundo API Teams Leaderboard
  console.log("\n4. Fetching Live Kuzhiundo API Teams Leaderboard...");
  try {
    const teamRes = await fetch("https://kuzhiundo.com/api/leaderboard/teams", { cache: "no-store" });
    if (teamRes.ok) {
      const teamJson = await teamRes.json();
      const teams = (teamJson.teams || []);
      console.log("Kuzhiundo API Squad Standings:");
      console.table(teams.map(t => ({
        rank: t.rank,
        team: t.team,
        mappers: t.mappers,
        reports: t.reports
      })));
    } else {
      console.error("Failed to fetch Kuzhiundo teams:", teamRes.statusText);
    }
  } catch (err) {
    console.error("Error fetching Kuzhiundo teams:", err.message);
  }

  console.log("\n======================================================================");
}

main().catch(console.error);
