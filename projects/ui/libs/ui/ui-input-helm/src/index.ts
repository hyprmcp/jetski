import { NgModule } from '@angular/core';
import { HlmInput } from './lib/hlm-input.directive';

export * from './lib/hlm-input.directive';

@NgModule({
  imports: [HlmInput],
  exports: [HlmInput],
})
export class HlmInputModule {}
