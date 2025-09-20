import Controller from '@ember/controller';
import { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { computed, observer } from '@ember/object';
import { alias } from '@ember/object/computed';
import { isPresent, isEmpty } from '@ember/utils';
import { all } from 'rsvp';

export default Controller.extend({

  application: controller(),
  storage: service(),

  connected: alias('storage.connected'),
  rootListing: alias('storage.rootListing'),
  currentDirPath: alias('application.currentDirPath'),

  queryParams: ['path'],

  currentListing: computed('rootListing.[]', 'model.[]', function () {
    if (isPresent(this.get('model.currentListing'))) {
      return this.get('model.currentListing').sortBy('name');
    } else {
      return this.get('rootListing');
    }
  }),

  documents: computed('currentListing.[]', function () {
    if (isEmpty(this.get('currentListing'))) { return []; }

    return this.get('currentListing')
               .reject(item => item.path.substr(-1) === '/');
  }),

  currentListingContainsDocuments: computed('documents.[]', function () {
    return isPresent(this.get('documents'));
  }),

  documentCount: computed('documents.[]', function () {
    if (isPresent(this.get('documents'))) {
      return this.get('documents').length;
    } else {
      return 0;
    }
  }),

  parentDir: computed('currentDirPath', function () {
    const dirs = this.get('currentDirPath')
                     .split('/')
                     .reject(p => isEmpty(p));

    return dirs.splice(0, dirs.length - 1).join('/') + '/';
  }),

  connectedChange: observer('connected', function () {
    if (this.get('connected')) {
      // console.debug('connectedChange connected');
    } else {
      this.set('model', null);
      this.set('path', null);
    }
  }),

  actions: {

    deleteDocuments () {
      const documentCount = this.get('documentCount');
      const msg = `Delete all ${documentCount} documents/files in the current directory?`;
      if (! window.confirm(msg)) { return false; }

      const client = this.get('storage.client');

      let promises = this.get('documents').map(item => {
        console.debug('removing ' + item.path);
        return client.remove(item.path);
      });

      all(promises).then(() => {
        this.transitionToRoute('index', {
          queryParams: { path: this.get('parentDir') }
        });
      });
    }

  }

});
