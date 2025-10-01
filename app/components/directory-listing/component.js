import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({

  classNames: ['directory-listing'],

  items: null,

  itemsSorted: computed('items', function() {
    let items = this.get('items');

    if (!Array.isArray(items)) {
      return [];
    }

    // folders first
    const folders = items.filter(i => i.type === 'folder');
    const files = items.filter(i => i.type !== 'folder');
    return folders.concat(files);
  })

});
