revoke execute on function public.creator_media_analytics() from public, anon;
grant execute on function public.creator_media_analytics() to authenticated;

revoke execute on function public.toggle_creator_follow(uuid) from public, anon;
grant execute on function public.toggle_creator_follow(uuid) to authenticated;

revoke execute on function public.toggle_investor_watchlist(uuid, uuid) from public, anon;
grant execute on function public.toggle_investor_watchlist(uuid, uuid) to authenticated;

comment on function public.ranked_media_feed(text[], integer) is
  'Intentional anonymous read-only ranked feed over published/safe media. SECURITY DEFINER is required to aggregate private recommendation signals without exposing them.';
comment on function public.ranked_media_feed_v2(text[], integer) is
  'Intentional anonymous read-only ranked feed over published/safe media. SECURITY DEFINER is required to aggregate private recommendation signals without exposing them.';
