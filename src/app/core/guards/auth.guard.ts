import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Si ya tenemos usuario en memoria, dejamos pasar
  if (auth.usuario()) return true;

  // Si no, preguntamos al backend si hay sesión activa
  return auth.me().pipe(
    map(() => true),
    catchError(() => {
      router.navigate(['/login'], {
        queryParams: { redirect: state.url },
      });
      return of(false);
    })
  );
};