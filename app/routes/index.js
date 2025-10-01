import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { isEmpty, isPresent } from '@ember/utils';
import { later } from '@ember/runloop';
import { hash, Promise } from 'rsvp';

export default Route.extend({

  storage: service(),
  router: service(),

  queryParams: {
    path: {
      refreshModel: true
    }
  },

  async beforeModel() {
    await this.waitForConnectionState();
    if (this.storage.disconnected) {
      this.router.transitionTo('connect');
    }
  },

  model(params) {
    let path = params.path;

    if (isEmpty(params.path)) { return null; }

    if (path.substr(-1) !== '/') { path += '/'; }

    return hash({
      currentListing: this.storage.fetchListing(path),
      currentDirPath: path
    });
  },

  setupController(controller, model) {
    this._super(controller, model);

    if (isEmpty(this.storage.categories) && this.storage.connected) {
      this.storage.fetchRootListing();
    }

    if (isPresent(model)) {
      controller.set('currentDirPath', model.currentDirPath);

      if (isEmpty(model.currentListing)) {
        this.router.transitionTo('index', {
          queryParams: { path: controller.get('parentDir') }
        });
      }
    }
  },

  waitForConnectionState() {
    return new Promise(resolve => {
      const checkConnectingDone = () => {
        if (this.storage.connecting) {
          later(checkConnectingDone, 20);
        } else {
          resolve();
        }
      };
      checkConnectingDone();
    });
  }

});