import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-timestamp-cell',
  template: ` <span>{{ timestamp | date: 'medium' }}</span> `,
  imports: [DatePipe],
})
export class TimestampCellComponent {
  @Input() timestamp!: string | Date | number;
}
