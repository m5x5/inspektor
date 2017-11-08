import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('directory-listing', 'Integration | Component | directory listing', {
  integration: true
});

test('it renders directory items', function(assert) {
  this.set('items', [
    { name: 'documents', type: 'folder' },
    { name: 'public', type: 'folder' }
  ]);

  this.render(hbs`{{directory-listing items=items}}`);

  assert.equal(this.$('table tbody tr:first td:nth-of-type(2)').text(), 'documents');
  assert.equal(this.$('table tbody tr:first td:nth-of-type(3)').text(), 'folder');
});
