import Game from './Game';

let game = new Game(
  document.getElementById('canvas')
);

// if (module.hot && process.env.NODE_ENV === 'dev') {
//   module.hot.accept('./Game', (...args) => {
//     console.log('update ====================')

//     game = new Game(document.getElementById('canvas'));
//     console.log(game);
//   });
// }