import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({

  classNames: ['directory-listing'],

  items: null,

  itemsSorted: computed('items', function() {
    let items = this.get('items');

    // folders first
    return items.reject(i => i.type !== 'folder')
                .concat(items.reject(i => i.type === 'folder'));
  })

});
