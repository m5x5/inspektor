import Controller from '@ember/controller';
import EmberObject from '@ember/object';
import { computed, observer } from '@ember/object';
import { service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { isEmpty } from '@ember/utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default Controller.extend({

  storage: service(),

  connecting: alias('storage.connecting'),
  connected: alias('storage.connected'),
  userAddress: alias('storage.userAddress'),
  rootListing: alias('storage.rootListing'),
  currentDirPath: null,
  isDownloading: false,
  isSidebarOpen: false,

  connectedClass: computed('connected', function() {
    return this.get('connected') ? 'connected' : 'disconnected';
  }),

  categories: computed('rootListing', function() {
    let categories = [];
    let rootListing = this.get('rootListing');
    if (isEmpty(rootListing)) { return categories; }

    rootListing.forEach(item => {
      if (!item.isFolder) { return; }

      categories.push(EmberObject.create({
        name: item.name.replace('/', ''),
        type: item.type,
        path: item.name
      }));
    });

    return categories;
  }),

  connectedChange: observer('connected', function() {
    if (this.get('connected')) {
      // console.debug('connectedChange connected');
    } else {
      this.set('currentDirPath', null);
    }
  }),

  init() {
    this._super(...arguments);
    this.downloadAllData = this.downloadAllData.bind(this);
  },

  async downloadAllData() {
    if (!this.get('connected')) {
      alert('Please connect to your remoteStorage account first.');
      return;
    }

    this.set('isDownloading', true);

    try {
      const zip = new JSZip();
      const client = this.get('storage.client');

      // Recursive function to process directories
      const processDirectory = async (path) => {
        const listing = await client.getListing(path);

        for (const itemName in listing) {
          const itemPath = path + itemName;
          const item = listing[itemName];

          if (item['Content-Type'] === 'folder') {
            // Recursively process subdirectory
            await processDirectory(itemPath);
          } else {
            // Skip .folder marker files
            if (itemName === '.folder') {
              continue;
            }

            // Download file content
            try {
              const fileData = await client.getFile(itemPath);

              if (fileData && fileData.data) {
                // Remove leading slash from path for zip
                const zipPath = itemPath.startsWith('/') ? itemPath.substring(1) : itemPath;

                // Add file to zip
                if (typeof fileData.data === 'string') {
                  zip.file(zipPath, fileData.data);
                } else {
                  // Handle binary data (ArrayBuffer or Uint8Array)
                  zip.file(zipPath, fileData.data);
                }
              }
            } catch (error) {
              console.error(`Failed to download file ${itemPath}:`, error);
            }
          }
        }
      };

      // Start from root
      await processDirectory('/');

      // Generate zip file
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Save zip file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const userAddress = this.get('userAddress') || 'remotestorage';
      const filename = `${userAddress}_${timestamp}.zip`;

      saveAs(blob, filename);

      alert('Download complete!');
    } catch (error) {
      console.error('Failed to download data:', error);
      alert('Failed to download data. Please check the console for details.');
    } finally {
      this.set('isDownloading', false);
    }
  },

  actions: {
    toggleSidebar() {
      this.toggleProperty('isSidebarOpen');
    },

    closeSidebar() {
      this.set('isSidebarOpen', false);
    }
  }

});
