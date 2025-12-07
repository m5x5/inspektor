import Controller from '@ember/controller';
import { inject as controller } from '@ember/controller';
import { service } from '@ember/service';
import { computed, observer } from '@ember/object';
import { alias } from '@ember/object/computed';
import { isPresent, isEmpty } from '@ember/utils';
import { all } from 'rsvp';

export default Controller.extend({

  application: controller(),
  storage: service(),

  connected: alias('storage.connected'),
  rootListing: alias('storage.rootListing'),
  currentDirPath: alias('application.currentDirPath'),

  queryParams: ['path'],

  currentListing: computed('rootListing.[]', 'model.[]', function () {
    if (isPresent(this.get('model.currentListing'))) {
      const listing = this.get('model.currentListing');
      if (Array.isArray(listing) && listing.sortBy) {
        return listing.sortBy('name');
      } else if (Array.isArray(listing)) {
        return listing.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } else {
        return listing;
      }
    } else {
      return this.get('rootListing');
    }
  }),

  documents: computed('currentListing.[]', function () {
    if (isEmpty(this.get('currentListing'))) { return []; }

    const currentListing = this.get('currentListing');
    if (Array.isArray(currentListing)) {
      return currentListing.filter(item => item.path.substr(-1) !== '/');
    } else {
      return [];
    }
  }),

  currentListingContainsDocuments: computed('documents.[]', function () {
    return isPresent(this.get('documents'));
  }),

  documentCount: computed('documents.[]', function () {
    if (isPresent(this.get('documents'))) {
      return this.get('documents').length;
    } else {
      return 0;
    }
  }),

  parentDir: computed('currentDirPath', function () {
    const dirs = this.get('currentDirPath')
      .split('/')
      .filter(p => !isEmpty(p));

    return dirs.splice(0, dirs.length - 1).join('/') + '/';
  }),

  connectedChange: observer('connected', function () {
    if (this.get('connected')) {
      // console.debug('connectedChange connected');
    } else {
      this.set('model', null);
      this.set('path', null);
    }
  }),

  showCreateFolder: false,
  showCreateFile: false,
  newFolderName: '',
  newFileName: '',
  newFileContent: '',

  init() {
    this._super(...arguments);
    this.deleteDocuments = this.deleteDocuments.bind(this);
    this.toggleCreateFolder = this.toggleCreateFolder.bind(this);
    this.toggleCreateFile = this.toggleCreateFile.bind(this);
    this.createFolder = this.createFolder.bind(this);
    this.createFile = this.createFile.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.handleFileUpload = this.handleFileUpload.bind(this);
    this.stopPropagation = this.stopPropagation.bind(this);
  },

  stopPropagation(event) {
    event.stopPropagation();
  },

  toggleCreateFolder() {
    this.toggleProperty('showCreateFolder');
    this.set('newFolderName', '');
  },

  toggleCreateFile() {
    this.toggleProperty('showCreateFile');
    this.set('newFileName', '');
    this.set('newFileContent', '');
  },

  createFolder() {
    const folderName = this.get('newFolderName').trim();
    if (!folderName) {
      alert('Please enter a folder name');
      return;
    }

    const currentPath = this.get('currentDirPath') || '';
    const folderPath = currentPath + folderName + '/';

    // Create an empty .folder file to initialize the folder
    const client = this.get('storage.client');
    client.storeFile('text/plain', folderPath + '.folder', '')
      .then(() => {
        this.set('showCreateFolder', false);
        this.set('newFolderName', '');
        // Refresh the listing
        if (currentPath === '' || currentPath === '/') {
          return this.get('storage').fetchRootListing();
        } else {
          return this.get('storage').fetchListing(currentPath).then(listing => {
            if (Array.isArray(listing) && listing.sortBy) {
              this.set('model.currentListing', listing.sortBy('name'));
            } else if (Array.isArray(listing)) {
              this.set('model.currentListing', listing.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
            } else {
              this.set('model.currentListing', listing);
            }
            this.notifyPropertyChange('model');
          });
        }
      })
      .catch(err => {
        alert('Failed to create folder. Check the console for more info.');
        console.error(err);
      });
  },

  createFile() {
    const fileName = this.get('newFileName').trim();
    if (!fileName) {
      alert('Please enter a file name');
      return;
    }

    const currentPath = this.get('currentDirPath') || '';
    const filePath = currentPath + fileName;
    const content = this.get('newFileContent') || '';

    const client = this.get('storage.client');
    client.storeFile('text/plain', filePath, content)
      .then(() => {
        this.set('showCreateFile', false);
        this.set('newFileName', '');
        this.set('newFileContent', '');
        // Refresh the listing
        if (currentPath === '' || currentPath === '/') {
          return this.get('storage').fetchRootListing();
        } else {
          return this.get('storage').fetchListing(currentPath).then(listing => {
            if (Array.isArray(listing) && listing.sortBy) {
              this.set('model.currentListing', listing.sortBy('name'));
            } else if (Array.isArray(listing)) {
              this.set('model.currentListing', listing.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
            } else {
              this.set('model.currentListing', listing);
            }
            this.notifyPropertyChange('model');
          });
        }
      })
      .catch(err => {
        alert('Failed to create file. Check the console for more info.');
        console.error(err);
      });
  },

  uploadFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = this.handleFileUpload;
    input.click();
  },

  handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentPath = this.get('currentDirPath') || '';
    const client = this.get('storage.client');
    const promises = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      const promise = new Promise((resolve, reject) => {
        reader.onload = (e) => {
          const filePath = currentPath + file.name;
          const content = e.target.result;
          const contentType = file.type || 'application/octet-stream';

          client.storeFile(contentType, filePath, content)
            .then(resolve)
            .catch(reject);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      promises.push(promise);
    }

    all(promises)
      .then(() => {
        // Refresh the listing
        if (currentPath === '' || currentPath === '/') {
          return this.get('storage').fetchRootListing();
        } else {
          return this.get('storage').fetchListing(currentPath).then(listing => {
            if (Array.isArray(listing) && listing.sortBy) {
              this.set('model.currentListing', listing.sortBy('name'));
            } else if (Array.isArray(listing)) {
              this.set('model.currentListing', listing.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
            } else {
              this.set('model.currentListing', listing);
            }
            this.notifyPropertyChange('model');
          });
        }
      })
      .catch(err => {
        alert('Failed to upload file(s). Check the console for more info.');
        console.error(err);
      });
  },

  deleteDocuments() {
    const documentCount = this.get('documentCount');
    const msg = `Delete all ${documentCount} documents/files in the current directory?`;
    if (!window.confirm(msg)) { return false; }

    const client = this.get('storage.client');
    const currentPath = this.get('currentDirPath') || '';

    let promises = this.get('documents').map(item => {
      console.debug('removing ' + item.path);
      return client.remove(item.path);
    });

    all(promises).then(() => {
      // Refresh the current listing instead of navigating
      if (currentPath === '' || currentPath === '/') {
        return this.get('storage').fetchRootListing();
      } else {
        return this.get('storage').fetchListing(currentPath).then(listing => {
          if (Array.isArray(listing) && listing.sortBy) {
            this.set('model.currentListing', listing.sortBy('name'));
          } else if (Array.isArray(listing)) {
            this.set('model.currentListing', listing.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
          } else {
            this.set('model.currentListing', listing);
          }
          this.notifyPropertyChange('model');
        });
      }
    }).catch(err => {
      alert('Failed to delete file(s). Check the console for more info.');
      console.error(err);
    });
  }

});
