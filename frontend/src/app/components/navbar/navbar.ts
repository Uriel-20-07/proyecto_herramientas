import { AsyncPipe } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthModalService } from '../../services/auth-modal.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [AsyncPipe, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  readonly currentUser$;
  readonly cartCount$;
  dropdownAbierto = false;
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

  constructor(
    private readonly authModalService: AuthModalService,
    private readonly authService: AuthService,
    private readonly cartService: CartService,
    private readonly router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.cartCount$ = this.cartService.items$;
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

  seleccionarCategoria(cat: string): void {
    const queryParams: Record<string, string> = {};

    if (cat !== 'Todo') {
      queryParams['categoria'] = cat;
    }

    this.router.navigate(['/catalogo'], { queryParams });
    this.dropdownAbierto = false;
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownAbierto = !this.dropdownAbierto;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.dropdownAbierto = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  getCartCount(counts: Array<{ cantidad: number }> | null): number {
    return counts?.reduce((total, item) => total + item.cantidad, 0) ?? 0;
  }

  getCartTotal(items: Array<{ producto: any, cantidad: number }> | null): string {
    const total = items?.reduce(
      (acc, item) => acc + Number(item.producto.precioVenta) * item.cantidad,
      0
    ) ?? 0;
    return total.toFixed(2);
  }
}