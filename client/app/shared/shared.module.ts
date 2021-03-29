import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

//Global
import { GlobalComponent } from './global/global.component';
// Components
import { ToastComponent } from './toast/toast.component';
import { LoadingComponent } from './loading/loading.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { LeaveGuardWarningComponent } from './leave-guard-warning/leave-guard-warning.component';
// Pipes
import { FilterPipe } from './pipes/filter.pipe';
import { TruncatePipe } from './pipes/truncate.pipe';
@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  exports: [
    // Shared Modules
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    // Shared Components
    GlobalComponent,
    ToastComponent,
    LoadingComponent,
    ConfirmComponent,
    // Shared Pipes
    FilterPipe,
    TruncatePipe
  ],
  declarations: [
    GlobalComponent,
    ToastComponent,
    LoadingComponent,
    ConfirmComponent,
    LeaveGuardWarningComponent,
    FilterPipe,
    TruncatePipe
  ],
  providers: [
    ToastComponent
  ]
})
export class SharedModule { }
