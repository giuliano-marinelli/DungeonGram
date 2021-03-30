import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LeaveGuardWarningComponent } from './leave-guard-warning.component';

describe('LeaveGuardWarningComponent', () => {
  let component: LeaveGuardWarningComponent;
  let fixture: ComponentFixture<LeaveGuardWarningComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LeaveGuardWarningComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeaveGuardWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
