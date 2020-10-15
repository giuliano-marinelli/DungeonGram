import { Schema, type } from "@colyseus/schema";
import { Dice } from './dice';

export class Roll extends Schema {
  rollString: string;
  rolls: string[] = [];
  results: any[] = [];
  isRoll: boolean = false;

  constructor(rollString: string) {
    super();
    try {
      this.rollString = rollString + "";
      rollString = rollString.replace(/\s/g, '').toLowerCase();
      if (rollString.startsWith('/roll')) {
        rollString = rollString.split('/roll')[1];
        this.rolls = rollString.split('+');
        this.rolls.forEach((roll) => {
          if (roll.indexOf('d') > -1) {
            var amount = roll.split('d')[0] != '' ? parseInt(roll.split('d')[0]) : 1;
            var dice = new Dice(parseInt(roll.split('d')[1]));

            this.results.push(dice.roll(amount));
          } else {
            this.results.push(parseInt(roll));
          }
        });
        if (this.rolls.length && this._validateRoll())
          this.isRoll = true;
      }
    } catch (err) {
      console.log('Bad rolling ', err);
    }
  }

  _validateRoll() {
    var valid = true;
    this.rolls.forEach(roll => {
      if (valid) {
        if (roll.indexOf('d') > -1) {
          valid = (roll.split('d')[0] == '' || !isNaN(parseInt(roll.split('d')[0]))) && !isNaN(parseInt(roll.split('d')[1]));
        } else {
          valid = !isNaN(parseInt(roll));
        }
      }
    });
    return valid;
  }

  getSum() {
    var sum = [];
    this.results.forEach(result => {
      if (Array.isArray(result)) {
        sum.push('( ' + result.join(' + ') + ' )');
      } else {
        sum.push(result);
      }
    });
    return sum.join(' + ');
  }

  getValue() {
    var sum = 0;
    this.results.forEach(result => {
      if (Array.isArray(result)) {
        sum += result.reduce((a, b) => a + b, 0);
      } else {
        sum += result;
      }
    });
    return sum;
  }

}
