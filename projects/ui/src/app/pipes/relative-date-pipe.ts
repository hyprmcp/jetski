import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';

@Pipe({ name: 'relativeDate' })
export class RelativeDatePipe implements PipeTransform {
  transform(value: dayjs.ConfigType): string {
    const d = dayjs(value);
    if (d.isBefore()) {
      return dayjs(value).fromNow();
    } else {
      return dayjs(value).toNow();
    }
  }
}
