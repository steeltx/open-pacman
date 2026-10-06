// game.js
// Estado y reglas. Depende de globals de maze.js: MAZE, TUNNEL_ROW,
// PACMAN_START, GHOST_STARTS.

const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };

const PACMAN_SPEED = 0.125; // 1/8 celda/frame -> alinea cada 8 frames
const GHOST_SPEED = 0.1;    // 1/10 celda/frame
const GHOST_RELEASE_INTERVAL = 120;
const GHOST_EXIT = { x: 13, y: 11 };

function initialGhostState( kind ) {
  const index = GHOST_STARTS.findIndex( ( start ) => start.kind === kind );
  const start = GHOST_STARTS[ index ];
  return {
    x: start.x,
    y: start.y,
    dir: 'up',
    releaseFramesRemaining: index * GHOST_RELEASE_INTERVAL,
    exiting: true,
  };
}

// Crea una partida nueva. Copia MAZE (pristino) a game.grid para poder comer
// dots sin destruir el original, y reiniciar.
function createGame() {
  const grid = MAZE.map( ( row ) => row.slice() );
  // La celda de inicio de Pacman arranca sin dot.
  grid[ PACMAN_START.y ][ PACMAN_START.x ] = 0;

  let dots = 0;
  for ( const row of grid ) for ( const v of row ) if ( v === 2 || v === 4 ) dots++;

  return {
    state: 'start',
    score: 0,
    lives: 3,
    dotsRemaining: dots,
    grid,
    pacman: {
      x: PACMAN_START.x,
      y: PACMAN_START.y,
      dir: 'left',
      nextDir: null,
      speed: PACMAN_SPEED,
    },
    ghosts: GHOST_STARTS.map( ( g ) => ( {
      ...initialGhostState( g.kind ),
      speed: GHOST_SPEED,
      kind: g.kind,
    } ) ),
  };
}

function aligned( v ) {
  return Math.abs( v - Math.round( v ) ) < 1e-3;
}

// Una celda es muro para el actor dado?
//   pacman: bloqueado por pared (1) y puerta (3)
//   ghost:  bloqueado solo por pared (1)
function isWall( grid, x, y, actor ) {
  if ( y < 0 || y >= grid.length ) return true;
  if ( x < 0 || x >= grid[ 0 ].length ) return true;
  const v = grid[ y ][ x ];
  if ( v === 1 ) return true;
  if ( v === 3 && actor === 'pacman' ) return true;
  return false;
}

// Puede el actor avanzar desde (x,y) en la direccion dir?
function canMove( grid, x, y, dir, actor ) {
  const d = DIRS[ dir ];
  if ( !d ) return false;
  const tx = x + d.x;
  const ty = y + d.y;
  // Tunel: salir por un borde en la fila del tunel siempre es valido.
  if ( ty === TUNNEL_ROW && ( tx < 0 || tx >= grid[ 0 ].length ) ) return true;
  return !isWall( grid, tx, ty, actor );
}

function wrapTunnel( a, width ) {
  if ( Math.round( a.y ) === TUNNEL_ROW ) {
    if ( a.x < 0 ) a.x += width;
    else if ( a.x >= width ) a.x -= width;
  }
}

function movePacman( game ) {
  const p = game.pacman;
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( p.x ) && aligned( p.y ) ) {
    p.x = Math.round( p.x );
    p.y = Math.round( p.y );

    // Aplicar giro pendiente si es posible.
    if ( p.nextDir && canMove( grid, p.x, p.y, p.nextDir, 'pacman' ) ) {
      p.dir = p.nextDir;
      p.nextDir = null;
    }
    const tile = grid[ p.y ][ p.x ];
    if ( tile === 2 || tile === 4 ) {
      grid[ p.y ][ p.x ] = 0;
      game.score += tile === 4 ? 50 : 10;
      game.dotsRemaining--;
    }
    // Si no puede seguir, se detiene en la celda.
    if ( !canMove( grid, p.x, p.y, p.dir, 'pacman' ) ) return;
  }

  const d = DIRS[ p.dir ];
  p.x += d.x * p.speed;
  p.y += d.y * p.speed;
  wrapTunnel( p, width );
}

function ghostNeighbor( grid, x, y, dir ) {
  const delta = DIRS[ dir ];
  const neighbor = { x: x + delta.x, y: y + delta.y };
  wrapTunnel( neighbor, grid[ 0 ].length );
  return neighbor;
}

function shortestGhostDirection( grid, ghost, target, choices ) {
  const visited = new Set( [ `${ghost.x},${ghost.y}` ] );
  const queue = [];
  for ( const dir of choices ) {
    const neighbor = ghostNeighbor( grid, ghost.x, ghost.y, dir );
    const key = `${neighbor.x},${neighbor.y}`;
    if ( visited.has( key ) ) continue;
    visited.add( key );
    queue.push( { ...neighbor, dir } );
  }

  for ( let index = 0; index < queue.length; index++ ) {
    const cell = queue[ index ];
    if ( cell.x === target.x && cell.y === target.y ) return cell.dir;
    for ( const dir of Object.keys( DIRS ) ) {
      if ( !canMove( grid, cell.x, cell.y, dir, 'ghost' ) ) continue;
      const neighbor = ghostNeighbor( grid, cell.x, cell.y, dir );
      const key = `${neighbor.x},${neighbor.y}`;
      if ( visited.has( key ) ) continue;
      visited.add( key );
      queue.push( { ...neighbor, dir: cell.dir } );
    }
  }
  return null;
}

