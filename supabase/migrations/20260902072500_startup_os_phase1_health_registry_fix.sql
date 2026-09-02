-- Phase 1 tables use startup_* and company_intelligence_* families.
-- Correct the reconciliation registry so backend health checks do not report a false schema failure.

update public.startup_os_backend_modules
set table_prefixes = array[
      'startup_idea_',
      'startup_market_',
      'startup_competitors',
      'startup_customer_',
      'startup_validation_',
      'startup_survey_',
      'startup_brand_',
      'startup_health_',
      'company_intelligence_'
    ],
    notes = 'Evidence-labelled validation, research, customer discovery and company intelligence. Phase 1 uses startup_* and company_intelligence_* table families.',
    updated_at = now()
where phase = 1;
