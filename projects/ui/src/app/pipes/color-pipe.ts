import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'color' })
export class ColorPipe implements PipeTransform {
  transform(value: number): string {
    console.log('ColorPipe transform called with value:', value);
    switch (value % 16) {
      case 0:
        return 'bg-blue-500';
      case 1:
        return 'bg-emerald-500';
      case 2:
        return 'bg-violet-500';
      case 3:
        return 'bg-red-500';
      case 4:
        return 'bg-amber-500';
      case 5:
        return 'bg-orange-500';
      case 6:
        return 'bg-teal-500';
      case 7:
        return 'bg-indigo-500';
      case 8:
        return 'bg-amber-600';
      case 9:
        return 'bg-pink-500';
      case 10:
        return 'bg-violet-500';
      case 11:
        return 'bg-orange-600';
      case 12:
        return 'bg-cyan-500';
      case 13:
        return 'bg-violet-400';
      case 14:
        return 'bg-rose-500';
      case 15:
        return 'bg-lime-500';
      default:
        return 'bg-black';
    }
  }
}
