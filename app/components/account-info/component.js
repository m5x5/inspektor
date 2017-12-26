import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({

  classNames: ['account-info'],

  userAddress: null,

  username: computed('userAddress', function() {
    return this.get('userAddress').split('@')[0];
  }),

  host: computed('userAddress', function() {
    return '@' + this.get('userAddress').split('@')[1];
  })

});
