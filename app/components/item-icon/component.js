import Component from '@ember/component';

export default Component.extend({

  classNames: ['item-icon'],

  type: null,

  isFolder: function() {
    return this.get('type') === 'folder';
  }.property('type')

});
