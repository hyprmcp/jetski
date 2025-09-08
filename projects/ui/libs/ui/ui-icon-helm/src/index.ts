import { NgModule } from '@angular/core';
import { HlmIcon } from './lib/hlm-icon.directive';

export * from './lib/hlm-icon.directive';
export * from './lib/hlm-icon.token';

@NgModule({
  imports: [HlmIcon],
  exports: [HlmIcon],
})
export class HlmIconModule {}
