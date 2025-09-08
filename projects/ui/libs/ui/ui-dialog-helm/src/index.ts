import { NgModule } from '@angular/core';

import { HlmDialogClose } from './lib/hlm-dialog-close.directive';
import { HlmDialogContent } from './lib/hlm-dialog-content.component';
import { HlmDialogDescription } from './lib/hlm-dialog-description.directive';
import { HlmDialogFooter } from './lib/hlm-dialog-footer.component';
import { HlmDialogHeader } from './lib/hlm-dialog-header.component';
import { HlmDialogOverlay } from './lib/hlm-dialog-overlay.directive';
import { HlmDialogTitle } from './lib/hlm-dialog-title.directive';
import { HlmDialog } from './lib/hlm-dialog.component';

export * from './lib/hlm-dialog-close.directive';
export * from './lib/hlm-dialog-content.component';
export * from './lib/hlm-dialog-description.directive';
export * from './lib/hlm-dialog-footer.component';
export * from './lib/hlm-dialog-header.component';
export * from './lib/hlm-dialog-overlay.directive';
export * from './lib/hlm-dialog-title.directive';
export * from './lib/hlm-dialog.component';
export * from './lib/hlm-dialog.service';

export const HlmDialogImports = [
  HlmDialog,
  HlmDialogClose,
  HlmDialogContent,
  HlmDialogDescription,
  HlmDialogFooter,
  HlmDialogHeader,
  HlmDialogOverlay,
  HlmDialogTitle,
] as const;

@NgModule({
  imports: [...HlmDialogImports],
  exports: [...HlmDialogImports],
})
export class HlmDialogModule {}
