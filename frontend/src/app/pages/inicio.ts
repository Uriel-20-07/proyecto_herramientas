import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroCarouselComponent } from '../components/hero-carousel/hero-carousel';
import { ProductCarouselComponent } from '../components/product-carousel/product-carousel';
import { ComboService } from '../services/combo.service';
import { CartService } from '../services/cart.service';

@Component({
    selector: 'app-inicio',
    standalone: true,
    imports: [
        CommonModule,
        HeroCarouselComponent,
        ProductCarouselComponent
    ],
    templateUrl: './inicio.html'
})
export class InicioComponent {
    combosActivos: any[] = [];

    constructor(
        private readonly comboService: ComboService,
        private readonly cartService: CartService
    ) { }

    ngOnInit(): void {
        this.comboService.obtenerCombosActivos().subscribe({
            next: (combos: any[]) => {
                this.combosActivos = combos;
            },
            error: (err: any) => console.error('Error al cargar combos activos para inicio', err)
        });
    }

    agregarComboAlCarrito(combo: any): void {
        // Agregar producto principal
        this.cartService.add(combo.productoPrincipal);

        // Agregar producto asociado con el 10% de descuento
        const prodAsociadoDescuento = { ...combo.productoAsociado };
        const precioOriginal = Number(prodAsociadoDescuento.precioVenta);
        prodAsociadoDescuento.precioVenta = precioOriginal * 0.9; // 10% de descuento
        prodAsociadoDescuento.nombre = `${prodAsociadoDescuento.nombre} (Combo 10% desc.)`;

        this.cartService.add(prodAsociadoDescuento);
    }
}