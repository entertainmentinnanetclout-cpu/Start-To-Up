drop policy "public guest intake" on public.guest_action_submissions;
revoke insert on public.guest_action_submissions from anon, authenticated;

-- CAPTCHA-verified Edge Function inserts with the service role. Browser roles
-- retain no direct write path, preventing CAPTCHA bypass through the Data API.

notify pgrst,'reload schema';
