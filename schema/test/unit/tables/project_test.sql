begin;
select plan(14);

select has_table('cif', 'project', 'table cif.project exists');
select columns_are(
  'cif',
  'project',
  ARRAY[
    'id',
    'project_name',
    'summary',
    'total_funding_request',
    'operator_id',
    'funding_stream_rfp_id',
    'rfp_number',
    'project_status_id',
    'created_at',
    'created_by',
    'updated_at',
    'updated_by',
    'archived_at',
    'archived_by'
  ],
  'columns in cif.project match expected columns'
);

-- Test Setup
truncate cif.project restart identity cascade;
truncate cif.operator restart identity cascade;
insert into cif.operator (legal_name, trade_name, bc_registry_id, operator_code)
values
  ('first operator legal name', 'first operator trade name', 'AB1234567', 'ABCD'),
  ('second operator legal name', 'second operator lorem ipsum dolor sit amet limited', 'BC1234567', 'EFGH'),
  ('third operator legal name', 'third operator trade name', 'EF3456789', 'IJKL');

insert into cif.project(operator_id, funding_stream_rfp_id, project_status_id, rfp_number, summary, project_name)
values
  (1, 1, 1, '000', 'summary', 'project 1'),
  (2, 1, 1, '000', 'summary', 'project 2'),
  (3, 1, 1, '000', 'summary', 'project 3');

select is (
  (select rfp_number from cif.project where id=1),
  '2019-RFP-1-000-ABCD',
  'rfp_number is generated from values in the operator and funding_stream_rfp tables'
);

select throws_like(
  $$
    insert into cif.project(operator_id, funding_stream_rfp_id, project_status_id, rfp_number, summary, project_name)
    values (1, 1, 1, '000', 'summary', 'project 1');
  $$,
  'duplicate key value%',
    'cif.rfp_number must be unique'
);


-- Row level security tests --

-- Test setup
set jwt.claims.sub to '11111111-1111-1111-1111-111111111111';

-- cif_admin
set role cif_admin;
select concat('current user is: ', (select current_user));

select lives_ok(
  $$
    select * from cif.project
  $$,
    'cif_admin can view all data in project table'
);

select lives_ok(
  $$
    insert into cif.project(operator_id, funding_stream_rfp_id, project_status_id, rfp_number, summary, project_name)
    values (1, 1, 1, '001', 'summary', 'project 4');
  $$,
    'cif_admin can insert data in project table'
);

select lives_ok(
  $$
    update cif.project set summary = 'changed by admin' where project_name = 'project 4';
  $$,
    'cif_admin can change data in project table'
);

select results_eq(
  $$
    select count(id) from cif.project where summary = 'changed by admin'
  $$,
    ARRAY[1::bigint],
    'Data was changed by cif_admin'
);

select throws_like(
  $$
    delete from cif.project where id=1
  $$,
  'permission denied%',
    'Administrator cannot delete rows from table project'
);


-- cif_internal
set role cif_internal;
select concat('current user is: ', (select current_user));

select lives_ok(
  $$
    select * from cif.project
  $$,
    'cif_internal can view all data in project table'
);

select lives_ok(
  $$
    insert into cif.project(operator_id, funding_stream_rfp_id, project_status_id, rfp_number, summary, project_name)
    values (1, 1, 1, '002', 'summary', 'project 5');
  $$,
    'cif_internal can insert data in project table'
);

select lives_ok(
  $$
    update cif.project set summary = 'changed by internal' where project_name = 'project 5';
  $$,
    'cif_internal can change data in project table'
);

select results_eq(
  $$
    select count(id) from cif.project where summary = 'changed by internal'
  $$,
    ARRAY[1::bigint],
    'Data was changed by cif_internal'
);

select throws_like(
  $$
    delete from cif.project where id=1
  $$,
  'permission denied%',
    'cif_internal cannot delete rows from table project'
);

select finish();
rollback;
