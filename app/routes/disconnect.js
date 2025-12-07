import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default Route.extend({

  storage: service(),
  router: service(),

  beforeModel() {
    this.get('storage.rs').disconnect();
    this.router.transitionTo('connect');
  }

});
