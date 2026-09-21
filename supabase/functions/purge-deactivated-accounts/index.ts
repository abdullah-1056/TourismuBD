import { withSupabase } from "npm:@supabase/server@^1";

export default {
  fetch: withSupabase({ auth: "secret" }, async (_request, ctx) => {
    const cutoff = new Date();
    cutoff.setUTCMonth(cutoff.getUTCMonth() - 3);
    const { data: accounts, error } = await ctx.supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("status", "DEACTIVATED")
      .lte("deactivated_at", cutoff.toISOString())
      .order("deactivated_at", { ascending: true })
      .limit(1000);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    let deleted = 0;
    for (const { id } of accounts) {
      const { data: ready, error: purgeError } = await ctx.supabaseAdmin.rpc("purge_deactivated_account", { target_user_id: id });
      if (purgeError) return Response.json({ error: purgeError.message, deleted }, { status: 500 });
      if (!ready) continue;
      const { error: deleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(id);
      if (deleteError) return Response.json({ error: deleteError.message, deleted }, { status: 500 });
      deleted += 1;
    }
    return Response.json({ deleted });
  }),
};
