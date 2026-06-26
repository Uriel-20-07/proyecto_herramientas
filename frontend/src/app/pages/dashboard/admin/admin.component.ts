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
  styleUrl: './admin.component.css',
})
export class AdminDashboardComponent implements OnInit {
  activeTab: 'resumen' | 'ventas' | 'inventario' | 'predicciones' = 'resumen';
  adminUser: any = null;

  productos: any[] = [];
  ventas: any[] = [];
  stats: any[] = [];

  searchCliente = '';
  searchProducto = '';

  totalVentas = 0;
  ticketPromedio = 0;
  totalPedidos = 0;
  bajoStockCount = 0;

  selectedVenta: any = null;

  // Variables Lotes
  selectedProductoLotes: any = null;
  lotesProductoActual: any[] = [];
  nuevoLote = { codigoLote: '', cantidadActual: 0, fechaVencimiento: '' };
  loadingLotes = false;

  // Variables Predicción
  topSemana: any[] = [];
  topMes: any[] = [];
  maxTopSemana: number = 0;
  maxTopMes: number = 0;

  chartPath = '';
  chartAreaPath = '';
  chartPoints: { x: number; y: number; date: string; value: number }[] = [];
  selectedPoint: any = null;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private authModalService: AuthModalService,
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
    this.adminService.getProductos().subscribe({
      next: (data: any[]) => {
        this.productos = data;
        this.bajoStockCount = this.productos.filter((p) => p.stock < 60).length;
      },
      error: (err: any) => console.error(err),
    });

    this.adminService.getVentas().subscribe({
      next: (data: any[]) => {
        this.ventas = data;
        this.calcularMetricasVentas();
      },
      error: (err: any) => console.error(err),
    });

    this.adminService.getStats().subscribe({
      next: (data: any[]) => {
        this.stats = data;
        this.generarGrafico();
      },
      error: (err: any) => console.error(err),
    });

    // Cargar predicciones
    this.adminService.getTopProductos('semana').subscribe({
      next: (data) => {
        this.topSemana = data;
        this.maxTopSemana = Math.max(...data.map((d) => d.cantidad), 1);
      },
    });

