import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio';
import { BlogComponent } from './pages/blog/blog.component';
import { CatalogoComponent } from './pages/catalogo/catalogo';
import { CarritoComponent } from './pages/carrito/carrito';
import { OfertasComponent } from './pages/ofertas/ofertas';
import { MarcasComponent } from './pages/marcas/marcas';
import { NosotrosComponent } from './pages/nosotros/nosotros';
import { PerfilComponent } from './pages/perfil/perfil';
import { RecuperarContraseñaComponent } from './components/recuperar-contrasena/recuperar-contrasena.component';
import { PagoComponent } from './pages/pago/pago';

export const routes: Routes = [
  { path: '', component: InicioComponent, pathMatch: 'full' },
  { path: 'blog', component: BlogComponent },
  { path: 'catalogo', component: CatalogoComponent },
  { path: 'carrito', component: CarritoComponent },
  { path: 'pago', component: PagoComponent }, // Nuestra ruta
  { path: 'ofertas', component: OfertasComponent },
  { path: 'marcas', component: MarcasComponent },
  { path: 'nosotros', component: NosotrosComponent },
  { path: 'perfil', component: PerfilComponent },
  { path: 'login', redirectTo: '', pathMatch: 'full' },
  { path: 'registro', redirectTo: '', pathMatch: 'full' },
  { path: 'recuperar-contrasena', component: RecuperarContraseñaComponent },
  { path: 'reset-password/:token', component: RecuperarContraseñaComponent },
  { path: 'favoritos', redirectTo: '', pathMatch: 'full' },
  { path: 'pedidos', redirectTo: '', pathMatch: 'full' },
  { path: '**', component: InicioComponent },
];
