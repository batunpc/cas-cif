-- Deploy cif:computed_columns/project_revision_form_changes_for to pg
-- requires: tables/form_change
-- requires: tables/project_revision

begin;

create or replace function cif.project_revision_form_changes_for(cif.project_revision, form_data_table_name text, json_matcher text default '{}')
returns setof cif.form_change
as
$computed_column$

  select *
    from cif.form_change
    where project_revision_id = $1.id
      and form_data_schema_name='cif'
      and form_data_table_name=$2
      and new_form_data::jsonb @> $3::jsonb;

$computed_column$ language sql stable;

grant execute on function cif.project_revision_form_changes_for to cif_internal, cif_external, cif_admin;

comment on function cif.project_revision_project_quarterly_report_form_changes is 'Computed column to dynamically retrieve the form_change records relating to the project_revision from a given table';

commit;