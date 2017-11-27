import { moduleFor, test } from 'ember-qunit';

moduleFor('route:inspect', 'Unit | Route | inspect', {
  needs: ['service:storage']
});

test('it exists', function(assert) {
  let route = this.subject();
  assert.ok(route);
});
