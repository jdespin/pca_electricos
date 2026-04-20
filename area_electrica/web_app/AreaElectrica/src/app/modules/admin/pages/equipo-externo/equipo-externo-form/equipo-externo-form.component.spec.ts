import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipoExternoFormComponent } from './equipo-externo-form.component';

describe('EquipoExternoFormComponent', () => {
  let component: EquipoExternoFormComponent;
  let fixture: ComponentFixture<EquipoExternoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipoExternoFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipoExternoFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
