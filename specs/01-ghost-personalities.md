# SPEC 01 — Cuatro fantasmas con personalidades clásicas

> **Status:** Approved
> **Depends on:** Ninguna
> **Date:** 2026-10-05
> **Objective:** Incorporar cuatro fantasmas con comportamientos clásicos diferenciados y un perseguidor agresivo que busque la ruta más corta hacia Pac-Man.

## Alcance

**Incluido:**

- Cuatro fantasmas: Blinky rojo, Pinky rosa, Inky cian y Clyde naranja.
- Estrategias individuales de persecución y retirada.
- Salida escalonada de la casa al iniciar y después de perder una vida.
- Restablecimiento del estado de los fantasmas al reiniciar.
- Cambios en `src/js/maze.js`, `src/js/game.js` y `src/js/render.js`.
- Verificación manual en el navegador y mediante estados controlados en la consola.

**Fuera de alcance:**

- Ciclos globales de persecución y dispersión.
- Poderes y modo asustado.
- Peculiaridades y bugs del arcade original.
- Nuevos niveles, persistencia y leyenda de comportamientos.
- Cambios de mapa, dimensiones, controles, puntuación o vidas.
- Dependencias, módulos ES y herramientas de construcción.

## Modelo de datos

`GHOST_STARTS`, en `src/js/maze.js`, pasa de dos a cuatro entradas. Cada entrada conserva `x` e `y` y usa una identidad estable en `kind`: `blinky`, `pinky`, `inky` o `clyde`.

El estado de cada fantasma en `game.ghosts` conserva su posición, dirección y velocidad. Añade un contador de espera para la salida:

```js
{
  x: 13,
  y: 14,
  dir: 'up',
  speed: GHOST_SPEED,
  kind: 'blinky',
  releaseFramesRemaining: 0,
}
```

- Las coordenadas se expresan en casillas, con origen arriba a la izquierda.
- La velocidad continúa siendo `GHOST_SPEED = 0.1` casillas por frame.
- Los puntos de aparición deben ser transitables dentro de la casa existente.
- Los colores se asocian a `kind`, no al índice del arreglo.
- Los contadores avanzan únicamente durante llamadas a `update(game)`.
- La equivalencia de salida es 120 frames por cada intervalo de dos segundos a 60 FPS nominales.
- Los retrasos iniciales son 0, 120, 240 y 360 frames para Blinky, Pinky, Inky y Clyde, respectivamente.
- Los fantasmas en espera permanecen en su punto de aparición.
- La fase de salida debe llevarlos fuera de la casa antes de aplicar su estrategia normal.
- No se persiste ningún dato entre partidas.

## Reglas de comportamiento

### Reglas comunes

- Tomar decisiones solo cuando ambas coordenadas estén alineadas con una casilla.
- Respetar paredes y permitir la puerta de la casa para fantasmas.
- Considerar la conexión horizontal del túnel únicamente en `TUNNEL_ROW`.
- Excluir la dirección inversa si existe otra dirección legal.
- Permitir invertir en un callejón; si no existe movimiento legal, permanecer detenido.
- Resolver empates con un orden fijo y documentado en la implementación para permitir comprobaciones reproducibles.
- Calcular objetivos a partir de la casilla redondeada de Pac-Man y su dirección actual.

### Blinky

- Usar como objetivo la casilla actual de Pac-Man.
- Elegir el primer movimiento de una ruta de longitud mínima mediante búsqueda en anchura sobre las casillas transitables para fantasmas.
- Incluir el túnel en la búsqueda.
- Respetar la restricción de no invertir al elegir el primer movimiento.
- Recalcular al llegar a cada casilla.
- Si ninguna dirección permitida alcanza el objetivo, elegir un movimiento legal con menor distancia al objetivo; nunca atravesar paredes.

### Pinky

- Apuntar cuatro casillas delante de Pac-Man según su dirección actual.
- No reproducir el desplazamiento adicional hacia la izquierda del arcade cuando Pac-Man mira hacia arriba.
- Elegir el vecino legal con menor distancia euclídea al objetivo.

### Inky

- Calcular un punto dos casillas delante de Pac-Man.
- Usar la casilla redondeada de Blinky como origen del vector hacia ese punto.
- Duplicar el vector: `target = ahead + (ahead - blinky)`.
- Elegir el vecino legal con menor distancia euclídea al objetivo.

### Clyde

- Medir la distancia euclídea desde su posición alineada hasta la casilla redondeada de Pac-Man.
- Perseguir la casilla de Pac-Man cuando la distancia sea mayor o igual a ocho casillas.
- Apuntar a la esquina inferior izquierda del mapa cuando la distancia sea menor que ocho casillas.
- Elegir el vecino legal con menor distancia euclídea al objetivo.

Los objetivos de Pinky, Inky y Clyde pueden caer en paredes o fuera del mapa. Se usan como puntos geométricos y no se ajustan a una casilla transitable.

## Plan de implementación

Cada paso debe dejar el juego ejecutable y verificable. Si un paso resulta demasiado grande, dividirlo en cambios funcionales pequeños sin ampliar el alcance.

