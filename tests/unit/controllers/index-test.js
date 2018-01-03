import { moduleFor, test } from 'ember-qunit';

moduleFor('controller:index', 'Unit | Controller | index', {
  needs: ['controller:application', 'service:storage']
});

test('#parentDir', function(assert) {
  let controller = this.subject();
  controller.set('currentDirPath', 'islands/spain/canaries/tenerife/');

  assert.equal(controller.get('parentDir'), 'islands/spain/canaries/');
});

test('#currentListingContainsDocuments', function(assert) {
  let controller = this.subject();

  controller.set('currentListing', [
    {
      "name": "spain/",
      "type": "folder",
      "isBinary": false,
      "isFolder": true,
      "size": null,
      "path": "/islands/spain/",
      "etag": "885098000"
    }
  ]);

  assert.notOk(controller.get('currentListingContainsDocuments'),
               'returns false when no documents are present');

  controller.set('currentListing', [
    {
      "name": "spain/",
      "type": "folder",
      "isBinary": false,
      "isFolder": true,
      "size": null,
      "path": "/islands/spain/",
      "etag": "885098000"
    },
    {
      "name": "lamu",
      "type": "application/json",
      "isBinary": false,
      "isFolder": false,
      "size": 202,
      "path": "/islands/lamu",
      "etag": "478058546"
    }
  ]);

  assert.ok(controller.get('currentListingContainsDocuments'),
            'returns true when no documents are present');
});

test('#documentCount', function(assert) {
  let controller = this.subject();

  controller.set('currentListing', [
    {
      "name": "spain/",
      "type": "folder",
      "isBinary": false,
      "isFolder": true,
      "size": null,
      "path": "/islands/spain/",
      "etag": "885098000"
    },
    {
      "name": "lamu",
      "type": "application/json",
      "isBinary": false,
      "isFolder": false,
      "size": 202,
      "path": "/islands/lamu",
      "etag": "478058546"
    },
    {
      "name": "dominica",
      "type": "application/json",
      "isBinary": false,
      "isFolder": false,
      "size": 202,
      "path": "/islands/dominica",
      "etag": "929838541"
    }
  ]);

  assert.equal(controller.get('documentCount'), 2,
               'returns the number of documents in the current listing');
});
