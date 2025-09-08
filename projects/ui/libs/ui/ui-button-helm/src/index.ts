import { NgModule } from '@angular/core';
import { HlmButton } from './lib/hlm-button.directive';
export * from './lib/hlm-button.token';

export * from './lib/hlm-button.directive';

@NgModule({
  imports: [HlmButton],
  exports: [HlmButton],
})
export class HlmButtonModule {}
