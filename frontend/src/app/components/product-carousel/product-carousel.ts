import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-carousel.html'
})
export class ProductCarouselComponent {

  products = [
    {
      name: 'Geriaplus DB Inmunoact Polvo Sabor Vainilla',
      size: 'FRASCO 1000 GR',
      price: 89.90,
      oldPrice: null,
      badge: '3x2 AGREGA 3 PAGA 2',
      badgeColor: '#ea580c'
    },
    {
      name: 'Toallitas Húmedas Huggies Cuidado 4 en 1',
      size: 'BOLSA 240 UN',
      price: 33.90,
      oldPrice: null,
      badge: '¡SOLO POR TIEMPO LIMITADO!',
      badgeColor: '#dc2626'
    },
    {
      name: 'Pañales Ninet Suave Cuidado Talla S',
      size: 'BOLSA 60 UN',
      price: 31.90,
      oldPrice: 34.90,
      badge: null,
      badgeColor: null
    },
    {
      name: 'Pañal Recién Nacido Huggies Natural Care',
      size: 'BOLSA 20 UN',
      price: 11.90,
      oldPrice: 13.90,
      badge: null,
      badgeColor: null
    },
    {
      name: 'Vitamina C 1000mg Efervescente',
      size: 'CAJA 10 UN',
      price: 19.90,
      oldPrice: null,
      badge: null,
      badgeColor: null
    },
    {
      name: 'Alcohol Gel Antibacterial 500ml',
      size: 'FRASCO 500 ML',
      price: 12.50,
      oldPrice: 15.00,
      badge: null,
      badgeColor: null
    },
    {
      name: 'Ibuprofeno 400mg',
      size: 'CAJA 20 UN',
      price: 8.90,
      oldPrice: null,
      badge: null,
      badgeColor: null
    },
    {
      name: 'Termómetro Digital Infrarrojo',
      size: 'UNIDAD',
      price: 45.90,
      oldPrice: 55.00,
      badge: 'OFERTA',
      badgeColor: '#0056B3'
    }
  ];

  get chunkedProducts(): any[][] {
    const chunks = [];
    for (let i = 0; i < this.products.length; i += 4) {
      chunks.push(this.products.slice(i, i + 4));
    }
    return chunks;
  }
}