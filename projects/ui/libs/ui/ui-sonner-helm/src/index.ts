import { NgModule } from '@angular/core';

import { HlmToaster } from './lib/hlm-toaster.component';

export * from './lib/hlm-toaster.component';

export const HlmToasterImports = [HlmToaster] as const;

@NgModule({
  imports: [...HlmToasterImports],
  exports: [...HlmToasterImports],
})
export class HlmToasterModule {}
