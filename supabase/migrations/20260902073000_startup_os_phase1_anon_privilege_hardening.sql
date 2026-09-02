-- Phase 1 workspace tables are authenticated-only. RLS remains the row boundary;
-- remove inherited anon table privileges to reduce unnecessary attack surface.

do $$
declare t text;
begin
  foreach t in array array[
    'startup_idea_validations',
    'startup_market_models',
    'startup_competitors',
    'startup_customer_personas',
    'startup_customer_interviews',
    'startup_validation_surveys',
    'startup_survey_questions',
    'startup_survey_responses',
    'startup_brand_checks',
    'startup_health_assessments'
  ] loop
    execute format('revoke all on table public.%I from anon', t);
  end loop;
end $$;
