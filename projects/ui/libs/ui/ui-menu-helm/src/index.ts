import { NgModule } from '@angular/core';

import { HlmMenuBarItem } from './lib/hlm-menu-bar-item.directive';
import { HlmMenuBar } from './lib/hlm-menu-bar.component';
import { HlmMenuGroup } from './lib/hlm-menu-group.component';
import { HlmMenuItemCheck } from './lib/hlm-menu-item-check.component';
import { HlmMenuItemCheckbox } from './lib/hlm-menu-item-checkbox.directive';
import { HlmMenuItemIcon } from './lib/hlm-menu-item-icon.directive';
import { HlmMenuItemRadioIndicator } from './lib/hlm-menu-item-radio.component';
import { HlmMenuItemRadio } from './lib/hlm-menu-item-radio.directive';
import { HlmMenuItemSubIndicator } from './lib/hlm-menu-item-sub-indicator.component';
import { HlmMenuItem } from './lib/hlm-menu-item.directive';
import { HlmMenuLabel } from './lib/hlm-menu-label.component';
import { HlmMenuSeparator } from './lib/hlm-menu-separator.component';
import { HlmMenuShortcut } from './lib/hlm-menu-shortcut.component';
import { HlmMenu } from './lib/hlm-menu.component';
import { HlmSubMenu } from './lib/hlm-sub-menu.component';

export * from './lib/hlm-menu-bar-item.directive';
export * from './lib/hlm-menu-bar.component';
export * from './lib/hlm-menu-group.component';
export * from './lib/hlm-menu-item-check.component';
export * from './lib/hlm-menu-item-checkbox.directive';
export * from './lib/hlm-menu-item-icon.directive';
export * from './lib/hlm-menu-item-radio.component';
export * from './lib/hlm-menu-item-radio.directive';
export * from './lib/hlm-menu-item-sub-indicator.component';
export * from './lib/hlm-menu-item.directive';
export * from './lib/hlm-menu-label.component';
export * from './lib/hlm-menu-separator.component';
export * from './lib/hlm-menu-shortcut.component';
export * from './lib/hlm-menu.component';
export * from './lib/hlm-sub-menu.component';

export const HlmMenuItemImports = [
  HlmMenuItem,
  HlmMenuItemIcon,
  HlmMenuGroup,
  HlmMenuItemSubIndicator,
  HlmMenuItemRadioIndicator,
  HlmMenuItemCheck,
  HlmMenuShortcut,
  HlmMenuItemCheckbox,
  HlmMenuItemRadio,
];
export const HlmMenuStructureImports = [
  HlmMenuLabel,
  HlmMenuSeparator,
] as const;
export const HlmMenuImports = [
  ...HlmMenuItemImports,
  ...HlmMenuStructureImports,
  HlmMenu,
  HlmSubMenu,
] as const;
export const HlmMenuBarImports = [
  ...HlmMenuImports,
  HlmMenuBar,
  HlmMenuBarItem,
] as const;

@NgModule({
  imports: [...HlmMenuItemImports],
  exports: [...HlmMenuItemImports],
})
export class HlmMenuItemModule {}

@NgModule({
  imports: [...HlmMenuImports],
  exports: [...HlmMenuImports],
})
export class HlmMenuModule {}

@NgModule({
  imports: [...HlmMenuBarImports],
  exports: [...HlmMenuBarImports],
})
export class HlmMenuBarModule {}
