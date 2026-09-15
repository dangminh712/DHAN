import test from 'node:test';
import assert from 'node:assert/strict';
import { nextTableSort, tableQuery } from './tableState.js';
test('sorting toggles once without mutating the prior state, including replay', () => {
 const before={sortKey:'name',sortDir:'asc'};
 assert.deepEqual(nextTableSort(before,'name'),{sortKey:'name',sortDir:'desc'});
 assert.deepEqual(nextTableSort(before,'name'),{sortKey:'name',sortDir:'desc'});
 assert.deepEqual(nextTableSort(before,'date'),{sortKey:'date',sortDir:'asc'});
 assert.equal(before.sortDir,'asc');
});
test('remote query always includes bounded pagination and global sorting', () => {
 assert.deepEqual(tableQuery({page:2,pageSize:500,sortKey:'name',sortDir:'desc'},{search:'abc'}),{page:2,pageSize:100,sortBy:'name',sortDir:'desc',search:'abc'});
});
