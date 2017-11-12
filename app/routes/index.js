import Route from '@ember/routing/route';
import EmberObject from '@ember/object';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import simpleContentType from 'inspektor/utils/simple-content-type';

export default Route.extend({

  storage: service(),

  queryParams: {
    path: {
      refreshModel: true
    }
  },

  model(params) {
    let path = params.path;
    let items = [];

    if (isEmpty(params.path)) { return null; }

    if (path.substr(-1) !== '/') { path += '/'; }

    return this.get('storage.client').getListing(path).then(listing => {
      Object.keys(listing).forEach(name => {
        let item = listing[name];
        let type = item['Content-Type'] || 'folder';
        if (type !== 'folder') { type = simpleContentType(type); }

        items.push(EmberObject.create({
          name: name,
          type: type,
          size: item['Content-Length'] || null
        }));
      });

      return items;
    });
  },

  setupController(controller, model) {
    this._super(controller, model);

    if (isEmpty(this.get('storage.categories')) && this.get('storage.connected')) {
      this.get('storage').fetchCategories();
    }
  }

});
