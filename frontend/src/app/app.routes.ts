import { Routes } from '@angular/router';

import { BlogComponent } from './pages/blog/blog.component';
import { InicioComponent } from './pages/inicio';

import { CatalogoComponent } from './pages/catalogo/catalogo';
import { CarritoComponent } from './pages/carrito/carrito';

import { LoginComponent } from './components/login/login.component';

import { RegistroComponent } from './components/registro/registro.component';
import { RecuperarContraseñaComponent } from './components/recuperar-contrasena/recuperar-contrasena.component';

import { OfertasComponent } from './pages/ofertas/ofertas';
import { MarcasComponent } from './pages/marcas/marcas';
import { NosotrosComponent } from './pages/nosotros/nosotros';

import { PerfilComponent } from './pages/perfil/perfil';

export const routes: Routes = [

  // INICIO

  {
    path: '',
    component: InicioComponent
  },

  // PÁGINAS

  {
    path: 'blog',
    component: BlogComponent
  },

  {
    path: 'catalogo',
    component: CatalogoComponent
  },

  {
    path: 'carrito',
    component: CarritoComponent
  },

  {
    path: 'ofertas',
    component: OfertasComponent
  },

  {
    path: 'marcas',
    component: MarcasComponent
  },

  {
    path: 'nosotros',
    component: NosotrosComponent
  },

  {
    path: 'perfil',
    component: PerfilComponent
  },

  // AUTH

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'registro',
    component: RegistroComponent
  },

  {
    path: 'recuperar-contrasena',
    component: RecuperarContraseñaComponent
  },

  {
    path: 'reset-password/:token',
    component: RecuperarContraseñaComponent
  },

  // FUTURO

  {
    path: 'favoritos',
    component: LoginComponent
  },

  {
    path: 'pedidos',
    component: LoginComponent
  },

  // 404

  { path: '**', component: InicioComponent }
  {
    path: 'carrito',
    component: CarritoComponent
  },

  {
    path: 'ofertas',
    component: OfertasComponent
  },

  {
    path: 'marcas',
    component: MarcasComponent
  },

  {
    path: 'nosotros',
    component: NosotrosComponent
  },

  {
    path: 'perfil',
    component: PerfilComponent
  },

  // AUTH (using modal)

  {
    path: 'registro',
    component: RegistroComponent
  },

  {
    path: 'recuperar-contrasena',
    component: RecuperarContraseñaComponent
  },

  {
    path: 'reset-password/:token',
    component: RecuperarContraseñaComponent
  },

  // FUTURO

  {
    path: 'favoritos',
    redirectTo: '',
    pathMatch: 'full'
  },

  {
    path: 'pedidos',
    redirectTo: '',
    pathMatch: 'full'
  },

  // 404

  {
    path: '**',
    component: InicioComponent
  }

];