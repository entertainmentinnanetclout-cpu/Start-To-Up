alter table public.website_studio_templates add column if not exists structural_family text not null default 'business';
alter table public.website_studio_templates add column if not exists section_schema jsonb not null default '[]'::jsonb;

update public.website_studio_templates
set structural_family = case
  when key in ('pulse-saas','orbit-ai','block-ledger') then 'saas'
  when key = 'neon-foundry' then 'developer'
  when key in ('studio-north','boldfolio','homecraft') then 'portfolio'
  when key in ('counsel-prime','ledger-house') then 'professional'
  when key = 'habitat-property' then 'property'
  when key in ('campus-living','reskonnect-premium') then 'accommodation'
  when key = 'table-flame' then 'restaurant'
  when key in ('freshcart','atelier-mode','autodrive') then 'commerce'
  when key in ('medica-clinic','glow-beauty','sportforge') then 'healthcare'
  when key in ('edulaunch','tiny-futures') then 'education'
  when key in ('eventspark','summit-travel') then 'events'
  when key in ('secureline','vertex-build') then 'industrial'
  when key in ('civic-impact','newsroom-pro') then 'institution'
  else 'business' end,
section_schema = case
  when key in ('pulse-saas','orbit-ai','block-ledger') then '["product_hero","product_metrics","feature_matrix","integrations","use_cases","pricing","conversion_cta"]'::jsonb
  when key = 'neon-foundry' then '["terminal_hero","code_example","api_capabilities","sdk_grid","architecture","docs_cta"]'::jsonb
  when key in ('studio-north','boldfolio','homecraft') then '["editorial_hero","portfolio_grid","case_studies","capabilities","client_proof","creative_cta"]'::jsonb
  when key in ('counsel-prime','ledger-house') then '["authority_hero","practice_areas","industries","credentials","process","consultation_cta"]'::jsonb
  when key = 'habitat-property' then '["property_search_hero","listing_grid","amenities","developments","agents","enquiry_cta"]'::jsonb
  when key in ('campus-living','reskonnect-premium') then '["campus_hero","residence_grid","room_types","amenities","availability","application_flow"]'::jsonb
  when key = 'table-flame' then '["hospitality_hero","menu_categories","featured_dishes","story","reservation_flow","order_cta"]'::jsonb
  when key in ('freshcart','atelier-mode','autodrive') then '["commerce_hero","collections","product_grid","promo_strip","trust_benefits","shop_cta"]'::jsonb
  when key in ('medica-clinic','glow-beauty','sportforge') then '["care_hero","services","practitioners","booking_flow","proof","contact_cta"]'::jsonb
  when key in ('edulaunch','tiny-futures') then '["education_hero","program_grid","outcomes","admissions","student_proof","apply_cta"]'::jsonb
  when key in ('eventspark','summit-travel') then '["experience_hero","event_trip_grid","schedule_itinerary","partners","gallery","booking_cta"]'::jsonb
  when key in ('secureline','vertex-build') then '["capability_hero","capability_grid","project_grid","compliance","process","quote_cta"]'::jsonb
  when key in ('civic-impact','newsroom-pro') then '["mission_news_hero","program_story_grid","impact_metrics","newsroom","resources","public_cta"]'::jsonb
  else '["hero","services","proof","process","contact"]'::jsonb end;

create index if not exists website_studio_templates_structural_family_idx
  on public.website_studio_templates(structural_family)
  where is_active = true;
