import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { isEmpty, isPresent } from '@ember/utils';
import { hash } from 'rsvp';

export default Route.extend({

  storage: service(),

  queryParams: {
    path: {
      refreshModel: true
    }
  },

  model(params) {
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

    if (isEmpty(this.get('storage.categories')) && this.get('storage.connected')) {
      this.get('storage').fetchRootListing();
    }

    if (isPresent(model)) {
      controller.set('currentDirPath', model.currentDirPath);
    }
  }

});