function pacmanAhead( pacman, distance ) {
  const delta = DIRS[ pacman.dir ];
  return {
    x: Math.round( pacman.x ) + delta.x * distance,
    y: Math.round( pacman.y ) + delta.y * distance,
  };
}

function ghostTarget( game, ghost ) {
  if ( ghost.kind === 'pinky' ) return pacmanAhead( game.pacman, 4 );
  if ( ghost.kind === 'inky' ) {
    const ahead = pacmanAhead( game.pacman, 2 );
    const blinky = game.ghosts.find( ( actor ) => actor.kind === 'blinky' );
    return {
      x: ahead.x + ( ahead.x - Math.round( blinky.x ) ),
      y: ahead.y + ( ahead.y - Math.round( blinky.y ) ),
    };
  }
  if ( ghost.kind === 'clyde' ) {
    const pacman = pacmanAhead( game.pacman, 0 );
    const distanceSquared = ( ghost.x - pacman.x ) ** 2 + ( ghost.y - pacman.y ) ** 2;
    if ( distanceSquared < 64 ) return { x: 0, y: game.grid.length - 1 };
    return pacman;
  }
  return pacmanAhead( game.pacman, 0 );
}

function closestGhostDirection( grid, ghost, target, choices ) {
  let best = choices[ 0 ];
  let bestDistance = Infinity;
  for ( const dir of choices ) {
    const neighbor = ghostNeighbor( grid, ghost.x, ghost.y, dir );
    const distance = ( neighbor.x - target.x ) ** 2 + ( neighbor.y - target.y ) ** 2;
    if ( distance < bestDistance ) {
      bestDistance = distance;
      best = dir;
    }
  }
  return best;
}

function decideGhost( game, g ) {
  const grid = game.grid;

  // El orden left, right, up, down resuelve empates de forma reproducible.
  const legal = Object.keys( DIRS ).filter(
    ( dir ) => canMove( grid, g.x, g.y, dir, 'ghost' )
  );
  const options = legal.filter( ( dir ) => dir !== OPPOSITE[ g.dir ] );
  // Sin salida (callejon): permitir el giro de 180.
  const choices = options.length ? options : legal;
  if ( !choices.length ) return;

  if ( g.kind === 'blinky' ) {
    const target = ghostTarget( game, g );
    g.dir = shortestGhostDirection( grid, g, target, choices )
      || closestGhostDirection( grid, g, target, choices );
  } else {
    g.dir = closestGhostDirection( grid, g, ghostTarget( game, g ), choices );
  }
}

function decideGhostExit( g ) {
  if ( g.x !== GHOST_EXIT.x ) {
    g.dir = g.x < GHOST_EXIT.x ? 'right' : 'left';
  } else if ( g.y > GHOST_EXIT.y ) {
    g.dir = 'up';
  } else {
    g.exiting = false;
  }
}

function moveGhost( game, g ) {
  if ( g.releaseFramesRemaining > 0 ) {
    g.releaseFramesRemaining--;
    return;
  }

  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( g.x ) && aligned( g.y ) ) {
    g.x = Math.round( g.x );
    g.y = Math.round( g.y );
    if ( g.exiting ) decideGhostExit( g );
    if ( !g.exiting ) decideGhost( game, g );
    if ( !canMove( grid, g.x, g.y, g.dir, 'ghost' ) ) return;
  }

  const d = DIRS[ g.dir ];
  g.x += d.x * g.speed;
  g.y += d.y * g.speed;
  wrapTunnel( g, width );
}

function resetPositions( game ) {
  const p = game.pacman;
  p.x = PACMAN_START.x;
  p.y = PACMAN_START.y;
  p.dir = 'left';
  p.nextDir = null;
  game.ghosts.forEach( ( g ) => {
    Object.assign( g, initialGhostState( g.kind ) );
  } );
}

function collides( a, b ) {
  return Math.abs( a.x - b.x ) < 0.5 && Math.abs( a.y - b.y ) < 0.5;
}

function update( game ) {
  movePacman( game );
  game.ghosts.forEach( ( g ) => moveGhost( game, g ) );

  for ( const g of game.ghosts ) {
    if ( collides( game.pacman, g ) ) {
      game.lives--;
      if ( game.lives <= 0 ) {
        game.state = 'lost';
        return;
      }
      resetPositions( game );
      break;
    }
  }

  if ( game.dotsRemaining <= 0 ) game.state = 'won';
}

window.createGame = createGame;
window.update = update;
window.DIRS = DIRS;
