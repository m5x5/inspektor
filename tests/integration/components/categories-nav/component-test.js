import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('categories-nav', 'Integration | Component | categories nav', {
  integration: true
});

test('it renders categories', function(assert) {
  this.set('categories', [
    { name: 'documents', path: 'documents/' },
    { name: 'notes', path: 'notes/' }
  ]);

  this.render(hbs`{{categories-nav categories=categories}}`);

  assert.equal(this.$('ul li:first a').text(), 'documents');
});
