'use strict';

import Mixin from '@ember/object/mixin';
import { inject as service } from '@ember/service';
import $ from 'jquery';

export default Mixin.create({
  router: service(),

  actions: {
    loading() {
      if (!$) { return true; }
      $('body').addClass('loading');
      this.router.on('didTransition', function() {
        $('body').removeClass('loading');
      });
      return true;
    },

    error() {
      if (!$) { return true; }
      $('body').addClass('error');
      this.router.on('didTransition', function() {
        $('body').removeClass('error');
      });
      return true;
    }
  }
});

