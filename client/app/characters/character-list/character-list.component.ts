import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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

  ownCharacters: Character[] = [];
  publicCharacters: Character[] = [];
  isLoadingOwn = true;
  isLoadingPublic = true;

  constructor(
    public auth: AuthService,
    private characterService: CharacterService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.getCharacters();
  }

  getCharacters(): void {
    this.characterService.getCharacters(true).subscribe(
      data => {
        this.ownCharacters = data;
        setTimeout(() => {
          $('[data-toggle-tooltip="tooltip"]').tooltip({ html: true });
          $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
        });
      },
      error => console.log(error),
      () => this.isLoadingOwn = false
    );
    this.characterService.getCharacters().subscribe(
      data => {
        this.publicCharacters = data;
        setTimeout(() => {
          $('[data-toggle-tooltip="tooltip"]').tooltip({ html: true });
          $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
        });
      },
      error => console.log(error),
      () => this.isLoadingPublic = false
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
            () => self.getCharacters()
          );
        }]
      ]
    });
  }

  openCharacter(character?) {
    var modalRef = this.modalService.open(CharacterComponent, { size: 'xl', backdrop: 'static' });
    if (character) modalRef.componentInstance.character = character;
    modalRef.componentInstance.getCharacters.subscribe(() => {
      this.getCharacters();
    });
  }

}
