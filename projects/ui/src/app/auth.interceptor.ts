import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { catchError, EMPTY, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const oauthService = inject(OAuthService);

  if (isApiRequest(req.url)) {
    return next(req).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          oauthService.logOut();
          window.location.reload();
          return EMPTY;
        }
        return throwError(() => error);
      }),
    );
  } else {
    return next(req);
  }
};

function isApiRequest(url: string): boolean {
  // all api requests are local URLs
  return url.startsWith('/api/');
}
