import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdenComponent } from './orden.component';

describe('OrdenComponent', () => {
  let component: OrdenComponent;
  let fixture: ComponentFixture<OrdenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdenComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
