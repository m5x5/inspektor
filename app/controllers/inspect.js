import Controller from '@ember/controller';
import { inject as controller } from '@ember/controller';
import { service } from '@ember/service';
import { computed } from '@ember/object';
import { alias, not, equal } from '@ember/object/computed';
import { isEmpty } from '@ember/utils';

export default Controller.extend({

  application: controller(),
  storage: service(),

  currentDirPath: alias('application.currentDirPath'),

  queryParams: ['path'],

  // documentIsEditable: computed.not('model.documentMetaData.isBinary'),
  documentIsEditable: alias('documentIsJSON'),

  documentShowEditor: false,
  documentHideEditor: not('documentShowEditor'),

  documentIsJSON: computed('model.documentMetaData.type', function(){
    if (isEmpty(this.get('model.documentMetaData'))) { return false; }

    return !!this.get('model.documentMetaData.type').match(/application\/json/i);
  }),

  jsonView: 'tree',
  jsonShowTree: equal('jsonView', 'tree'),
  jsonShowSource: equal('jsonView', 'source'),

  publicItemURL: computed('model.documentMetaData.path', function(){
    let path = this.get('model.documentMetaData.path');

    if (path.match(/public\//)) {
      return this.get('storage.client').getItemURL(path);
    } else {
      return null;
    }
  }),

  metadataHidden: false,

  init() {
    this._super(...arguments);
    this.showJsonTree = this.showJsonTree.bind(this);
    this.showJsonSource = this.showJsonSource.bind(this);
    this.showEditor = this.showEditor.bind(this);
    this.cancelEditor = this.cancelEditor.bind(this);
    this.toggleMetadata = this.toggleMetadata.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
  },

  showJsonTree() {
    this.set('jsonView', 'tree');
  },

  showJsonSource() {
    this.set('jsonView', 'source');
  },

  showEditor() {
    this.set('documentShowEditor', true);
  },

  cancelEditor() {
    this.set('documentShowEditor', false);
    // TODO remove changes from tree/source
  },

  toggleMetadata() {
    this.toggleProperty('metadataHidden');
  },

  deleteItem() {
    if (window.confirm('Delete?')) {
      this.get('storage.client')
          .remove(this.get('path')).then(() => {
            this.transitionToRoute('index', {
              queryParams: {
                path: this.get('currentDirPath')
              }
            });
          });
    }
  }

});
