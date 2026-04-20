import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipoInternoComponent } from './equipo-interno.component';

describe('EquipoInternoComponent', () => {
  let component: EquipoInternoComponent;
  let fixture: ComponentFixture<EquipoInternoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipoInternoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipoInternoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
