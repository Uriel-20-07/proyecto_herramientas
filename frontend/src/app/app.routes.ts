import { InicioComponent } from './pages/inicio';
import { BlogComponent } from './pages/blog/blog.component';
import { CatalogoComponent } from './pages/catalogo/catalogo';
import { CarritoComponent } from './pages/carrito/carrito';
import { MarcasComponent } from './pages/marcas/marcas';
import { NosotrosComponent } from './pages/nosotros/nosotros';
import { PerfilComponent } from './pages/perfil/perfil';
import { PagoComponent } from './pages/pago/pago';
import { AdminDashboardComponent } from './pages/dashboard/admin/admin.component';
import { VendedorDashboardComponent } from './pages/dashboard/vendedor/vendedor.component';
import { RecuperarContraseñaComponent } from './components/recuperar-contrasena/recuperar-contrasena.component';
import { PedidosComponent } from './pages/pedidos/pedidos';
import { ProductoDetalleComponent } from './pages/producto-detalle/producto-detalle';
import { FavoritosComponent } from './pages/favoritos/favoritos';
import { SeguimientoPedidoComponent } from './pages/seguimiento-pedido/seguimiento-pedido';
import { CargaRecetaComponent } from './pages/carga-receta/carga-receta.component';

// Usamos any[] temporalmente para saltarnos el bug de detección del compilador
export const routes: any[] = [
  // Dashboards de administración
  { path: 'dashboard/admin', redirectTo: 'dashboard/admin/resumen', pathMatch: 'full' },
  { path: 'dashboard/admin/:tab', component: AdminDashboardComponent },
  { path: 'dashboard/vendedor', component: VendedorDashboardComponent },

  // Página principal
  { path: '', component: InicioComponent, pathMatch: 'full' },

  // Flujo de recetas médicas
  { path: 'cargar-receta', component: CargaRecetaComponent },

  // Páginas del catálogo y comercio
  { path: 'blog', component: BlogComponent },
  { path: 'catalogo', component: CatalogoComponent },
  { path: 'catalogo/producto', component: ProductoDetalleComponent },
  { path: 'catalogo/producto/:id', component: ProductoDetalleComponent },
  { path: 'carrito', component: CarritoComponent },
  { path: 'pago', component: PagoComponent }, 

  // Páginas informativas
  { path: 'marcas', component: MarcasComponent },
  { path: 'nosotros', component: NosotrosComponent },

  // Perfil del usuario autenticado
  { path: 'perfil', component: PerfilComponent },

  // Flujo de recuperación de contraseña
  { path: 'recuperar-contrasena', component: RecuperarContraseñaComponent },
  { path: 'reset-password/:token', component: RecuperarContraseñaComponent }, 

  // Rutas que redirigen a inicio (Modales)
  { path: 'login', redirectTo: '', pathMatch: 'full' }, 
  { path: 'registro', redirectTo: '', pathMatch: 'full' }, 
  { path: 'favoritos', component: FavoritosComponent },
  { path: 'pedidos', component: PedidosComponent },
  { path: 'pedidos/pedido/:id/seguimiento', component: SeguimientoPedidoComponent },

  // Wildcard: cualquier ruta no definida → redirige a inicio
  { path: '**', redirectTo: '', pathMatch: 'full' }
];