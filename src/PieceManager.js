import {
    BehaviorSubject
} from 'rxjs/BehaviorSubject';
import {
    Subject
} from 'rxjs/Subject';
import {
    interval
} from 'rxjs/observable/interval';
import {
    fromEvent
} from 'rxjs/observable/fromEvent';
import {
    withLatestFrom
} from 'rxjs/operators/withLatestFrom';
import {
    filter
} from 'rxjs/operators/filter';
import {
    takeUntil
} from 'rxjs/operators/takeUntil';

import {
    createMatrix,
    isExisted,
    moveByPos,
    rotateMatrix,
    pluckMatrixData,
    pluckMatrixColor,
    generateRandomMatrix,
    initialPos
} from './util';



const MATRIX_POS_MAP = {
    'RIGHT': {
        x: 1,
        y: 0
    },
    'LEFT': {
        x: -1,
        y: 0
    },
    'DOWN': {
        x: 0,
        y: 1
    }
};

class PieceManager {
    constructor(canvas, SCALE) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.arena = createMatrix(this.canvas.width / SCALE, this.canvas.height / SCALE);
        
        this.matrix$ = new BehaviorSubject(generateRandomMatrix());
        this.pos$ = new BehaviorSubject(initialPos(this.arena));
        
        this.action$ = new BehaviorSubject();
        this.updateAnimationFrame$ = new Subject();
        
        this.begin$ = new Subject();
        this.lose$ = new Subject();

        this.start();
    }

    start() {
        // 旋转
        this.action$.pipe(
            filter(action => action === 'ROTATE'),
            withLatestFrom(this.matrix$, this.pos$),
            takeUntil(this.lose$)
        ).subscribe(([_, matrix, pos]) => {
            this.rotate(matrix, pos);
        });

        // 方向移动
        this.action$.pipe(
            filter(action => MATRIX_POS_MAP.hasOwnProperty(action)),
            withLatestFrom(this.matrix$, this.pos$),
            takeUntil(this.lose$)
        ).subscribe(([direction, matrix, pos]) => {
            this.move(direction, matrix, pos);
        });

        // 自然下落
        interval(500).pipe(
            withLatestFrom(this.matrix$, this.pos$),
            takeUntil(this.lose$)
        ).subscribe(([_, matrix, pos]) => {
            this.drop(matrix, pos);
        })

        // 重绘
        this.updateAnimationFrame$.pipe(
            withLatestFrom(this.matrix$, this.pos$),
            takeUntil(this.lose$)
        ).subscribe(([_, matrix, pos]) => {
            this.drawMatrix(this.arena, { x: 0, y: 0 });
            this.drawMatrix(pluckMatrixData(matrix), pos);
        });

        this.begin$.next();
    }

    end() {
        this.lose$.next();
    }

    rotate(matrix, pos) { // 核心碰撞检测算法
        const rotated = rotateMatrix(matrix);
        const posOffset = { x: pos.x, y: pos.y };
        let offset = 1;
        const matrixData = pluckMatrixData(rotated);
        while (this.isCollideArena(matrixData, posOffset)) {
            posOffset.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > matrixData[0].length) {
                return;
            }
        }
        this.pos$.next(posOffset);
        this.matrix$.next(rotated);
    }

    move(direction, matrix, pos) {
        const matrxData = pluckMatrixData(matrix);
        const metaPos = MATRIX_POS_MAP[direction];
        const movedPos = moveByPos(pos, metaPos);
        if (!this.isCollideArena(matrxData, movedPos)) {
            this.pos$.next(movedPos);
        }
    };

    drop(matrix, pos) {
        const matrixData = pluckMatrixData(matrix);
        const movedPos = moveByPos(pos, MATRIX_POS_MAP['DOWN']);
        if (!this.isCollideArena(matrixData, movedPos)) {
            this.pos$.next(movedPos);
        } else {
            this.mergeArena(matrixData, pos);
            this.clearFullRows();
            const nextMatrix = generateRandomMatrix();
            const nextPos = initialPos(this.arena);
            // 检测是否游戏结束
            if (this.isCollideArena(pluckMatrixData(nextMatrix), nextPos)) {
                this.clickToRestart();
            } else {
                // 开始下一个
                this.matrix$.next(nextMatrix);
                this.pos$.next(nextPos);
            }
        }
    };

    clearFullRows() {
        const { length: rows } = this.arena;
        const { length: cols } = this.arena[0];
        outer: for (let j = rows - 1; j > -1; --j) {
            for (let i = 0; i < cols; ++i) {
                if (this.arena[j][i] === 0) {
                    continue outer;
                }
            }
            this.arena.splice(j, 1);
            const cleanRow = Array.from({ length: cols }).fill(0);
            this.arena.unshift(cleanRow);
            ++j;
        }
    }

    resetArena() {
        this.arena.forEach((row, j) => row.forEach((v, i) => this.arena[j][i] = 0));
    }

    clickToRestart() {
        this.resetArena();
        this.end();
        this.drawRestartText();
        this.restart();
    }

    drawRestartText() {
        this.updateAnimationFrame$.pipe(
            takeUntil(this.begin$)
        ).subscribe(() => {
            this.ctx.save();
            this.ctx.font = '1px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', 10, 8);
            this.ctx.fillText('CLICK TO RESTART', 10, 10);
            this.ctx.restore();
        })
    }

    restart() {
        fromEvent(this.canvas, 'click').pipe(
            takeUntil(this.begin$)
        ).subscribe(() => {
            const nextMatrix = generateRandomMatrix();
            const nextPos = initialPos(this.arena);
            this.matrix$.next(nextMatrix);
            this.pos$.next(nextPos);
            this.start();
        })
    }

    mergeArena(matrixData, pos) {
        for (let j = 0; j < matrixData.length; ++j)
            for (let i = 0; i < matrixData[j].length; ++i)
                if (isExisted(matrixData, j, i))
                    this.arena[pos.y + j][pos.x + i] = matrixData[j][i];
    }

    isCollideArena(matrix, pos) {
        for (let j = 0; j < matrix.length; ++j)
            for (let i = 0; i < matrix[j].length; ++i)
                if (isExisted(matrix, j, i) && isExisted(this.arena, pos.y + j, pos.x + i))
                    return true;
        return false;
    };

    drawMatrix(matrix, pos) {
        matrix.forEach((row, j) => {
            row.forEach((value, i) => {
                if (value !== 0) {
                    this.ctx.fillStyle = pluckMatrixColor(value);
                    this.ctx.fillRect(pos.x + i, pos.y + j, 1, 1);
                }
            })
        })
    }

    act(action) {
        this.action$.next(action);
    }

    update() {
        this.updateAnimationFrame$.next();
    }
}

export default PieceManager;