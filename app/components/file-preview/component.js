import Component from '@ember/component';
import { alias } from '@ember/object/computed';

export default Component.extend({

  storage: null,

  classNames: ['file-preview'],

  fileLoaded: false,
  fileContent: null,
  objectURL: null,
  metaData: null,
  type: alias('metaData.type'),
  isBinary: alias('metaData.isBinary'),

  isImage: function() {
    return this.get('type').match(/^image\/.+$/);
  }.property('type'),

  isText: function() {
    return !this.get('isBinary');
  }.property('isBinary'),

  loadFile: function() {
    let path = this.get('metaData.path');

    // TODO don't fetch is size above certain limit

    this.get('storage.client').getFile(path).then(file => {
      if (this.get('isImage')) {
        let view = new window.Uint8Array(file.data);
        let blob = new window.Blob([view], { type: file.contentType });
        this.set('objectURL', window.URL.createObjectURL(blob));
      } else {
        this.set('fileContent', file.data);
      }
      this.set('fileLoaded', true);
    });
  }.on('init')

});
