-- Remove anonymous execution from workspace-scoped SECURITY DEFINER RPCs.
-- These RPCs are intended for authenticated workspace members only.

revoke execute on function public.can_manage_website_studio_project(uuid) from public, anon;
revoke execute on function public.can_view_website_studio_project(uuid) from public, anon;
revoke execute on function public.ecosystem_create_handoff(uuid,uuid,text) from public, anon;
revoke execute on function public.finance_scenario_summary(uuid,uuid) from public, anon;
revoke execute on function public.funding_readiness_summary(uuid) from public, anon;
revoke execute on function public.intelligence_approve_change_set(uuid) from public, anon;
revoke execute on function public.intelligence_next_best_actions(uuid) from public, anon;
revoke execute on function public.legal_compliance_summary(uuid) from public, anon;
revoke execute on function public.legal_weighted_readiness(text,uuid) from public, anon;

grant execute on function public.can_manage_website_studio_project(uuid) to authenticated;
grant execute on function public.can_view_website_studio_project(uuid) to authenticated;
grant execute on function public.ecosystem_create_handoff(uuid,uuid,text) to authenticated;
grant execute on function public.finance_scenario_summary(uuid,uuid) to authenticated;
grant execute on function public.funding_readiness_summary(uuid) to authenticated;
grant execute on function public.intelligence_approve_change_set(uuid) to authenticated;
grant execute on function public.intelligence_next_best_actions(uuid) to authenticated;
grant execute on function public.legal_compliance_summary(uuid) to authenticated;
grant execute on function public.legal_weighted_readiness(text,uuid) to authenticated;

-- Trigger helpers should not inherit a role-mutable search path.
alter function public.ops_touch_updated_at() set search_path = '';
