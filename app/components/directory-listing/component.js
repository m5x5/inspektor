import Component from '@ember/component';

export default Component.extend({

  classNames: ['directory-listing'],

  items: null,

  itemsSorted: function() {
    let items = this.get('items');

    // folders first
    return items.reject(i => i.type !== 'folder')
                .concat(items.reject(i => i.type === 'folder'));
  }.property('items')

});
