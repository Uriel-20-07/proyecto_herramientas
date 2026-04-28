import { Routes } from '@angular/router';
import { InicioComponent } from './inicio';
import { BlogComponent } from './blog/blog.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'blog', component: BlogComponent },
];