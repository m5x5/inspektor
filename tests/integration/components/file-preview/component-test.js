import { moduleForComponent, test } from 'ember-qunit';
import Service from '@ember/service';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('file-preview', 'Integration | Component | file preview', {
  integration: true
});

test('it renders', function(assert) {
  // Stub the storage service to avoid network/errors during render
  const StubStorage = Service.extend({
    client: null,
    init() {
      this._super(...arguments);
      this.set('client', {
        getFile() {
          // Return a pending promise so fileLoaded stays false
          return new Promise(() => {});
        },
        getItemURL() {
          return 'blob:stub';
        }
      });
    }
  });
  this.register('service:storage', StubStorage);

  this.set('metaData', {
    etag: "714148227",
    isBinary: false,
    isFolder: false,
    name: "fra-pdx",
    path: "trips/2018/06/19/fra-pdx",
    size: 92086791,
    type: "application/json"
  });

  this.render(hbs`{{file-preview metaData=metaData}}`);

  assert.equal(this.$().text().trim(), '');
});
