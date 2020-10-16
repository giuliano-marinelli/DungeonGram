import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-leave-guard-warning',
  templateUrl: './leave-guard-warning.component.html',
  styleUrls: ['./leave-guard-warning.component.scss']
})
export class LeaveGuardWarningComponent {

  subject: Subject<boolean>;

  constructor(
    public activeModal: NgbActiveModal,
    private modalService: NgbModal
  ) { }

  proceed(value: boolean) {
    this.modalService.dismissAll();
    this.subject.next(value);
    this.subject.complete();
  }

}
