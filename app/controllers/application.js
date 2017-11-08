import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { observer } from '@ember/object';

export default Controller.extend({

  storage: service(),

  connecting: alias('storage.connecting'),
  connected: alias('storage.connected'),
  categories: alias('storage.categories'),

  handleConnected: observer('connected', function() {
    this.get('storage').fetchCategories();
  })

});
