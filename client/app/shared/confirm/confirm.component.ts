import { Component, ElementRef, EventEmitter, HostListener, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { Placement } from '@popperjs/core/lib/enums';
import { TippyService, TippyInstance } from '@ngneat/helipopper';

@Component({
  selector: '[confirm]',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent {
  @Input() confirmMessage: string = 'Sure?';
  @Input() confirmPlacement: Placement = 'top';
  @Input() confirmAppendTo: Element;
  @Input() confirmDoubleCheck: Boolean = false;
  @Input() confirmDoubleCheckMessage: string = "Really?";
  @Input() confirmDoubleCheckPlacement: Placement = 'right-end';

  @Output() confirm = new EventEmitter();
  @Output() reject = new EventEmitter();

  @ViewChild(TemplateRef) template: TemplateRef<any>;

  private tippy: TippyInstance;

  constructor(
    private tippyService: TippyService,
    private host: ElementRef
  ) { }

  @HostListener('mousedown')
  open() {
    this.tippy = this.tippyService.create(this.host.nativeElement, this.template, {
      trigger: 'manual',
      interactive: true,
      showOnCreate: true,
      placement: this.confirmPlacement,
      appendTo: this.confirmAppendTo ? this.confirmAppendTo : () => document.body
    });
  }

  confirmAction() {
    this.tippy.destroy();
    this.tippy = null;
    this.confirm?.emit();
  }

  rejectAction() {
    this.tippy.destroy();
    this.tippy = null;
    this.reject?.emit();
  }
}
