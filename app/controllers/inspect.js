import Controller from '@ember/controller';
import { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';

export default Controller.extend({

  application: controller(),
  storage: service(),

  currentDirPath: alias('application.currentDirPath'),

  queryParams: ['path'],

  actions: {

    deleteItem () {
      if (window.confirm('Sure?')) {
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

  }

});
