// Angular
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// Services
import { AuthGuardLogin } from './services/auth-guard-login.service';
import { AuthGuardAdmin } from './services/auth-guard-admin.service';
// Components
import { AboutComponent } from './about/about.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { AccountComponent } from './account/account.component';
import { AdminComponent } from './admin/admin.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { EditorComponent } from './editor/editor.component';
import { GameComponent } from './game/game.component';
import { CharacterComponent } from './characters/character/character.component';
import { CharacterListComponent } from './characters/character-list/character-list.component';
import { CampaignListComponent } from './campaigns/campaign-list/campaign-list.component';
import { MapListComponent } from './maps/map-list/map-list.component';

const routes: Routes = [
  { path: '', component: AboutComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'account', component: AccountComponent, canActivate: [AuthGuardLogin] },
  { path: 'account/:user/:code', component: AccountComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuardAdmin] },
  { path: 'notfound', component: NotFoundComponent },
  { path: 'editor', component: EditorComponent },
  { path: 'game/:campaign', component: GameComponent },
  { path: 'campaigns', component: CampaignListComponent },
  { path: 'characters', component: CharacterListComponent },
  { path: 'maps', component: MapListComponent },
  { path: '**', redirectTo: '/notfound' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})

export class AppRoutingModule { }
