import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('account-info', 'Integration | Component | account info', {
  integration: true
});

test('it splits the user address into username and host', function(assert) {
  this.set('userAddress', 'michielbdejong@unhosted.org');
  this.render(hbs`{{account-info userAddress=userAddress}}`);

  assert.equal(this.$('.username').text().trim(), 'michielbdejong');
  assert.equal(this.$('.host').text().trim(), '@unhosted.org');
});
