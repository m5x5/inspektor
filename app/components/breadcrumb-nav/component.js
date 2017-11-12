import Component from '@ember/component';
import EmberObject from '@ember/object';
import { isEmpty } from '@ember/utils';

export default Component.extend({

  tagName: 'nav',
  classNames: ['breadcrumb-nav'],

  currentDirPath: null,

  linkItems: function() {
    let currentDirPath = this.get('currentDirPath');
    if (isEmpty(currentDirPath)) { return []; }
    let linkItems = [];

    let dirs = currentDirPath.split('/')
                             .reject(i => isEmpty(i));

    dirs.forEach(dirname => {
      let path = currentDirPath.match(`(.*${dirname})/`)[0];

      linkItems.pushObject(EmberObject.create({
        name: dirname,
        path: path
      }));
    });

    return linkItems;
  }.property('currentDirPath')

});
