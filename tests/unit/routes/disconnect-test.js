import { moduleFor, test } from 'ember-qunit';

moduleFor('route:disconnect', 'Unit | Route | disconnect', {
  needs: ['service:storage']
});

test('it exists', function(assert) {
  let route = this.subject();
  assert.ok(route);
});
