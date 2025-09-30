import { BrnMenuGroup } from '@spartan-ng/brain/menu';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'hlm-menu-group',
  host: {
    class: 'block',
  },
  hostDirectives: [BrnMenuGroup],
  template: ` <ng-content /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HlmMenuGroup {}
