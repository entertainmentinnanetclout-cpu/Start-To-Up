revoke execute on function public.can_access_website_studio() from public;
revoke execute on function public.is_website_studio_admin() from public;
grant execute on function public.can_access_website_studio() to authenticated;
grant execute on function public.is_website_studio_admin() to authenticated;
