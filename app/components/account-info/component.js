import Component from '@ember/component';
import { computed } from '@ember/object';
import layout from './template';

export default Component.extend({
  layout,
  classNames: ['account-info'],

  userAddress: null,

  username: computed('userAddress', function() {
    return this.get('userAddress').split('@')[0];
  }),

  host: computed('userAddress', function() {
    return '@' + this.get('userAddress').split('@')[1];
  })

});
