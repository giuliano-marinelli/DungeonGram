import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CampaignListComponent } from './campaign-list.component';

describe('CampaignListComponent', () => {
  let component: CampaignListComponent;
  let fixture: ComponentFixture<CampaignListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CampaignListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CampaignListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
