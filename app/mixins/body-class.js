'use strict';

import Mixin from '@ember/object/mixin';

function addBodyClass(name) {
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.add(name);
  }
}

function removeBodyClass(name) {
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.remove(name);
  }
}

export default Mixin.create({
  actions: {
    loading(transition) {
      addBodyClass('loading');
      const cleanup = () => removeBodyClass('loading');
      if (transition && transition.promise && typeof transition.promise.finally === 'function') {
        transition.promise.finally(cleanup);
      } else if (transition && transition.promise) {
        transition.promise.then(cleanup).catch(cleanup);
      } else {
        // Fallback in case transition isn't available
        setTimeout(cleanup, 0);
      }
      return true;
    },

    error(error, transition) {
      addBodyClass('error');
      const cleanup = () => removeBodyClass('error');
      if (transition && transition.promise && typeof transition.promise.finally === 'function') {
        transition.promise.finally(cleanup);
      } else if (transition && transition.promise) {
        transition.promise.then(cleanup).catch(cleanup);
      } else {
        setTimeout(cleanup, 0);
      }
      return true;
    }
  }
});
