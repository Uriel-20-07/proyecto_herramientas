import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/pages/app.config'; // Agregado /pages/
import { AppComponent } from './app/pages/app';     // Agregado /pages/ y corregido a AppComponent

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));