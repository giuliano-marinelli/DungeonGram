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

  static createFormData(object: any): FormData {
    var formData: any = new FormData();

    Object.entries(object).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return formData;
  }

  static cropImage(data, x, y, width, height) {
    // we return a Promise that gets resolved with our canvas element
    return new Promise((resolve) => {
      // this image will hold our source image data
      const inputImage = new Image();
      // we want to wait for our image to load
      inputImage.onload = () => {
        const outputImage = document.createElement("canvas");
        outputImage.width = width;
        outputImage.height = height;
        const ctx = outputImage.getContext("2d");
        ctx.drawImage(inputImage, x, y, width, height, 0, 0, width, height);
        resolve(outputImage.toDataURL());
      };
      // start loading our image
      inputImage.src = data;
    });
  }

}
