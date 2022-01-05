-- Deploy cif:tables/project to pg
-- requires: tables/funding_stream

begin;

create table cif.project(
  id integer primary key generated always as identity,
  operator_id integer references cif.operator(id) not null,
  funding_stream_id integer not null references cif.funding_stream(id),
  rfp_number varchar(1000) not null unique,
  summary varchar(10000) not null,
  project_name varchar(1000) not null
);

select cif_private.upsert_timestamp_columns('cif', 'project');

create index cif_project_operator_id on cif.project(operator_id);

do
$grant$
begin

-- Grant cif_internal permissions
perform cif_private.grant_permissions('select', 'project', 'cif_internal');
perform cif_private.grant_permissions('insert', 'project', 'cif_internal');
perform cif_private.grant_permissions('update', 'project', 'cif_internal');

-- Grant cif_admin permissions
perform cif_private.grant_permissions('select', 'project', 'cif_admin');
perform cif_private.grant_permissions('insert', 'project', 'cif_admin');
perform cif_private.grant_permissions('update', 'project', 'cif_admin');

-- Grant cif_external no permissions
-- Grant cif_guest no permissions

end
$grant$;

comment on table cif.project is 'Table containing information about a CIF Project';
comment on column cif.project.id is 'Unique ID for the project';
comment on column cif.project.rfp_number is 'Unique identifier internal to the CIF team, in the form YYYY-RFP-0-000-ABCD. This will most likely be generated by the application in the future.';
comment on column cif.project.operator_id is 'Foreign key references the cif.operator table';
comment on column cif.project.project_name is 'The name of the project';
comment on column cif.project.summary is 'Summary of the project';
comment on column cif.project.funding_stream_id is 'The id of the funding_stream (cif.funding_stream.id) that was selected when creating the project';

commit;
