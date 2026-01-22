import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class BottomNavComponent extends Component {
  // This component displays a mobile-friendly bottom navigation bar
  // with Material You design principles

  @action
  addRipple(event) {
    const button = event.currentTarget;
    const ripple = button.querySelector('.ripple');

    if (ripple) {
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple-active');

      setTimeout(() => {
        ripple.classList.remove('ripple-active');
      }, 600);
    }
  }
}
