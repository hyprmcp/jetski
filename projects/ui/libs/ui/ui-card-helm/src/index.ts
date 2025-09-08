import { NgModule } from '@angular/core';

import { HlmCardContent } from './lib/hlm-card-content.directive';
import { HlmCardDescription } from './lib/hlm-card-description.directive';
import { HlmCardFooter } from './lib/hlm-card-footer.directive';
import { HlmCardHeader } from './lib/hlm-card-header.directive';
import { HlmCardTitle } from './lib/hlm-card-title.directive';
import { HlmCard } from './lib/hlm-card.directive';

export * from './lib/hlm-card-content.directive';
export * from './lib/hlm-card-description.directive';
export * from './lib/hlm-card-footer.directive';
export * from './lib/hlm-card-header.directive';
export * from './lib/hlm-card-title.directive';
export * from './lib/hlm-card.directive';

export const HlmCardImports = [
  HlmCard,
  HlmCardHeader,
  HlmCardFooter,
  HlmCardTitle,
  HlmCardDescription,
  HlmCardContent,
] as const;

@NgModule({
  imports: [...HlmCardImports],
  exports: [...HlmCardImports],
})
export class HlmCardModule {}
