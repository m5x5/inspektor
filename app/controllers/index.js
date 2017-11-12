import Controller from '@ember/controller';
import EmberObject from '@ember/object';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { isPresent } from '@ember/utils';

export default Controller.extend({

  storage: service(),

  connecting: alias('storage.connecting'),
  connected: alias('storage.connected'),
  categories: alias('storage.categories'),

  queryParams: ['path'],

  currentListing: function() {
    if (isPresent(this.get('model'))) {
      return this.get('model').sortBy('name');
    }

    if (!this.get('categories')) { return null; }
    const listing = [];

    this.get('categories').forEach(categoryName => {
      listing.push(EmberObject.create({
        name: categoryName,
        type: 'folder'
      }));
    });

    return listing;
  }.property('categories.[]', 'model.[]')

});
