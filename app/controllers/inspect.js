import Controller from '@ember/controller';
import { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';

export default Controller.extend({

  application: controller(),
  storage: service(),

  currentDirPath: alias('application.currentDirPath'),

  queryParams: ['path'],

});
