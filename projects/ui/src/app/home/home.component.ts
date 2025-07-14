import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Component({
  template: ` <h1>Hello, {{ user.value() }}</h1> `,
})
export class HomeComponent {
  user = httpResource.text(() => `/api/v1/whoami`);
}
