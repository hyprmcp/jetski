import { Validators } from '@angular/forms';

export const validateResourceName = Validators.pattern(
  /^[a-z0-9]+(-[a-z0-9]+)*$/,
);

export const validateDomain = Validators.pattern(/^([a-z0-9]+\.)+[a-z0-9]+$/);
