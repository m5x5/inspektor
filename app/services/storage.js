import EmberObject from '@ember/object';
import Service from '@ember/service';
import { observer } from '@ember/object';
import { not } from '@ember/object/computed';
import { isEmpty } from '@ember/utils';
import RemoteStorage from 'remotestoragejs';
import Widget from 'remotestorage-widget';
import simpleContentType from 'inspektor/utils/simple-content-type';

export default Service.extend({

  rs: null,
  widget: null,
  connecting: true,
  connected: false,
  unauthorized: false,
  userAddress: null,
  disconnected: not('connected'),
  client: null,
  rootListing: null,

  init() {
    this._super(...arguments);
    const rs = new RemoteStorage({
      cache: false
    });

    rs.access.claim('*', 'rw');

    // rs.setApiKeys({
    //   dropbox: config.dropboxAppKey,
    //   googledrive: config.gdriveClientId
    // });

    const widget = new Widget(rs, {
      skipInitial: true
    });

    // Attach widget to DOM
    widget.attach();

    rs.on('ready', () => {
      console.debug('rs.on ready');
      // this.set('connecting', false);
    });

    rs.on('connected', () => {
      console.debug('rs.on connected');
      this.set('connecting', false);
      this.set('connected', true);
      this.set('userAddress', this.get('rs').remote.userAddress);
    });

    rs.on('not-connected', () => {
      console.debug('rs.on not-connected');
      this.set('connecting', false);
      this.set('connected', false);
    });

    rs.on('disconnected', () => {
      console.debug('rs.on disconnected');
      this.set('connecting', false);
      this.set('connected', false);
    });

    rs.on('connecting', () => {
      console.debug('rs.on connecting');
      this.set('connecting', true);
      this.set('connected', false);
    });

    rs.on('authing', () => {
      console.debug('rs.on authing');
      this.set('connecting', true);
      this.set('connected', false);
    });

    this.set('rs', rs);
    this.set('widget', widget);
    this.set('client', rs.scope('/'));
  },

  connectedChange: observer('connected', function() {
    if (this.get('connected')) {
      this.fetchRootListing();
    } else {
      this.clearLocalData();
    }
  }),

  clearLocalData() {
    this.setProperties({
      userAddress: null,
      rootListing: null
    });
  },

  fetchRootListing() {
    this.fetchListing('').then(items => {
      if (Array.isArray(items) && items.sortBy) {
        this.set('rootListing', items.sortBy('name'));
      } else if (Array.isArray(items)) {
        this.set('rootListing', items.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      } else {
        this.set('rootListing', items);
      }
    });
  },

  fetchListing(path) {
    let items = [];

    return this.get('client').getListing(path).then(listing => {
      if (isEmpty(listing)) { return []; }

      Object.keys(listing).forEach(name => {
        let item = listing[name];
        let type = item['Content-Type'] || 'folder';
        let isBinary = false;
        if (type !== 'folder') {
          isBinary = !!type.match(/charset=binary/);
          type = simpleContentType(type);
        }

        items.push(EmberObject.create({
          name: name,
          type: type,
          isBinary: isBinary,
          isFolder: type === 'folder',
          size: item['Content-Length'] || null,
          path: path + name,
          etag: item['ETag']
        }));
      });

      return items;
    });
  }

});
