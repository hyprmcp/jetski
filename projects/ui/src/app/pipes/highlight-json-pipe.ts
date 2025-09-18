import { Pipe, PipeTransform } from '@angular/core';
import hljs from 'highlight.js/lib/core';
import hljsJson from 'highlight.js/lib/languages/json';

hljs.registerLanguage('json', hljsJson);

@Pipe({
  name: 'hljson',
})
export class HighlightJsonPipe implements PipeTransform {
  public transform(value: unknown): string {
    return hljs.highlight(JSON.stringify(value, null, 2), {
      language: 'json',
    }).value;
  }
}
