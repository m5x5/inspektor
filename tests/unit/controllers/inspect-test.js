import { moduleFor, test } from 'ember-qunit';

moduleFor('controller:inspect', 'Unit | Controller | inspect', {
  needs: ['controller:application', 'service:storage']
});

test('#documentIsJSON', function(assert) {
  let controller = this.subject();

  controller.set('model', {});

  controller.set('model.documentMetaData', {
    "name": "869575AF-84AE-49B3-8752-5782E9CA2BC5",
    "type": "application/json",
    "isBinary": false,
    "isFolder": false,
    "size": 202,
    "path": "/documents/notes/869575AF-84AE-49B3-8752-5782E9CA2BC5",
    "etag": "776662336"
  });

  assert.ok(controller.get('documentIsJSON'), 'is true when content type is JSON');

  controller.set('model.documentMetaData', {
    "name": "171127-1708-32c3.png",
    "type": "image/png",
    "isBinary": true,
    "isFolder": false,
    "size": 42624,
    "path": "public/shares/171127-1708-32c3.png",
    "etag": "894001114"
  });

  assert.notOk(controller.get('documentIsJSON'), 'is false when content type is not JSON');
});

test('jsonView actions/methods', function(assert) {
  let controller = this.subject();
  controller.set('jsonView', null);

  controller.send('showJsonTree');
  assert.ok(controller.get('jsonShowTree'));
  assert.notOk(controller.get('jsonShowSource'));

  controller.send('showJsonSource');
  assert.ok(controller.get('jsonShowSource'));
  assert.notOk(controller.get('jsonShowTree'));
});
