import Route from '@ember/routing/route';
import EmberObject from '@ember/object';
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
    let items = [];

    if (isEmpty(params.path)) { return null; }

    if (path.substr(-1) !== '/') { path += '/'; }

    return this.get('storage.client').getListing(path).then(listing => {
      Object.keys(listing).forEach(name => {
        let item = listing[name];

        items.push(EmberObject.create({
          name: name,
          type: item['Content-Type'] || 'folder',
          size: item['Content-Length'] || null
        }));
      });

      return items;
    });
  }

});
