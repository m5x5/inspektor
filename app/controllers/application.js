import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { observer } from '@ember/object';

export default Controller.extend({

  storage: service(),

  connecting: alias('storage.connecting'),
  connected: alias('storage.connected'),

  categories: null,

  handleConnected: observer('connected', function() {
    this.fetchCategories();
  }),

  fetchCategories() {
    const client = this.get('storage.client');

    client.getListing('').then(listing => {
      let dirnames = Object.keys(listing);
      let categories = dirnames.map(i => i.replace('/', '')).sort();
      this.set('categories', categories);
    });
  }

});
