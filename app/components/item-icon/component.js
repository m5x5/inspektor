import Component from '@ember/component';

export default Component.extend({

  tagName: 'img',
  classNames: ['item-icon'],
  attributeBindings: ['src:src'],

  type: null,

  isFolder: function() {
    return this.get('type') === 'folder';
  }.property('type'),

  src: function() {
    let prefix = '/img/file-icons/';
    let type = this.get('type');
    let filename;

    if (this.get('isFolder')) {
      filename = 'folder.svg';
    } else {
      if (type.match(/json/i)) {
        filename = 'code-curly.svg';
      } else {
        filename = 'file.svg';
      }
    }

    return prefix + filename;
  }.property()

});
