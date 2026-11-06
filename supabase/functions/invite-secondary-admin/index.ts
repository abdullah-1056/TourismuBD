import { createClient } from "npm:@supabase/supabase-js@2";

const ADMIN_ROLES = new Set([
  "users_admin",
  "business_admin",
  "provider_admin",
  "subscription_admin",
  "booking_admin",
  "media_admin",
]);

function corsHeaders(request: Request) {
  return {
    "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

function adminInviteRedirectUrl() {
  const configured = Deno.env.get("ADMIN_INVITE_REDIRECT_URL");
  if (!configured) return undefined;
  try {
    const target = new URL(configured);
    target.searchParams.set("admin-invite", "1");
    return target.toString();
  } catch { return undefined; }
}

Deno.serve(async (request) => {
  const headers = corsHeaders(request);
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers });

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("authorization");
  if (!url || !anonKey || !serviceRoleKey || !authorization) {
    return Response.json({ error: "Admin invitation service is not configured." }, { status: 503, headers });
  }

  let body: { action?: unknown; adminAccountId?: unknown; email?: unknown; password?: unknown; role?: unknown; active?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid invitation data." }, { status: 400, headers }); }
  const action = body.action === "remove" ? "remove" : "create";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = typeof body.role === "string" ? body.role : "";
  const active = body.active !== false;

  const requester = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: requesterData, error: requesterError } = await requester.auth.getUser();
  if (requesterError || !requesterData.user) return Response.json({ error: "Sign in as a Super Admin first." }, { status: 401, headers });
  const { data: access, error: accessError } = await requester.rpc("current_admin_access");
  if (accessError || access?.[0]?.role !== "super_admin") {
    return Response.json({ error: "Only an active Super Admin can manage Secondary Admin accounts." }, { status: 403, headers });
  }

  const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  if (action === "remove") {
    const adminAccountId = typeof body.adminAccountId === "string" ? body.adminAccountId : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(adminAccountId)) {
      return Response.json({ error: "A valid Secondary Admin account is required." }, { status: 400, headers });
    }
    const { data: account, error: accountError } = await admin
      .from("admin_accounts")
      .select("id,user_id")
      .eq("id", adminAccountId)
      .maybeSingle();
    if (accountError) return Response.json({ error: accountError.message }, { status: 502, headers });
    if (!account) return Response.json({ error: "Secondary Admin account not found." }, { status: 404, headers });

    if (account.user_id) {
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("id,email,role,is_admin_only")
        .eq("id", account.user_id)
        .maybeSingle();
      if (profileError) return Response.json({ error: profileError.message }, { status: 502, headers });
      if (profile?.role === "SUPER_ADMIN" || profile?.email?.toLowerCase() === "mdabdullah200211@gmail.com") {
        return Response.json({ error: "The Super Admin account cannot be deleted." }, { status: 403, headers });
      }

      // Pre-clean child records that may have restrictive foreign keys
      await admin.from("reports").delete().eq("created_by", account.user_id);
      await admin.from("reviews").delete().eq("traveler_id", account.user_id);
      await admin.from("bookings").delete().eq("traveler_id", account.user_id);
      await admin.from("admin_accounts").delete().eq("id", adminAccountId);

      const { error: deleteError } = await admin.auth.admin.deleteUser(account.user_id);
      if (deleteError && deleteError.status !== 404) return Response.json({ error: deleteError.message }, { status: 502, headers });
      return Response.json({ deleted: "auth_identity" }, { headers });
    }

    const { error: removeError } = await admin.rpc("remove_secondary_admin", { admin_account_id: adminAccountId });
    if (removeError) return Response.json({ error: removeError.message }, { status: 502, headers });
    return Response.json({ deleted: "admin_access" }, { headers });
  }

  if (action === "delete_user") {
    const userId = typeof body.userId === "string" ? body.userId : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      return Response.json({ error: "A valid user ID is required." }, { status: 400, headers });
    }
    const { data: profile } = await admin
      .from("profiles")
      .select("id,email,role")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.role === "SUPER_ADMIN" || profile?.email?.toLowerCase() === "mdabdullah200211@gmail.com") {
      return Response.json({ error: "The Super Admin account cannot be deleted." }, { status: 403, headers });
    }

    // Pre-clean child records that may have restrictive foreign keys
    await admin.from("reports").delete().eq("created_by", userId);
    await admin.from("reviews").delete().eq("traveler_id", userId);
    await admin.from("bookings").delete().eq("traveler_id", userId);

    const { data: providerRows } = await admin.from("providers").select("id").eq("user_id", userId);
    if (providerRows?.length) {
      for (const prov of providerRows) {
        await admin.from("bookings").delete().eq("provider_id", prov.id);
      }
    }

    const { data: bizRows } = await admin.from("businesses").select("id").eq("user_id", userId);
    if (bizRows?.length) {
      for (const biz of bizRows) {
        await admin.from("business_products").delete().eq("business_id", biz.id);
      }
    }

    await admin.from("admin_accounts").delete().eq("user_id", userId);

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      if (deleteError.status === 404 || deleteError.message?.includes("User not found")) {
        await admin.from("profiles").delete().eq("id", userId);
        return Response.json({ success: true, deleted: "profile_only" }, { headers });
      }
      return Response.json({ error: deleteError.message }, { status: 502, headers });
    }
    return Response.json({ success: true, deleted: "auth_identity" }, { headers });
  }

  if (!/^\S+@\S+\.\S+$/.test(email) || !ADMIN_ROLES.has(role)) {
    return Response.json({ error: "Provide a valid email and Admin role." }, { status: 400, headers });
  }
  if (password && password.length < 12) {
    return Response.json({ error: "Use a temporary password with at least 12 characters." }, { status: 400, headers });
  }

  let hadPendingReservation = false;
  let existingAdminOnlyUserId: string | null = null;
  if (password) {
    const { data: existingProfile, error: profileLookupError } = await admin
      .from("profiles")
      .select("id,is_admin_only")
      .ilike("email", email)
      .limit(1);
    if (profileLookupError) return Response.json({ error: profileLookupError.message }, { status: 502, headers });
    const { data: existingAccount, error: accountLookupError } = await admin
      .from("admin_accounts")
      .select("id,user_id")
      .ilike("email", email)
      .limit(1);
    if (accountLookupError) return Response.json({ error: accountLookupError.message }, { status: 502, headers });
    hadPendingReservation = Boolean(existingAccount?.length);
    if (existingProfile?.length) {
      const profile = existingProfile[0];
      if (!existingAccount?.length || !profile.is_admin_only) {
        return Response.json({ error: "This email belongs to a public TourismuBD account. Its password cannot be changed from Admin Management." }, { status: 409, headers });
      }
      existingAdminOnlyUserId = profile.id;
    }
  }
  const { data: accountId, error: assignmentError } = await admin.rpc("assign_secondary_admin", {
    admin_email: email,
    admin_role: role,
    active,
  });
  if (assignmentError) return Response.json({ error: assignmentError.message }, { status: 400, headers });

  const markInvitationSent = async () => {
    const { error } = await admin.rpc("mark_secondary_admin_invitation_sent", {
      admin_account_id: accountId,
    });
    if (error) console.error("Could not record Secondary Admin invitation", error.message);
  };

  if (password) {
    const { error: credentialError } = existingAdminOnlyUserId
      ? await admin.auth.admin.updateUserById(existingAdminOnlyUserId, { password, email_confirm: true })
      : await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { admin_invitation: true },
      });
    if (credentialError) {
      if (!hadPendingReservation) await admin.rpc("remove_secondary_admin", { admin_account_id: accountId });
      const message = /already (been )?(registered|exists)/i.test(credentialError.message)
        ? "This email already has a login. Use a different email for a new Secondary Admin login."
        : credentialError.message;
      return Response.json({ error: message }, { status: 409, headers });
    }
    await markInvitationSent();
    return Response.json({ accountId, credentials: "created" }, { headers });
  }

  const redirectTo = adminInviteRedirectUrl();
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { admin_invitation: true },
    ...(redirectTo ? { redirectTo } : {}),
  });
  if (inviteError) {
    if (/already (been )?(registered|exists)/i.test(inviteError.message)) {
      return Response.json({ accountId, invitation: "existing" }, { headers });
    }
    const { data: generated, error: generatedError } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: { admin_invitation: true },
        ...(redirectTo ? { redirectTo } : {}),
      },
    });
    const manualInviteUrl = generated?.properties?.action_link;
    if (!generatedError && manualInviteUrl) {
      await markInvitationSent();
      return Response.json({ accountId, invitation: "manual", manualInviteUrl }, { headers });
    }
    return Response.json({ error: `Admin permission was saved, but the invitation email could not be sent: ${inviteError.message}` }, { status: 502, headers });
  }

  await markInvitationSent();
  return Response.json({ accountId, invitation: "sent" }, { headers });
});
