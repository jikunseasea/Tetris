import PIECE_DATA from './PieceData';

const createMatrix = (w, h) => (
    Array.from({ length: h }).map(row => Array.from({ length: w }).fill(0))
);

const isExisted = (m, y, x) => m[y] === undefined ? true : m[y][x] !== 0;


const moveByPos = (pos, metaPos) => ({
    x: pos.x + metaPos.x,
    y: pos.y + metaPos.y
});

const generateRandomMatrix = () => {
    const pieces = Reflect.ownKeys(PIECE_DATA);
    const { length } = pieces;
    const randomIndex = Math.floor(Math.random() * length);
    const letter = pieces[randomIndex];
    const shape = Math.floor(Math.random() * 4);
    return [letter, shape];
}

const initialPos = (arena) => ({
    x: arena[0].length / 2 - 2, // piece 的矩阵大小是 4 × 4
    y: 0
});

const rotateMatrix = ([letter, shape]) => [letter, (shape + 1) % 4];
const pluckMatrixColor = (letter) => PIECE_DATA[letter]['COLOR'];
const pluckMatrixData = ([letter, shape]) => PIECE_DATA[letter]['DATA'][shape];

export {
    createMatrix,
    isExisted,
    moveByPos,
    rotateMatrix,
    pluckMatrixColor,
    pluckMatrixData,
    generateRandomMatrix,
    initialPos
}