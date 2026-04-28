import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Producto {
  id: number;
  nombre: string;
  unidad: string;
  precioOriginal?: number;
  precioActual: number;
  imagen: string;
  etiquetaPromo?: string;
  colorPromo?: 'orange' | 'red';
}

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogo.html',
  styleUrls: ['./catalogo.css']
})
export class CatalogoComponent {
  productos: Producto[] = [
    {
      id: 1,
      nombre: 'Genaplus DB InmunoAct Polvo Sabor Vainilla',
      unidad: 'FRASCO 1000 GR',
      precioActual: 89.90,
      imagen: 'assets/img/producto1.png',
      etiquetaPromo: '3x2 AGREGA 3 PAGA 2',
      colorPromo: 'orange'
    },
    {
      id: 2,
      nombre: 'Toallitas Húmedas Huggies Cuidado 4 en 1',
      unidad: 'BOLSA 240 UN',
      precioActual: 33.90,
      imagen: 'assets/img/producto2.png',
      etiquetaPromo: 'S/ 31.90 Ex',
      colorPromo: 'red'
    },
    {
      id: 3,
      nombre: 'Pañales Ninet Suave Cuidado Talla 8',
      unidad: 'BOLSA 50 UN',
      precioOriginal: 44.90,
      precioActual: 31.90,
      imagen: 'assets/img/producto3.png'
    },
    {
      id: 4,
      nombre: 'Pañal Recién Nacido Huggies Natural Care',
      unidad: 'BOLSA 20 UN',
      precioOriginal: 16.50,
      precioActual: 11.90,
      imagen: 'assets/img/producto4.png'
    }
  ];
}