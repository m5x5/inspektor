import Component from '@ember/component';
import { alias } from '@ember/object/computed';

export default Component.extend({

  storage: null,

  classNames: ['file-preview'],

  fileLoaded: false,
  fileContent: null,
  metaData: null,
  type: alias('metaData.type'),
  isBinary: alias('metaData.isBinary'),

  isImage: function() {
    return this.get('type').match(/^image\/.+$/);
  }.property('type'),

  isText: function() {
    return !this.get('isBinary');
  }.property('isBinary'),

  fetchFile: function() {
    let path = this.get('metaData.path');

    this.get('storage.client').getFile(path).then(file => {
      this.set('fileContent', file.data);
      this.set('fileLoaded', true);
    });
  }.on('init')

});
