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
    this.countCharacters();
    this.getCharacters(true);
    this.getCharacters(false);
  }

  countCharacters(): void {
    this.characterService.countCharacters(true).subscribe(
      data => this.countOwnCharacters = data,
      error => console.log(error)
    );
    this.characterService.countCharacters(false).subscribe(
      data => this.countPublicCharacters = data,
      error => console.log(error)
    );
  }

  setPage(own, page): void {
    if (own) this.pageOwnCharacters = page;
    else this.pagePublicCharacters = page;

    this.countCharacters();
    this.getCharacters(own);
  }

  getCharacters(own): void {
    this.characterService.getCharacters(
      own, own ? this.pageOwnCharacters : this.pagePublicCharacters, own ? this.pageSizeOwnCharacters : this.pageSizePublicCharacters
    ).subscribe(
      data => {
        if (own) this.ownCharacters = data
        else this.publicCharacters = data
        setTimeout(() => {
          $('[data-toggle-tooltip="tooltip"]').tooltip({ html: true });
          $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
        });
      },
      error => console.log(error),
      () => {
        if (own) this.isLoadingOwn = false
        else this.isLoadingPublic = false
      }
    );
  }

  deleteCharacter(character: Character): void {
    var self = this;
    iziToast.question({
      timeout: false,
      close: false,
      overlay: true,
      displayMode: 'replace',
      zindex: 1051,
      color: 'red',
      icon: 'fa fa-trash',
      message: 'Are you sure to delete character <b>' + character.name + '</b>?',
      position: 'topCenter',
      buttons: [
        ['<button>Cancel</button>', function (instance, toast) {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
        }, true],
        ['<button><b>Proceed</b></button>', function (instance, toast) {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
          self.characterService.deleteCharacter(character).subscribe(
            data => iziToast.success({ message: 'Character deleted successfully.' }),
            error => console.log(error),
            () => {
              self.countCharacters();
              self.getCharacters(true);
              self.getCharacters(false)
            }
          );
        }]
      ]
    });
  }

  openCharacter(character?) {
    var modalRef = this.modalService.open(CharacterComponent, { size: 'xl', backdrop: 'static' });
    if (character) modalRef.componentInstance.character = character;
    modalRef.componentInstance.getCharacters.subscribe(() => {
      this.countCharacters();
      this.getCharacters(true);
      this.getCharacters(false);
    });
  }

}
