import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { isEmpty, isPresent } from '@ember/utils';
import { later } from '@ember/runloop';
import { hash, Promise } from 'rsvp';

export default Route.extend({

  storage: service(),

  queryParams: {
    path: {
      refreshModel: true
    }
  },

  beforeModel() {
    return this.waitForConnectionState();
  },

  model(params) {
    if (this.get('storage.disconnected')) { return null; }

    let path = params.path;

    if (isEmpty(params.path)) { return null; }

    if (path.substr(-1) !== '/') { path += '/'; }

    return hash({
      currentListing: this.get('storage').fetchListing(path),
      currentDirPath: path
    });
  },

  setupController(controller, model) {
    this._super(controller, model);
    if (this.get('storage.disconnected')) { return true; }

    if (isEmpty(this.get('storage.categories')) && this.get('storage.connected')) {
      this.get('storage').fetchRootListing();
    }

    if (isPresent(model)) {
      controller.set('currentDirPath', model.currentDirPath);
    }
  },

  waitForConnectionState() {
    let self = this;

    return new Promise(resolve => {
      function checkConnectingDone() {
        if (self.get('storage.connecting')) {
          later(checkConnectingDone, 20);
        } else {
          resolve();
        }
      }
      checkConnectingDone();
    });
  }

});
