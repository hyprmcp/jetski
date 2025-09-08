import { NgModule } from '@angular/core';
import { HlmSelectContent } from './lib/hlm-select-content.directive';
import { HlmSelectGroup } from './lib/hlm-select-group.directive';
import { HlmSelectLabel } from './lib/hlm-select-label.directive';
import { HlmSelectOption } from './lib/hlm-select-option.component';
import { HlmSelectScrollDown } from './lib/hlm-select-scroll-down.component';
import { HlmSelectScrollUp } from './lib/hlm-select-scroll-up.component';
import { HlmSelectTrigger } from './lib/hlm-select-trigger.component';
import { HlmSelectValueTemplate } from './lib/hlm-select-value.directive';
import { HlmSelect } from './lib/hlm-select.directive';

export * from './lib/hlm-select-content.directive';
export * from './lib/hlm-select-group.directive';
export * from './lib/hlm-select-label.directive';
export * from './lib/hlm-select-option.component';
export * from './lib/hlm-select-scroll-down.component';
export * from './lib/hlm-select-scroll-up.component';
export * from './lib/hlm-select-trigger.component';
export * from './lib/hlm-select-value.directive';
export * from './lib/hlm-select.directive';

export const HlmSelectImports = [
  HlmSelectContent,
  HlmSelectTrigger,
  HlmSelectOption,
  HlmSelectValueTemplate,
  HlmSelect,
  HlmSelectScrollUp,
  HlmSelectScrollDown,
  HlmSelectLabel,
  HlmSelectGroup,
] as const;

@NgModule({
  imports: [...HlmSelectImports],
  exports: [...HlmSelectImports],
})
export class HlmSelectModule {}
