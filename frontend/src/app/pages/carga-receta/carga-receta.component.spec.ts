import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CargaRecetaComponent } from './carga-receta.component';
import { RecetasService } from '../../services/recetas.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('CargaRecetaComponent', () => {
  let component: CargaRecetaComponent;
  let fixture: ComponentFixture<CargaRecetaComponent>;
  let mockRecetasService: jasmine.SpyObj<RecetasService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockRecetasService = jasmine.createSpyObj('RecetasService', ['cargarReceta']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CargaRecetaComponent, FormsModule],
      providers: [
        { provide: RecetasService, useValue: mockRecetasService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CargaRecetaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add a medication field', () => {
    const initialLength = component.nuevaReceta.medicamentos.length;
    component.agregarMedicamento();
    expect(component.nuevaReceta.medicamentos.length).toBe(initialLength + 1);
  });

  it('should show error if required fields are empty', () => {
    component.nuevaReceta.pacienteId = '';
    component.enviarReceta();
    expect(component.mensajeError).toContain('complete todos los campos');
    expect(mockRecetasService.cargarReceta).not.toHaveBeenCalled();
  });

  it('should call cargarReceta on valid submission', () => {
    component.nuevaReceta = {
      pacienteId: 'P123',
      medicoId: 'M456',
      medicamentos: [{ nombre: 'Paracetamol', dosis: '500mg' }],
      fechaEmision: '2026-07-12',
      estado: 'en_espera'
    };
    mockRecetasService.cargarReceta.and.returnValue(of({ ...component.nuevaReceta, id: 'REC001' }));

    component.enviarReceta();

    expect(mockRecetasService.cargarReceta).toHaveBeenCalled();
    expect(component.mensajeExito).toContain('en espera de revisión');
  });

  it('should show error message on failed submission', () => {
    component.nuevaReceta = {
      pacienteId: 'P123',
      medicoId: 'M456',
      medicamentos: [{ nombre: 'Paracetamol', dosis: '500mg' }],
      fechaEmision: '2026-07-12',
      estado: 'en_espera'
    };
    mockRecetasService.cargarReceta.and.returnValue(throwError(() => new Error('fail')));

    component.enviarReceta();

    expect(component.mensajeError).toContain('Error al enviar');
  });
});