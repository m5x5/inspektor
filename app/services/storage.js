import EmberObject from '@ember/object';
import Service from '@ember/service';
import RemoteStorage from 'npm:remotestoragejs';
import Widget from 'npm:remotestorage-widget';
import simpleContentType from 'inspektor/utils/simple-content-type';

export default Service.extend({

  rs: null,
  widget: null,
  connecting: true,
  connected: false,
  client: null,
  categories: null,

  setup: function() {
    const rs = new RemoteStorage({
      cache: false
    });

    rs.access.claim('*', 'rw');

    // rs.setApiKeys({
    //   dropbox: config.dropboxAppKey,
    //   googledrive: config.gdriveClientId
    // });

    const widget = new Widget(rs, {
      leaveOpen: true
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
  }.on('init'),

  fetchCategories() {
    const client = this.get('client');

    client.getListing('').then(listing => {
      let dirnames = Object.keys(listing);
      let categories = dirnames.reject(i => i.substr(-1) !== '/')
                               .map(i => i.replace('/', ''))
                               .sort();

      this.set('categories', categories);
    });
  },

  fetchListing(path) {
    let items = [];

    return this.get('client').getListing(path).then(listing => {
      Object.keys(listing).forEach(name => {
        let item = listing[name];
        let type = item['Content-Type'] || 'folder';
        if (type !== 'folder') { type = simpleContentType(type); }

        items.push(EmberObject.create({
          name: name,
          type: type,
          isFolder: type === 'folder',
          size: item['Content-Length'] || null,
          path: path + name
        }));
      });

      return items;
    });
  }

});
