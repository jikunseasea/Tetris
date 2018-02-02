import {
  interval
} from 'rxjs/observable/interval';
import {
  fromEvent
} from 'rxjs/observable/fromEvent';
import {
  animationFrameScheduler
} from 'rxjs/Scheduler';
import {
  filter,
  pluck,
  map,
  tap
} from 'rxjs/operators';

import PieceManager from './PieceManager';

import {
  createMatrix
} from './util';

const KEYCODE_MAP = {
  37: 'LEFT',
  38: 'ROTATE',
  39: 'RIGHT',
  40: 'DOWN'
};

const keyboard$ = fromEvent(document, 'keydown').pipe(
  filter(e => KEYCODE_MAP.hasOwnProperty(e.keyCode)),
  tap(e => e.preventDefault()),
  pluck('keyCode'),
  map(keyCode => KEYCODE_MAP[keyCode])
);

const requestAnimationFrame$ = interval(0, animationFrameScheduler);

const SCALE = 20;

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(SCALE, SCALE);


    this.pieceManager = new PieceManager(this.canvas, SCALE);

    keyboard$.subscribe(action => {
      this.pieceManager.act(action);
    });

    requestAnimationFrame$.subscribe(() => {
      this.clearAll();
      this.drawBackground();
      this.pieceManager.update();
    });
  }

  clearAll() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBackground() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

export default Game;