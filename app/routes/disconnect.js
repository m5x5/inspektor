import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({

  storage: service(),

  beforeModel() {
    this.get('storage.rs').disconnect();
    this.transitionTo('connect');
  }

});
