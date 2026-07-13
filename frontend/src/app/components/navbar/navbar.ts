import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthModalService } from '../../services/auth-modal.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { CatalogoService, ProductoApi } from '../../services/catalogo.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, FormsModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit {
  readonly currentUser$;
  readonly cartCount$;
  categorias = [
    'Todo',
    'MEDICAMENTOS',
    'CUIDADO PERSONAL',
    'BELLEZA',
    'BEBÉ',
    'VITAMINAS / SUPLEMENTOS',
    'EQUIPOS MÉDICOS'
  ];
  categoriaSeleccionada = 'Todo';
  terminoBusqueda = '';

  // Propiedades para sugerencias de búsqueda
  productosList: ProductoApi[] = [];
  sugerencias: any[] = [];
  mostrarSugerencias = false;

  // Propiedades para menú de categorías
  dropdownAbierto = false;

  constructor(
    private readonly authModalService: AuthModalService,
    private readonly authService: AuthService,
    private readonly cartService: CartService,
    private readonly router: Router,
    private readonly catalogoService: CatalogoService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.cartCount$ = this.cartService.items$;
  }

  ngOnInit(): void {
    this.catalogoService.getProductos().subscribe({
      next: (productos) => {
        this.productosList = productos;
      },
      error: (err) => {
        console.error('Error al cargar productos para sugerencias', err);
      }
    });
  }

  openLogin(): void {
    this.authModalService.open('login');
  }

  openRegister(): void {
    this.authModalService.open('registro');
  }

  goToPerfil(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/perfil']);
    } else {
      this.authModalService.open('login');
    }
  }

  buscarCatalogo(): void {
    const queryParams: Record<string, string> = {};

    if (this.terminoBusqueda.trim()) {
      queryParams['q'] = this.terminoBusqueda.trim();
    }

    if (this.categoriaSeleccionada !== 'Todo') {
      queryParams['categoria'] = this.categoriaSeleccionada;
    }

    this.router.navigate(['/catalogo'], { queryParams });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  getCartCount(counts: Array<{ cantidad: number }> | null): number {
    return counts?.reduce((total, item) => total + item.cantidad, 0) ?? 0;
  }

  getCartTotal(): string {
    return this.cartService.getTotal().toFixed(2);
  }

  // Lógica de sugerencias de búsqueda
  onBusquedaInput(): void {
    const query = this.terminoBusqueda.trim().toLowerCase();
    if (!query) {
      this.sugerencias = [];
      this.mostrarSugerencias = false;
      return;
    }

    const filtered = this.productosList.filter((prod) => {
      const matchName = prod.nombre.toLowerCase().includes(query);
      const matchCat = prod.categoria?.nombre.toLowerCase().includes(query) ?? false;
      const matchDesc = prod.descripcion?.toLowerCase().includes(query) ?? false;
      const matchSeleccionada = this.categoriaSeleccionada === 'Todo' ||
        prod.categoria?.nombre.toLowerCase() === this.categoriaSeleccionada.toLowerCase();

      return matchSeleccionada && (matchName || matchCat || matchDesc);
    });

    this.sugerencias = filtered.slice(0, 5).map((prod) => ({
      objectID: prod.idProducto,
      idProducto: prod.idProducto,
      nombre: prod.nombre,
      categoriaNombre: prod.categoria?.nombre ?? 'General',
      precioVenta: prod.precioVenta,
      imgUrl: prod.imgUrl,
      productoOriginal: prod
    }));

    this.mostrarSugerencias = this.sugerencias.length > 0;
  }

  seleccionarSugerencia(sug: any): void {
    this.terminoBusqueda = sug.nombre;
    this.mostrarSugerencias = false;
    this.buscarCatalogo();
  }

  hasDiscount(sug: any): boolean {
    return sug.categoriaNombre === 'MEDICAMENTOS';
  }

  getFinalPrice(sug: any): number {
    if (this.hasDiscount(sug)) {
      return Number(sug.precioVenta) * 0.9; // 10% de descuento
    }
    return Number(sug.precioVenta);
  }

  agregarDesdeSugerencia(sug: any, event: Event): void {
    event.stopPropagation();
    if (sug.productoOriginal) {
      this.cartService.add(sug.productoOriginal);
    }
    this.mostrarSugerencias = false;
  }

  // Lógica del menú de categorías
  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownAbierto = !this.dropdownAbierto;
  }

  seleccionarCategoria(categoria: string): void {
    this.categoriaSeleccionada = categoria;
    this.dropdownAbierto = false;
    this.buscarCatalogo();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.fc-search-wrapper')) {
      this.mostrarSugerencias = false;
    }
    if (!target.closest('.cats-dropdown-wrapper')) {
      this.dropdownAbierto = false;
    }
  }
}
