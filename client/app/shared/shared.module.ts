import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

//Global
import { GlobalComponent } from './global/global.component';
// Components
import { ToastComponent } from './toast/toast.component';
import { LoadingComponent } from './loading/loading.component';
import { LeaveGuardWarningComponent } from './leave-guard-warning/leave-guard-warning.component';
// Pipes
import { FilterPipe } from './pipes/filter.pipe';
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
    // Shared Pipes
    FilterPipe
  ],
  declarations: [
    GlobalComponent,
    ToastComponent,
    LoadingComponent,
    LeaveGuardWarningComponent,
    FilterPipe
  ],
  providers: [
    ToastComponent
  ]
})
export class SharedModule { }
