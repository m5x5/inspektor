import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('file-preview', 'Integration | Component | file preview', {
  integration: true
});

test('it renders', function(assert) {
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
