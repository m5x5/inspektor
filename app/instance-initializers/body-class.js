'use strict';

import Route from '@ember/routing/route';
import { on } from '@ember/object/evented';
import $ from 'jquery';

export function initialize(instance) {
  // Skip when jQuery is not present (e.g., FastBoot)
  if (!$) { return; }

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
      const $body = $('body');
      ['bodyClasses', 'classNames'].forEach((classes) => {
        (this.get(classes) || []).forEach(function(klass) {
          $body.addClass(klass);
        });
      });

      if (includeRouteName) {
        this._getRouteDepthClasses().forEach((depthClass) => {
          $body.addClass(depthClass);
        });
      }
    }),

    removeClasses: on('deactivate', function() {
      const $body = $('body');
      ['bodyClasses', 'classNames'].forEach((classes) => {
        (this.get(classes) || []).forEach(function(klass) {
          $body.removeClass(klass);
        });
      });

      if (includeRouteName) {
        this._getRouteDepthClasses().forEach((depthClass) => {
          $body.removeClass(depthClass);
        });
      }
    }),
  });
}

export default {
  name: 'body-class',
  initialize
};
