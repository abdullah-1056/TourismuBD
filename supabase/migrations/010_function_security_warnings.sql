alter function public.set_updated_at() set search_path = public;

revoke execute on function public.protect_verification_review() from public, anon, authenticated;