1. **Definir las cuatro identidades y colores.** Actualizar `GHOST_STARTS` en `src/js/maze.js` y la asociación de colores en `src/js/render.js`. Adaptar la inicialización en `src/js/game.js` para conservar una estrategia transitoria funcional mientras se incorporan las definitivas. Verificar que aparecen cuatro fantasmas en posiciones válidas.
2. **Incorporar espera y salida de la casa.** Añadir los contadores y una fase de salida que no dependa de los objetivos de persecución. Restablecer ambos en `createGame()` y `resetPositions()`. Verificar salida ordenada y repetición después de una colisión.
3. **Implementar navegación mínima de Blinky.** Añadir búsqueda en anchura con túnel y restricciones de movimiento. Verificar su elección en un estado donde la aproximación por distancia directa elija una ruta más larga.
4. **Implementar anticipación de Pinky.** Separar el cálculo de objetivos de la elección de movimiento para reutilizar la navegación por distancia. Verificar los objetivos en las cuatro direcciones de Pac-Man.
5. **Implementar el objetivo de Inky.** Reutilizar la elección por distancia y consultar a Blinky por identidad. Verificar que mover a Blinky cambia el objetivo de Inky con Pac-Man fijo.
6. **Implementar persecución y retirada de Clyde.** Reutilizar la elección por distancia e incorporar el umbral de ocho casillas. Verificar ambos lados del umbral y el caso exacto de ocho.

## Criterios de aceptación

- [ ] Al iniciar existen exactamente cuatro fantasmas con identidades distintas.
- [ ] Blinky es rojo, Pinky rosa, Inky cian y Clyde naranja, independientemente del orden del arreglo.
- [ ] Todos mantienen la velocidad de 0.1 casillas por frame.
- [ ] Blinky comienza su salida sin espera; los restantes comienzan después de 120, 240 y 360 actualizaciones de juego activo.
- [ ] Ningún fantasma queda permanentemente encerrado en la casa.
- [ ] Una pérdida de vida restablece posiciones, direcciones, esperas y fase de salida.
- [ ] En estados controlados, Blinky elige una ruta mínima permitida hacia Pac-Man y considera el túnel.
- [ ] Pinky calcula exactamente cuatro casillas de anticipación en cada dirección.
- [ ] Inky calcula `ahead + (ahead - blinky)` usando dos casillas de anticipación.
- [ ] Clyde persigue a distancia de ocho casillas o más y se retira a menos de ocho.
- [ ] Pinky, Inky y Clyde eligen el vecino permitido con menor distancia euclídea a su objetivo.
- [ ] Los objetivos fuera del mapa o en paredes no provocan movimientos ilegales ni errores.
- [ ] Ningún fantasma invierte dirección fuera de un callejón durante su estrategia normal.
- [ ] Los fantasmas no atraviesan paredes y cruzan correctamente el túnel.
- [ ] Los giros pendientes de Pac-Man y el bloqueo de su entrada a la casa siguen funcionando.
- [ ] Comer un punto suma diez puntos y lo elimina del mapa de la partida.
- [ ] Una colisión descuenta una sola vida; perder la última muestra la derrota.
- [ ] Comer todos los puntos muestra la victoria.
- [ ] Reiniciar restaura puntos, puntuación, vidas, posiciones y estado de salida.
- [ ] Abrir `src/index.html` y jugar no genera errores en la consola.

## Decisiones

- **Sí:** personalidades clásicas simplificadas, porque permiten distinguir las estrategias sin reproducir todo el arcade.
- **Sí:** ruta mínima para Blinky, porque la agresividad debe venir de una persecución eficaz.
- **No:** aumentar la velocidad de Blinky, para conservar el equilibrio y la alineación existentes.
- **Sí:** navegación por distancia para los otros tres, porque preserva su comportamiento clásico y admite objetivos fuera del mapa.
- **No:** ruta mínima para todos, porque reduciría la diferencia entre las estrategias.
- **Sí:** salida escalonada con Blinky primero, para introducir presión progresivamente.
- **Sí:** temporización por frames activos, coherente con el movimiento actual del juego.
- **No:** ciclos de dispersión, porque Blinky debe mantener su persecución una vez que salga de la casa.
- **No:** bugs originales de anticipación, para mantener reglas claras y verificables.
- **Sí:** mantener las reglas en `src/js/game.js` y el dibujo en `src/js/render.js`, respetando la arquitectura existente.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Un objetivo exterior impide salir de la casa. | Aplicar una fase de salida explícita antes de activar la estrategia individual. |
| La búsqueda ignora el túnel o permite salir por otros bordes. | Reutilizar las reglas de movimiento y comprobar la conexión de `TUNNEL_ROW`. |
| El perseguidor vuelve el juego demasiado difícil. | Mantener la velocidad actual y escalonar las salidas. |
| La tasa de refresco cambia la duración real de la espera. | Definir el contrato en frames activos, con equivalencia nominal a 60 FPS; no cambiar el modelo temporal en esta spec. |
| El reinicio conserva contadores o fases anteriores. | Centralizar la restauración del estado inicial de cada fantasma. |
| Declaraciones nuevas colisionan entre scripts clásicos. | Mantener nombres únicos y el orden actual de carga de scripts. |

## Qué **no** incluye esta spec

- Poderes, fantasmas asustados o comestibles.
- Dispersión global y reproducción exacta del arcade.
- Nuevos mapas, niveles, persistencia o interfaz explicativa.
- Migración a movimiento por tiempo transcurrido.
- Cambios en controles, puntuación, vidas o dimensiones.
