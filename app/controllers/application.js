import Controller from '@ember/controller';
import EmberObject from '@ember/object';
import { observer } from '@ember/object';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { isEmpty } from '@ember/utils';

export default Controller.extend({

  storage: service(),

  connecting: alias('storage.connecting'),
  connected: alias('storage.connected'),
  rootListing: alias('storage.rootListing'),
  currentDirPath: null,

  categories: function() {
    let categories = [];
    let rootListing = this.get('rootListing');
    if (isEmpty(rootListing)) { return categories; }

    rootListing.forEach(item => {
      if (!item.isFolder) { return; }

      categories.push(EmberObject.create({
        name: item.name.replace('/', ''),
        type: item.type,
        path: item.name
      }));
    });

    return categories;
  }.property('rootListing'),

  connectedChange: observer('connected', function() {
    if (this.get('connected')) {
      // console.debug('connectedChange connected');
    } else {
      this.set('currentDirPath', null);
    }
  }),

});
