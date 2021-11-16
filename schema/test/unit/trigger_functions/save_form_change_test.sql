begin;

select plan(9);

create schema mock_schema;

create table mock_schema.mock_form_change (
  id integer primary key generated always as identity,
  new_form_data jsonb,
  operation varchar(1000),
  form_data_schema_name varchar(1000),
  form_data_table_name varchar(1000),
  form_data_record_id integer,
  change_status varchar(1000) default 'pending'
);

create table mock_schema.mock_table (
  id integer primary key generated always as identity,
  text_col text,
  int_col integer,
  bool_col boolean,
  required_col text not null,
  defaulted_col int default 99
);

create trigger trigger_under_test
    after insert or update of change_status on mock_schema.mock_form_change
    for each row
    execute procedure cif_private.save_form_change();

insert into cif.change_status (status, triggers_save, active)
values
  ('test_pending', false, true),
  ('test_saved', true, true);

-- make sure the funciton exists

select has_function('cif_private', 'save_form_change', 'Function save_form_change should exist');


-- setting up pending change

insert into mock_schema.mock_form_change(new_form_data, operation, form_data_schema_name, form_data_table_name, form_data_record_id, change_status)
values (
  '{"text_col":"test text", "int_col":234, "bool_col": true, "required_col": "req", "defaulted_col": 1}',
  'INSERT', 'mock_schema', 'mock_table', nextval(pg_get_serial_sequence('mock_schema.mock_table', 'id')), 'test_pending'
);

-- for insert a new record is created, only if the change status is marked as trigger change

select is(
  (select count(*) from mock_schema.mock_table),
  0::bigint,
  'No records should be created for a pending change'
);

update mock_schema.mock_form_change set change_status = 'test_saved' where id = 1;

select is(
  (select count(*) from mock_schema.mock_table where text_col='test text'),
  1::bigint,
  'A record should be created on a saved change'
);

-- doesnt insert if the data is missing required fields
insert into mock_schema.mock_form_change(new_form_data, operation, form_data_schema_name, form_data_table_name, form_data_record_id, change_status)
values (
  '{"text_col":"test2 text"}',
  'INSERT', 'mock_schema', 'mock_table', nextval(pg_get_serial_sequence('mock_schema.mock_table', 'id')), 'test_pending'
);

select throws_ok(
  $$
    update mock_schema.mock_form_change set change_status = 'test_saved' where id = 2
  $$,
  'null value in column "required_col" violates not-null constraint'
);

-- inserts with default value if data is missing
insert into mock_schema.mock_form_change(new_form_data, operation, form_data_schema_name, form_data_table_name, form_data_record_id, change_status)
values (
  '{"text_col":"test3", "required_col":"required"}',
  'INSERT', 'mock_schema', 'mock_table', nextval(pg_get_serial_sequence('mock_schema.mock_table', 'id')), 'test_pending'
);
update mock_schema.mock_form_change set change_status = 'test_saved' where id = 3;

select results_eq(
  $$
    select defaulted_col from mock_schema.mock_table where text_col='test3'
  $$,
  $$
    values (99::integer)
  $$,
  'Default value should be inserted when not provided in the changes'
);

-- on update an existing record is committed, only if the change status is marked as trigger change
insert into mock_schema.mock_form_change(new_form_data, operation, form_data_schema_name, form_data_table_name, form_data_record_id, change_status)
values (
  '{"text_col":"test_update"}',
  'UPDATE', 'mock_schema', 'mock_table', (select id from mock_schema.mock_table where text_col='test3'), 'test_pending'
);

select is(
  (select count(*) from mock_schema.mock_table where text_col='test_update'),
  0::bigint,
  'No record should be updated for a pending change'
);

update mock_schema.mock_form_change set change_status = 'test_saved' where id = 4;

select is(
  (select count(*) from mock_schema.mock_table where text_col='test_update'),
  1::bigint,
  'A record should be updated when a pending change is saved'
);

-- on delete nothing happens and a notice is printed
select throws_ok(
  $$
    insert into mock_schema.mock_form_change(new_form_data, operation, form_data_schema_name, form_data_table_name, form_data_record_id, change_status)
    values (
      '{"text_col":"test_delete", "required_col":"req"}',
      'DELETE', 'mock_schema', 'mock_table', (select id from mock_schema.mock_table where text_col='test_pending'), 'test_saved'
    )
  $$,
  'Cannot save change with operation DELETE',
  'a change record with the DELETE operation should throw an exception'
);

select is(
  (select count(*) from mock_schema.mock_form_change where operation='DELETE'),
  0::bigint,
  'No record should be inserted on DELETE'
);

select finish();

rollback;
