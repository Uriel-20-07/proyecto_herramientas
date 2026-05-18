import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CatalogoService, MarcaApi } from '../../services/catalogo.service';

@Component({
  selector: 'app-marcas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './marcas.html',
  styleUrls: ['./marcas.css']
})
export class MarcasComponent implements OnInit {
  marcas: MarcaApi[] = [];

  constructor(
    private catalogoService: CatalogoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.catalogoService.getMarcas().subscribe({
      next: (data) => {
        this.marcas = data;
      },
      error: (err) => {
        console.error('Error al obtener marcas:', err);
      }
    });
  }

  filtrarPorMarca(idMarca: number): void {
    this.router.navigate(['/catalogo'], { queryParams: { marca: idMarca } });
  }
}