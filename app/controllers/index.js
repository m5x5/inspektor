import Controller from '@ember/controller';
import EmberObject from '@ember/object';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';

export default Controller.extend({

  storage: service(),

  connecting: alias('storage.connecting'),
  connected: alias('storage.connected'),
  categories: alias('storage.categories'),

  currentListing: function() {
    if (!this.get('categories')) { return null; }
    const listing = [];

    this.get('categories').forEach(categoryName => {
      listing.pushObject(EmberObject.create({
        name: categoryName,
        type: 'folder'
      }));
    });

    return listing;
  }.property('categories.[]')

});
