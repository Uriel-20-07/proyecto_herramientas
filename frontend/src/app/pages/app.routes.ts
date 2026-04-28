import { Routes } from '@angular/router';
import { InicioComponent } from './inicio'; // Tu importación original

// Importación corregida: apuntamos directamente a la carpeta catalogo
import { CatalogoComponent } from './catalogo/catalogo'; 

export const routes: Routes = [
  { path: '', component: InicioComponent }, // Tu ruta de inicio original que no tocamos
  { path: 'catalogo', component: CatalogoComponent }, // La nueva ruta
];