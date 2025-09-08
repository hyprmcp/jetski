import { NgModule } from '@angular/core';

import {
  HlmCaption,
  HlmTable,
  HlmTBody,
  HlmTd,
  HlmTFoot,
  HlmTh,
  HlmTHead,
  HlmTr,
} from './lib/hlm-table.directive';

export * from './lib/hlm-table.directive';

export const HlmTableImports = [
  HlmCaption,
  HlmTable,
  HlmTBody,
  HlmTd,
  HlmTFoot,
  HlmTh,
  HlmTHead,
  HlmTr,
] as const;

@NgModule({
  imports: [...HlmTableImports],
  exports: [...HlmTableImports],
})
export class HlmTableModule {}
