import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { AuthModalService } from '../../../services/auth-modal.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminDashboardComponent implements OnInit {
  activeTab: 'resumen' | 'ventas' | 'inventario' = 'resumen';
  adminUser: any = null;

  // Stats y Datos
  productos: any[] = [];
  ventas: any[] = [];
  stats: any[] = [];

  // Filtros de búsqueda
  searchCliente = '';
  searchProducto = '';

  // Métricas generales
  totalVentas = 0;
  ticketPromedio = 0;
  totalPedidos = 0;
  bajoStockCount = 0;

  // Modales
  selectedVenta: any = null;
  selectedProductoStock: any = null;
  stockInput = 0;
  loadingStockSubmit = false;

  // SVG Chart values
  chartPath = '';
  chartAreaPath = '';
  chartPoints: { x: number, y: number, date: string, value: number }[] = [];
  selectedPoint: any = null;

  constructor(
    private adminService: AdminService, 
    private router: Router,
    private authModalService: AuthModalService
  ) {}

  ngOnInit(): void {
    if (!this.adminService.isAuthenticated() || !this.adminService.isAdmin()) {
      this.router.navigate(['/']);
      this.authModalService.open('login');
      return;
    }
    
    this.adminUser = this.adminService.getCurrentUser();
    this.cargarDatos();
  }

  cargarDatos(): void {
    // Cargar productos
    this.adminService.getProductos().subscribe({
      next: (data: any[]) => {
        this.productos = data;
        this.bajoStockCount = this.productos.filter(p => p.stock < 60).length;
      },
      error: (err: any) => console.error(err)
    });

    // Cargar ventas
    this.adminService.getVentas().subscribe({
      next: (data: any[]) => {
        this.ventas = data;
        this.calcularMetricasVentas();
      },
      error: (err: any) => console.error(err)
    });

    // Cargar stats
    this.adminService.getStats().subscribe({
      next: (data: any[]) => {
        this.stats = data;
        this.generarGrafico();
      },
      error: (err: any) => console.error(err)
    });
  }

  calcularMetricasVentas(): void {
    this.totalPedidos = this.ventas.length;
    this.totalVentas = this.ventas.reduce((acc, v) => acc + v.total, 0);
    this.ticketPromedio = this.totalPedidos > 0 ? this.totalVentas / this.totalPedidos : 0;
  }

  generarGrafico(): void {
    if (this.stats.length === 0) return;

    const width = 400;
    const height = 140;
    const paddingLeft = 40;
    const paddingTop = 20;
    const bottomY = height + paddingTop; // 160

    const maxVal = Math.max(...this.stats.map(s => s.totalVentas), 10);
    const n = this.stats.length;

    this.chartPoints = this.stats.map((s, i) => {
      const x = n > 1 ? (i / (n - 1)) * width + paddingLeft : paddingLeft + width / 2;
      const y = bottomY - (s.totalVentas / maxVal) * height;
      return { x, y, date: s.fecha, value: s.totalVentas };
    });

    // Crear caminos de línea SVG
    if (this.chartPoints.length > 0) {
      let pathString = `M ${this.chartPoints[0].x} ${this.chartPoints[0].y}`;
      let areaString = `M ${this.chartPoints[0].x} ${bottomY} L ${this.chartPoints[0].x} ${this.chartPoints[0].y}`;
      
      for (let i = 1; i < this.chartPoints.length; i++) {
        pathString += ` L ${this.chartPoints[i].x} ${this.chartPoints[i].y}`;
        areaString += ` L ${this.chartPoints[i].x} ${this.chartPoints[i].y}`;
      }
      
      areaString += ` L ${this.chartPoints[this.chartPoints.length - 1].x} ${bottomY} Z`;
      
      this.chartPath = pathString;
      this.chartAreaPath = areaString;
    }
  }

  get filteredVentas(): any[] {
    if (!this.searchCliente) return this.ventas;
    const query = this.searchCliente.toLowerCase();
    return this.ventas.filter(v => 
      v.usuario.nombre.toLowerCase().includes(query) || 
      v.usuario.apellido.toLowerCase().includes(query)
    );
  }

  get filteredProductos(): any[] {
    if (!this.searchProducto) return this.productos;
    const query = this.searchProducto.toLowerCase();
    return this.productos.filter(p => 
      p.nombre.toLowerCase().includes(query) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(query))
    );
  }

  setTab(tab: 'resumen' | 'ventas' | 'inventario'): void {
    this.activeTab = tab;
  }

  showVentaDetails(venta: any): void {
    this.selectedVenta = venta;
  }

  closeVentaDetails(): void {
    this.selectedVenta = null;
  }

  openEditStock(producto: any): void {
    this.selectedProductoStock = producto;
    this.stockInput = producto.stock;
  }

  closeEditStock(): void {
    this.selectedProductoStock = null;
  }

  incrementStock(): void {
    this.stockInput++;
  }

  decrementStock(): void {
    if (this.stockInput > 0) {
      this.stockInput--;
    }
  }

  submitStock(): void {
    if (this.stockInput < 0) return;
    this.loadingStockSubmit = true;
    this.adminService.actualizarStock(this.selectedProductoStock.idProducto, this.stockInput).subscribe({
      next: (updatedProd: any) => {
        this.loadingStockSubmit = false;
        const idx = this.productos.findIndex(p => p.idProducto === updatedProd.idProducto);
        if (idx !== -1) {
          this.productos[idx] = updatedProd;
        }
        this.bajoStockCount = this.productos.filter(p => p.stock < 60).length;
        this.closeEditStock();
      },
      error: (err: any) => {
        this.loadingStockSubmit = false;
        alert(err.error?.error || 'Error al actualizar el stock');
      }
    });
  }

  hoverPoint(point: any): void {
    this.selectedPoint = point;
  }

  leavePoint(): void {
    this.selectedPoint = null;
  }

  logout(): void {
    this.adminService.logout();
    this.router.navigate(['/']);
    this.authModalService.open('login');
  }
}
