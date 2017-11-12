import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { isPresent } from '@ember/utils';

export default Controller.extend({

  storage: service(),

  connecting: alias('storage.connecting'),
  connected: alias('storage.connected'),
  rootListing: alias('storage.rootListing'),

  queryParams: ['path'],

  currentListing: function() {
    if (isPresent(this.get('model'))) {
      return this.get('model').sortBy('name');
    }
    return this.get('rootListing');
  }.property('rootListing.[]', 'model.[]')

});
