import { moduleFor, test } from 'ember-qunit';

moduleFor('route:connect', 'Unit | Route | connect', {
  needs: ['service:storage']
});

test('it exists', function(assert) {
  let route = this.subject();
  assert.ok(route);
});
