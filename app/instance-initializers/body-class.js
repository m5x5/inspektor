'use strict';

import Route from '@ember/routing/route';
import { on } from '@ember/object/evented';
// Removed jQuery usage to be Ember 4+ compatible

export function initialize(instance) {

  let config;
  if (typeof instance.resolveRegistration === 'function') {
    config = instance.resolveRegistration('config:environment');
  } else {
    config = instance.container.lookupFactory('config:environment');
  }

  let includeRouteName = true;
  if (config['ember-body-class'] && config['ember-body-class'].includeRouteName === false) {
    includeRouteName = false;
  }

  function addBodyClass(klass) {
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.add(klass);
    }
  }

  function removeBodyClass(klass) {
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.remove(klass);
    }
  }

  Route.reopen({
    classNames: null,
    bodyClasses: null,

    _getRouteDepthClasses() {
      let routeParts = this.get('routeName').split('.');
      let routeDepthClasses = routeParts.slice(0);
      let currentSelector = [];

      routeParts.forEach((part) => {
        currentSelector.push(part);
        routeDepthClasses.push(currentSelector.join('-'));
      });

      return routeDepthClasses;
    },

    addClasses: on('activate', function() {
      ['bodyClasses', 'classNames'].forEach((classes) => {
        (this.get(classes) || []).forEach(function(klass) {
          addBodyClass(klass);
        });
      });

      if (includeRouteName) {
        this._getRouteDepthClasses().forEach((depthClass) => {
          addBodyClass(depthClass);
        });
      }
    }),

    removeClasses: on('deactivate', function() {
      ['bodyClasses', 'classNames'].forEach((classes) => {
        (this.get(classes) || []).forEach(function(klass) {
          removeBodyClass(klass);
        });
      });

      if (includeRouteName) {
        this._getRouteDepthClasses().forEach((depthClass) => {
          removeBodyClass(depthClass);
        });
      }
    }),
  });
}

export default {
  name: 'body-class',
  initialize
};
