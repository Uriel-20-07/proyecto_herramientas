import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AuthModalMode = 'login' | 'registro' | 'recuperar';

@Injectable({
  providedIn: 'root'
})
export class AuthModalService {
  private readonly openSubject = new BehaviorSubject<boolean>(false);
  private readonly modeSubject = new BehaviorSubject<AuthModalMode>('login');

  readonly open$ = this.openSubject.asObservable();
  readonly mode$ = this.modeSubject.asObservable();

  open(mode: AuthModalMode = 'login'): void {
    this.modeSubject.next(mode);
    this.openSubject.next(true);
  }

  close(): void {
    this.openSubject.next(false);
  }

  setMode(mode: AuthModalMode): void {
    this.modeSubject.next(mode);
  }
}