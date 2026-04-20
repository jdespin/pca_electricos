import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipoExternoComponent } from './equipo-externo.component';

describe('EquipoExternoComponent', () => {
  let component: EquipoExternoComponent;
  let fixture: ComponentFixture<EquipoExternoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipoExternoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipoExternoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
