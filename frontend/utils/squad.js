// Shared helper to adjust points for a team in Supabase squads table.
// Fallback manual fetch-patch logic is supplied in case the Supabase RPC function is unavailable.
export async function adjustSquadPoints(supabaseUrl, supabaseKey, team, pointsDelta) {
  try {
    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/increment_squad_points`;
    const rpcRes = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        squad_name: team,
        points_to_add: pointsDelta,
      }),
    });

    if (rpcRes.ok) {
      return true;
    }

    const getUrl = `${supabaseUrl}/rest/v1/squads?select=points&name=eq.${encodeURIComponent(team)}`;
    const getRes = await fetch(getUrl, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!getRes.ok) {
      throw new Error(`Failed to fetch squad points: ${await getRes.text()}`);
    }

    const rows = await getRes.json();
    if (!rows || rows.length === 0) {
      throw new Error(`Squad not found: ${team}`);
    }

    const currentPoints = rows[0].points || 0;
    const newPoints = Math.max(currentPoints + pointsDelta, 0);

    const patchUrl = `${supabaseUrl}/rest/v1/squads?name=eq.${encodeURIComponent(team)}`;
    const patchRes = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ points: newPoints }),
    });

    if (!patchRes.ok) {
      throw new Error(`Failed to update squad points: ${await patchRes.text()}`);
    }

    return true;
  } catch (error) {
    console.error(`Failed to adjust squad points for ${team}:`, error);
    return false;
  }
}
