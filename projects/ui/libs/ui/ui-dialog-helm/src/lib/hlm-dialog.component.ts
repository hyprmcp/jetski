import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  ViewEncapsulation,
} from "@angular/core";
import {
  BrnDialog,
  BrnDialogOverlay,
  provideBrnDialogDefaultOptions,
} from "@spartan-ng/brain/dialog";
import { HlmDialogOverlayDirective } from "./hlm-dialog-overlay.directive";

@Component({
  selector: "hlm-dialog",
  imports: [BrnDialogOverlay, HlmDialogOverlayDirective],
  providers: [
    {
      provide: BrnDialog,
      useExisting: forwardRef(() => HlmDialogComponent),
    },
    provideBrnDialogDefaultOptions({
      // add custom options here
    }),
  ],
  template: `
    <brn-dialog-overlay hlm />
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "hlmDialog",
})
export class HlmDialogComponent extends BrnDialog {}
