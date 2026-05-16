import { Routes } from '@angular/router';
import { BlogComponent } from './pages/blog/blog.component';
import { CatalogoComponent } from './pages/catalogo/catalogo';
import { CarritoComponent } from './pages/carrito/carrito';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { RecuperarContraseñaComponent } from './components/recuperar-contrasena/recuperar-contrasena.component';
import { OfertasComponent } from './pages/ofertas/ofertas';
import { MarcasComponent } from './pages/marcas/marcas';
import { NosotrosComponent } from './pages/nosotros/nosotros';

export const routes: Routes = [

  { path: '', component: BlogComponent },

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

  { path: '**', component: BlogComponent }

];