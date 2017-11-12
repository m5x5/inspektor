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

  assert.equal(this.$('ul li:nth-of-type(1) span.name').text(), 'documents');
  assert.equal(this.$('ul li:nth-of-type(1) span.type').text(), 'folder');
  assert.equal(this.$('ul li:nth-of-type(2) span.name').text(), 'public');
});
