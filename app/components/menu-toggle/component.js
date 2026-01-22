import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class MenuToggleComponent extends Component {
  // This component displays a hamburger menu button for mobile navigation

  @action
  handleClick(event) {
    if (this.args.onClick) {
      this.args.onClick(event);
    }
  }
}
