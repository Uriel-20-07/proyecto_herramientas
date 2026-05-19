import { Routes } from '@angular/router';
import { BlogComponent } from './pages/blog/blog.component';
import { InicioComponent } from './pages/inicio';
import { CatalogoComponent } from './pages/catalogo/catalogo';
import { CarritoComponent } from './pages/carrito/carrito';
<<<<<<< Updated upstream
import { LoginComponent } from './components/login/login.component';
=======

>>>>>>> Stashed changes
import { RegistroComponent } from './components/registro/registro.component';
import { RecuperarContraseñaComponent } from './components/recuperar-contrasena/recuperar-contrasena.component';
import { OfertasComponent } from './pages/ofertas/ofertas';
import { MarcasComponent } from './pages/marcas/marcas';
import { NosotrosComponent } from './pages/nosotros/nosotros';

export const routes: Routes = [

  { path: '', component: InicioComponent },

  { path: 'blog', component: BlogComponent },
  { path: 'catalogo', component: CatalogoComponent },
  { path: 'carrito', component: CarritoComponent },

  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },

  { path: 'recuperar-contrasena', component: RecuperarContraseñaComponent },
  { path: 'reset-password/:token', component: RecuperarContraseñaComponent },

  { path: 'ofertas', component: OfertasComponent },
  { path: 'marcas', component: MarcasComponent },
  { path: 'nosotros', component: NosotrosComponent },
  { path: 'perfil', component: LoginComponent },
  { path: 'favoritos', component: LoginComponent },
  { path: 'pedidos', component: LoginComponent },

<<<<<<< Updated upstream
  { path: '**', component: InicioComponent }
=======
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
>>>>>>> Stashed changes

];