    this.adminService.getTopProductos('mes').subscribe({
      next: (data) => {
        this.topMes = data;
        this.maxTopMes = Math.max(...data.map((d) => d.cantidad), 1);
      },
    });
  }

  // Semáforo de Lotes Visual
  getVencimientoClass(fecha: string): string {
    if (!fecha) return '';
    const expDate = new Date(fecha);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'status-vencido';
    if (diffDays <= 180) return 'status-alerta';
    return 'status-seguro';
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
    const bottomY = height + paddingTop;
    const maxVal = Math.max(...this.stats.map((s) => s.totalVentas), 10);
    const n = this.stats.length;

    this.chartPoints = this.stats.map((s, i) => {
      const x = n > 1 ? (i / (n - 1)) * width + paddingLeft : paddingLeft + width / 2;
      const y = bottomY - (s.totalVentas / maxVal) * height;
      return { x, y, date: s.fecha, value: s.totalVentas };
    });

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
    return this.ventas.filter(
      (v) =>
        v.usuario.nombre.toLowerCase().includes(query) ||
        v.usuario.apellido.toLowerCase().includes(query),
    );
  }

  get filteredProductos(): any[] {
    if (!this.searchProducto) return this.productos;
    const query = this.searchProducto.toLowerCase();
    return this.productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(query) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(query)),
    );
  }

  setTab(tab: 'resumen' | 'ventas' | 'inventario' | 'predicciones'): void {
    this.activeTab = tab;
  }
  showVentaDetails(venta: any): void {
    this.selectedVenta = venta;
  }
  closeVentaDetails(): void {
    this.selectedVenta = null;
  }
  hoverPoint(point: any): void {
    this.selectedPoint = point;
  }
  leavePoint(): void {
    this.selectedPoint = null;
  }

  openLotesModal(producto: any): void {
    this.selectedProductoLotes = producto;
    this.nuevoLote = { codigoLote: '', cantidadActual: 0, fechaVencimiento: '' };
    this.adminService.getLotes(producto.idProducto).subscribe({
      next: (lotes) => (this.lotesProductoActual = lotes),
      error: (err) => console.error('Error al cargar lotes', err),
    });
  }

  closeLotesModal(): void {
    this.selectedProductoLotes = null;
    this.cargarDatos();
  }

  guardarLote(): void {
    if (
      this.nuevoLote.cantidadActual <= 0 ||
      !this.nuevoLote.codigoLote ||
      !this.nuevoLote.fechaVencimiento
    )
      return;
    this.loadingLotes = true;
    this.adminService.agregarLote(this.selectedProductoLotes.idProducto, this.nuevoLote).subscribe({
      next: (loteGuardado) => {
        this.lotesProductoActual.push(loteGuardado);
        this.nuevoLote = { codigoLote: '', cantidadActual: 0, fechaVencimiento: '' };
        this.loadingLotes = false;
      },
      error: (err) => {
        this.loadingLotes = false;
        alert('Error al guardar el lote');
      },
    });
  }

  eliminarLote(lote: any): void {
    const idParaEliminar = lote.idLote || lote.idlote;
    if (!idParaEliminar) return;

    if (confirm(`¿Estás seguro de que deseas eliminar el lote ${lote.codigoLote}?`)) {
      this.adminService.eliminarLote(idParaEliminar).subscribe({
        next: () => {
          this.lotesProductoActual = this.lotesProductoActual.filter(
            (l) => (l.idLote || l.idlote) !== idParaEliminar,
          );
          this.cargarDatos();
        },
        error: (err) => {
          alert(`Error del servidor: ${err.status} - Revisa la consola`);
        },
      });
    }
  }

  logout(): void {
    this.adminService.logout();
    this.router.navigate(['/']);
    this.authModalService.open('login');
  }

  // =========================================================================
  // REPORTE PDF PREMIUM COMPLETO (Nombre de Archivo Integrado con Chrome)
  // =========================================================================
  descargarReporte(tipo: 'semana' | 'mes'): void {
    if (typeof window === 'undefined') return;

    // Guardar el título original de la pestaña para restaurarlo luego
    const tituloOriginalPestana = document.title;

    // Definir el nombre exacto con el que se guardará el archivo PDF
    const nombreArchivoPDF =
      tipo === 'semana' ? 'REPORTE_SEMANAL_FARMACODE' : 'REPORTE_MENSUAL_FARMACODE';

    // Cambiar temporalmente el título del documento principal (Chrome usa esto para nombrar el archivo descargado)
    document.title = nombreArchivoPDF;

    const tituloReporte =
      tipo === 'semana' ? 'REPORTE SEMANAL DE ROTACIÓN' : 'REPORTE MENSUAL DE ROTACIÓN';
    const subtitulo =
      tipo === 'semana'
        ? 'Productos con mayor salida en los últimos 7 días.'
        : 'Consolidado de ventas a 30 días para abastecimiento de laboratorios.';
    const datosReporte = tipo === 'semana' ? this.topSemana : this.topMes;

    const fechaActual = new Date().toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let filasHtml = '';
    datosReporte.forEach((item, index) => {
      filasHtml += `
        <tr>
          <td class="center" style="font-weight: 600; color: #64748b;"># ${index + 1}</td>
          <td class="bold" style="color: #1a1c28;">${item.nombre}</td>
          <td class="center"><span class="highlight">${item.cantidad} unidades</span></td>
        </tr>
      `;
    });

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>${nombreArchivoPDF}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            @page { size: A4; margin: 0; }
            * { box-sizing: border-box; }
            body { 
              font-family: 'Inter', sans-serif; color: #1a1c28; margin: 0; padding: 0;
              -webkit-print-color-adjust: exact; print-color-adjust: exact;
            }
            .page-container {
              width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto;
              position: relative; background-color: #ffffff;
            }
            .top-border-bar { height: 6px; background-color: #1a1c28; width: 100%; margin-bottom: 25px; }
            .header-pdf { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #00f2fe; padding-bottom: 15px; margin-bottom: 30px; }
            .logo-brand { font-size: 24px; font-weight: 700; color: #1a1c28; margin: 0; }
            .logo-brand span { color: #00f2fe; }
            .meta-info { text-align: right; font-size: 11px; color: #64748b; line-height: 1.5; }
            h1 { font-size: 18px; color: #1a1c28; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .sub-h1 { font-size: 12px; color: #64748b; margin-bottom: 25px; }
            .summary-box { background: #f8fafc; border-left: 4px solid #00f2fe; padding: 15px 20px; margin-bottom: 30px; font-size: 12px; line-height: 1.6; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #1a1c28; color: #ffffff; font-weight: 600; font-size: 11px; text-transform: uppercase; padding: 12px 15px; text-align: left; }
            td { padding: 14px 15px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            tr:nth-child(even) { background: #f8fafc; }
            .bold { font-weight: 600; }
            .center { text-align: center; }
            .highlight { color: #0ea5e9; font-weight: 700; }
            .footer-pdf { position: absolute; bottom: 30px; left: 20mm; right: 20mm; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="top-border-bar"></div>
            <div class="header-pdf">
              <div class="logo-brand">FarmaCode</div>
              <div class="meta-info">
                <div><strong>Operador:</strong> ${this.adminUser?.nombre || 'Admin'}</div>
                <div><strong>Emisión:</strong> ${fechaActual}</div>
              </div>
            </div>
            <h1>${tituloReporte}</h1>
            <div class="sub-h1">${subtitulo}</div>
            <div class="summary-box">
              <strong>Análisis de Demanda Farmacéutica:</strong><br>
              La siguiente tabla enumera los productos de mayor rotación dentro del ciclo evaluado. Se recomienda utilizar esta información métrica para optimizar el reabastecimiento (algoritmo FEFO) y mitigar quiebres de stock.
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 15%; text-align: center;">Ranking</th>
                  <th style="width: 60%;">Producto / Medicamento</th>
                  <th style="width: 25%; text-align: center;">Volumen de Salida</th>
                </tr>
              </thead>
              <tbody>${filasHtml}</tbody>
            </table>
            <div class="footer-pdf">
              FarmaCode - Sistema de Inteligencia de Negocios y Predicción de Demanda.<br>Documento interno estrictamente confidencial.
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Restaurar el título original de la pestaña inmediatamente después de abrir la ventana de impresión
      document.title = tituloOriginalPestana;

      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 400);
  }
}
