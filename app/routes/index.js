import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';

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

    return this.get('storage').fetchListing(path);
  },

  setupController(controller, model) {
    this._super(controller, model);

    if (isEmpty(this.get('storage.categories')) && this.get('storage.connected')) {
      this.get('storage').fetchCategories();
    }
  }

});
