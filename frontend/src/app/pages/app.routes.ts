import { Routes } from '@angular/router';
import { InicioComponent } from './inicio';
import { BlogComponent } from './blog/blog.component';
import { CatalogoComponent } from './catalogo/catalogo'; 

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'catalogo', component: CatalogoComponent }
];