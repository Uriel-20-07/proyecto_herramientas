import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroCarouselComponent } from '../components/hero-carousel/hero-carousel';
import { ProductCarouselComponent } from '../components/product-carousel/product-carousel';

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
export class InicioComponent { }