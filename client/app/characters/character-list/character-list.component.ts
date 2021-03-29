import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../../services/auth.service';
import { CharacterService } from '../../services/character.service';
import { Character } from '../../shared/models/character.model';
import { CharacterComponent } from '../character/character.component';

declare var $;
declare var iziToast;

@Component({
  selector: 'app-character-list',
  templateUrl: './character-list.component.html',
  styleUrls: ['./character-list.component.scss']
})
export class CharacterListComponent implements OnInit {

  pageOwnCharacters: number = 1;
  pagePublicCharacters: number = 1;
  pageSizeOwnCharacters: number = 10;
  pageSizePublicCharacters: number = 10;
  countOwnCharacters: number = 0;
  countPublicCharacters: number = 0;

  ownCharacters: Character[] = [];
  publicCharacters: Character[] = [];
  isLoadingOwn: boolean = true;
  isLoadingPublic: boolean = true;

  constructor(
    public auth: AuthService,
    private characterService: CharacterService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.getCharacters(true);
    this.getCharacters(false);
  }

  countCharacters(own: boolean): void {
    this.characterService.countCharacters({ own: own }).subscribe(
      data => {
        if (own) this.countOwnCharacters = data
        else this.countPublicCharacters = data
      },
      error => iziToast.error({ message: 'There was an error, characeters can\'t be counted.' })
    );
  }

  setPageCharacters(own: boolean, page: number): void {
    if (own) this.pageOwnCharacters = page;
    else this.pagePublicCharacters = page;

    this.getCharacters(own);
  }

  getCharacters(own: boolean): void {
    if (this.auth.loggedIn || !own) {
      this.countCharacters(own);
      this.characterService.getCharacters(
        {
          own: own,
          page: own ? this.pageOwnCharacters : this.pagePublicCharacters,
          count: own ? this.pageSizeOwnCharacters : this.pageSizePublicCharacters
        }
      ).subscribe(
        data => {
          if (own) this.ownCharacters = data
          else this.publicCharacters = data
        },
        error => iziToast.error({ message: 'There was an error, characeters can\'t be getted.' }),
        () => {
          if (own) this.isLoadingOwn = false
          else this.isLoadingPublic = false
        }
      );
    }
  }

  deleteCharacter(character: Character): void {
    this.characterService.deleteCharacter(character).subscribe(
      data => iziToast.success({ message: 'Character deleted successfully.' }),
      error => iziToast.error({ message: 'There was an error, character can\'t be deleted.' }),
      () => {
        this.getCharacters(true);
        this.getCharacters(false)
      }
    );
  }

  openCharacter(character?) {
    var modalRef = this.modalService.open(CharacterComponent, { size: 'xl', backdrop: 'static' });
    if (character) modalRef.componentInstance.character = character;
    modalRef.componentInstance.getCharacters.subscribe(() => {
      this.getCharacters(true);
      this.getCharacters(false);
    });
  }

}
