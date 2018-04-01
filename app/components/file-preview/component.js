import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';
import { alias } from '@ember/object/computed';
import { scheduleOnce } from '@ember/runloop';
import JSONTreeView from 'npm:json-tree-view';

export default Component.extend({

  storage: service(),

  classNames: ['file-preview'],

  fileLoaded: false,
  fileContent: null,
  objectURL: null,
  metaData: null,
  isJSON: null,
  type: alias('metaData.type'),
  isBinary: alias('metaData.isBinary'),

  isImage: function() {
    return this.get('type').match(/^image\/.+$/); }.property('type'),

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
  }.on('didInsertElement'),

  onFileLoaded: observer('fileLoaded', function(){
    if (this.get('fileLoaded') && this.get('isJSON') && this.get('jsonShowTree')) {
      scheduleOnce('afterRender', this, 'renderJsonTree');
    }
  }),

  onJsonViewChanged: observer('jsonShowTree', function(){
    if (this.get('fileLoaded') && this.get('isJSON') && this.get('jsonShowTree')) {
      scheduleOnce('afterRender', this, 'renderJsonTree');
    }
  }),

  renderJsonTree () {
    let value = JSON.parse(this.get('fileContent'));

    let view = new JSONTreeView('content', value);

    // Listen for change events
    view.on('change', function(self, key, oldValue, newValue){
      console.log('change', key, oldValue, '=>', newValue);
    });
    view.on('rename', function(self, key, oldName, newName) {
      console.log('rename', key, oldName, '=>', newName);
    });
    view.on('delete', function(self, key) {
      console.log('delete', key);
    });
    view.on('append', function(self, key, nameOrValue, newValue) {
      console.log('append', key, nameOrValue, '=>', newValue);
    });
    view.on('click', function(self, key, value) {
      console.log('click', key, '=', value);
    });
    view.on('expand', function(self, key, value) {
      console.log('expand', key, '=', value);
    });
    view.on('collapse', function(self, key, value) {
      console.log('collapse', key, '=', value);
    });
    view.on('refresh', function(self, key, value) {
      console.log('refresh', key, '=', value);
    });

    document.getElementById('json-tree-view')
            .appendChild(view.dom);

    window.jsonview = view;

    view.expand(true);

    view.withRootName = false;
    view.readonly = this.get('hideEditor');

    this.set('jsonTreeView', view);
  },

  onShowEditor: observer('showEditor', function(){
    if (this.get('fileLoaded') && this.get('isJSON') && this.get('jsonShowTree')) {
      this.set('jsonTreeView.readonly', !this.get('showEditor'));
    }
  }),

  actions: {

    saveChanges () {
      const path = this.get('metaData.path');

      if (this.get('isJSON') && this.get('jsonShowTree')) {
        const content = JSON.stringify(this.get('jsonTreeView.value'));

        this.get('storage.client')
            .storeFile('application/json', path, content)
            .then(etag => {
              this.setProperties({
                'metaData.etag': etag,
                fileContent: content,
                showEditor: false
              });
            }).catch(err => {
              alert('Failed to update the file. Check the console for more info.');
              console.error(err);
            });
      } else {
        console.warn('not implemented');
      }
    },

    cancelEditor () {
      this.set('showEditor', false);
    }

  }

});
