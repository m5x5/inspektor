import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { isEmpty, isPresent } from '@ember/utils';

export default Route.extend({

  storage: service(),

  queryParams: {
    path: {
      refreshModel: true
    }
  },

  model(params) {
    let path = params.path;

    if (isEmpty(params.path)) {
      // TODO redirect to root
    }
    if (path.substr(-1) === '/') {
      // TODO redirect to parent dir
    }

    let parentDirPath = path.match(/^(.*\/).+$/)[1];
    let documentName  = path.match(/^.*\/(.+)$/)[1];

    // FIXME do a HEAD request instead of fetching parent listing
    return this.get('storage').fetchListing(parentDirPath).then(listing => {
      let metaData = listing.find(item => item.name === documentName);
      return metaData;
    }).then(metaData => {
      return {
        documentMetaData: metaData,
        // documentPublicURL: this.get()
        currentDirPath: parentDirPath,
      };
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

    controller.set('documentShowEditor', false);
  }

});
