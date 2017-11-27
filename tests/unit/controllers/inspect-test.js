import { moduleFor, test } from 'ember-qunit';

moduleFor('controller:inspect', 'Unit | Controller | inspect', {
  needs: ['controller:application', 'service:storage']
});

// Replace this with your real tests.
test('it exists', function(assert) {
  let controller = this.subject();
  assert.ok(controller);
});
