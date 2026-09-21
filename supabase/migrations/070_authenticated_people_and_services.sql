-- Discover and place content remains public. Member profiles and local services
-- require an authenticated TourismuBD account.
revoke select on public.public_people from anon;
revoke execute on function private.list_public_people() from anon;
revoke execute on function private.list_public_people_with_followers() from anon;

revoke select on public.public_provider_details from anon;
revoke execute on function private.list_public_provider_details() from anon;

revoke select on public.public_provider_profiles, public.public_reviews from anon;
revoke execute on function private.list_public_provider_profiles() from anon;
revoke execute on function private.list_public_reviews() from anon;

revoke select on public.guide_profiles, public.guide_places from anon;
revoke select on public.houseboat_listings, public.houseboat_places from anon;
revoke select on public.small_boat_listings, public.small_boat_places from anon;

grant select on public.public_people, public.public_provider_details to authenticated;
grant select on public.public_provider_profiles, public.public_reviews to authenticated;
grant execute on function private.list_public_people_with_followers() to authenticated;
grant execute on function private.list_public_provider_details() to authenticated;
grant execute on function private.list_public_provider_profiles() to authenticated;
grant execute on function private.list_public_reviews() to authenticated;
