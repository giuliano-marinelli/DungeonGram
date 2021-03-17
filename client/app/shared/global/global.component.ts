import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-global',
  templateUrl: './global.component.html',
  styleUrls: ['./global.component.scss']
})
export class GlobalComponent implements OnInit {

  //global object for the loading of wear assets in different scenes
  public static wearsAvailable: any = {
    arms: {
      biceps: [],
      elbows: [],
      forearms: [],
      hands: ["mittens"],
      shoulders: []
    },
    head: {
      beard: ["big.mostacho.beard", "chinless.beard", "disheveled.beard", "full.beard", "long.beard"],
      ears: ["human.ears", "half.elf.ears", "elf.ears"],
      eyebrows: [],
      hair: ["mohicano"],
      helmet: [],
      scars: []
    },
    legs: {
      knees: ["metal.kneepads"],
      feet: ["leather.boots"]
    },
    torso: {
      accessory: [],
      back: [],
      chest: ["padded.armor.chest", "breastplate"],
      hips: ["padded.armor.hips"]
    },
    skin: {
      color: []
    },
    info: {
      character: []
    }
  };

  constructor() { }

  ngOnInit(): void {
  }

}
