import Component from '@ember/component';
import { service } from '@ember/service';
import { observer, computed } from '@ember/object';
import { alias, none, not } from '@ember/object/computed';
import { scheduleOnce } from '@ember/runloop';
import JSONTreeView from 'json-tree-view';
import layout from './template';

export default Component.extend({
  layout,
  storage: service(),

  classNames: ['file-preview'],

  fileLoaded: false,
  uploadingChanges: false,

  showEditor: null,
  hideEditor: not('showEditor'),

  fileContent: null,
  objectURL: null,
  metaData: null,
  isJSON: null,
  type: alias('metaData.type'),
  isBinary: alias('metaData.isBinary'),

  isUnknownBinary: none('isImage', 'isAudio', 'isVideo'),

  isImage: computed('type', function() {
    return this.get('type').match(/^image\/.+$/);
  }),

  isAudio: computed('type', function() {
    return this.get('type').match(/^audio\/.+$/);
  }),

  isVideo: computed('type', function() {
    return this.get('type').match(/^video\/.+$/);
  }),

  isText: computed('isBinary', function() {
    return !this.get('isBinary');
  }),

  init() {
    this._super(...arguments);
    this.saveChanges = this.saveChanges.bind(this);
    this.cancelEditor = this.cancelEditor.bind(this);
  },

  didInsertElement() {
    this._super(...arguments);
    this.loadFile();
  },

  loadFile() {
    let path = this.get('metaData.path');

    if (this.get('isAudio') || this.get('isVideo')) {
      this.set('fileLoaded', true);
      this.set('objectURL', this.get('storage.client')
                                .getItemURL(path));
      return;
    }

    // TODO don't fetch is size above certain limit

    console.debug(`[file-preview] Loading file ${this.get('metaData.name')}`)
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
  },

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
    // this.attachJsonTreeEventHandlers(view);

    const containerElement = document.getElementById('json-tree-view');
    if (!containerElement) {
      console.warn('[file-preview] json-tree-view element not found');
      return;
    }
    containerElement.innerHTML = ''; // Throw away any existing treeviews
    containerElement.appendChild(view.dom);

    window.jsonview = view;

    view.expand(true);

    view.withRootName = false;
    view.readonly = this.get('hideEditor');

    this.set('jsonTreeView', view);
  },

  attachJsonTreeEventHandlers (view) {
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
  },

  onShowEditor: observer('showEditor', function(){
    if (this.get('fileLoaded') && this.get('isJSON') && this.get('jsonShowTree')) {
      const showEditor = this.get('showEditor');

      if (showEditor) {
        this.set('jsonTreeView.readonly', false);
      } else {
        this.set('jsonTreeView.readonly', true);
        this.renderJsonTree();
      }
    }
  }),

  saveChanges() {
    const path = this.get('metaData.path');

    if (this.get('isJSON') && this.get('jsonShowTree')) {
      const content = JSON.stringify(this.get('jsonTreeView.value'));
      this.set('uploadingChanges', true);

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
          }).finally(() => {
            this.set('uploadingChanges', false);
          });
    } else {
      console.warn('not implemented');
    }
  },

  cancelEditor() {
    this.set('showEditor', false);
  }

});
