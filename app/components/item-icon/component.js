import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({

  tagName: 'img',
  classNames: ['item-icon'],
  attributeBindings: ['src:src'],

  type: null,

  isFolder: computed('type', function() {
    return this.get('type') === 'folder';
  }),

  src: computed(function() {
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
  })

});
