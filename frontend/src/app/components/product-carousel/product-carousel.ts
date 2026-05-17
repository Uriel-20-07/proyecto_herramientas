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
      badgeColor: '#ea580c',
      image: 'https://dcuk1cxrnzjkh.cloudfront.net/imagesproducto/038166L.jpg'
    },
    {
      name: 'Toallitas Húmedas Huggies Cuidado 4 en 1',
      size: 'BOLSA 240 UN',
      price: 33.90,
      oldPrice: null,
      badge: '¡SOLO POR TIEMPO LIMITADO!',
      badgeColor: '#dc2626',
      image: 'https://dcuk1cxrnzjkh.cloudfront.net/imagesproducto/037902L.jpg'
    },
    {
      name: 'Pañales Ninet Suave Cuidado Talla S',
      size: 'BOLSA 60 UN',
      price: 31.90,
      oldPrice: 34.90,
      badge: null,
      badgeColor: null,
      image: 'https://dcuk1cxrnzjkh.cloudfront.net/imagesproducto/032606L.jpg'
    },
    {
      name: 'Pañal Recién Nacido Huggies Natural Care',
      size: 'BOLSA 20 UN',
      price: 11.90,
      oldPrice: 13.90,
      badge: null,
      badgeColor: null,
      image: 'https://dcuk1cxrnzjkh.cloudfront.net/imagesproducto/PACKMB300L.jpg'
    },
    {
      name: 'Vitamina C 1000mg Efervescente',
      size: 'CAJA 10 UN',
      price: 19.90,
      oldPrice: null,
      badge: null,
      badgeColor: null,
      image: 'https://dcuk1cxrnzjkh.cloudfront.net/imagesproducto/PACKNT32L.jpg'
    },
    {
      name: 'Alcohol Gel Antibacterial 500ml',
      size: 'FRASCO 500 ML',
      price: 12.50,
      oldPrice: 15.00,
      badge: null,
      badgeColor: null,
      image: 'https://lineaebriel.com.pe/wp-content/uploads/2020/09/GEL-ALCOHOL-500-ML-1-1.jpg'
    },
    {
      name: 'Ibuprofeno 400mg',
      size: 'CAJA 20 UN',
      price: 8.90,
      oldPrice: null,
      badge: null,
      badgeColor: null,
      image: 'https://dcuk1cxrnzjkh.cloudfront.net/imagesproducto/230447L.jpg'
    },
    {
      name: 'Termómetro Digital Infrarrojo',
      size: 'UNIDAD',
      price: 45.90,
      oldPrice: 55.00,
      badge: 'OFERTA',
      badgeColor: '#0056B3',
      image: 'https://media.falabella.com/falabellaPE/118391047_01/w=1200,h=1200,fit=pad'
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