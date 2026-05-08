import { Routes } from '@angular/router';
import { BlogComponent } from './pages/blog/blog.component';
import { CatalogoComponent } from './pages/catalogo/catalogo';
import { CarritoComponent } from './pages/carrito/carrito';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { RecuperarContraseñaComponent } from './components/recuperar-contrasena/recuperar-contrasena.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'blog' },
  { path: 'blog', component: BlogComponent },
  { path: 'catalogo', component: CatalogoComponent },
  { path: 'carrito', component: CarritoComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'recuperar-contrasena', component: RecuperarContraseñaComponent },
  { path: 'reset-password/:token', component: RecuperarContraseñaComponent },
  { path: 'ofertas', redirectTo: 'catalogo' },
  { path: 'marcas', redirectTo: 'catalogo' },
  { path: 'nosotros', redirectTo: 'blog' },
  { path: 'perfil', redirectTo: 'login' },
  { path: 'favoritos', redirectTo: 'login' },
  { path: 'pedidos', redirectTo: 'login' },
  { path: '**', redirectTo: '' }
];
