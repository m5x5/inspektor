import Controller from '@ember/controller';
import { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { isPresent } from '@ember/utils';

export default Controller.extend({

  application: controller(),
  storage: service(),

  connecting: alias('storage.connecting'),
  connected: alias('storage.connected'),
  rootListing: alias('storage.rootListing'),
  currentDirPath: alias('application.currentDirPath'),

  queryParams: ['path'],

  currentListing: function() {
    if (isPresent(this.get('model.currentListing'))) {
      return this.get('model.currentListing').sortBy('name');
    } else {
      return this.get('rootListing');
    }
  }.property('rootListing.[]', 'model.[]')

});
