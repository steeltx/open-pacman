# SPEC 02 — Corregir salida de la jaula

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-10-05
> **Objective:** Garantizar que los cuatro fantasmas salgan por la puerta de su jaula y comiencen a recorrer el mapa sin quedar atrapados.

## Alcance

**Incluido:**

- Diagnosticar y corregir el bloqueo durante la salida de la jaula.
- Mantener una fase de salida independiente de los objetivos de persecución.
- Conservar las esperas de 0, 120, 240 y 360 frames activos para Blinky, Pinky, Inky y Clyde.
- Aplicar la misma salida al iniciar, reiniciar y perder una vida.
- Modificar las reglas en `src/js/game.js`.
- Consultar la geometría y posiciones iniciales de `src/js/maze.js` sin modificarlas.
- Verificar la salida con estados controlados y mediante juego en el navegador.

**Fuera de alcance:**

- Colocar los fantasmas directamente fuera de la jaula.
- Cambiar el mapa, la puerta o los puntos de aparición.
- Cambiar personalidades, velocidades o dificultad mediante nuevas esperas.
- Cambiar renderizado, controles, puntuación, vidas o dimensiones.
- Incorporar poderes, nuevos modos de comportamiento o persistencia.
- Añadir dependencias o cambiar el modelo temporal basado en frames.

## Modelo de datos

Esta corrección no introduce nuevas estructuras de datos. Reutiliza el estado actual de cada fantasma en `game.ghosts`:

- `x` e `y`: posición en casillas, con origen arriba a la izquierda.
- `dir`: dirección actual.
- `speed`: velocidad existente de 0.1 casillas por frame.
- `kind`: identidad y personalidad.
- `releaseFramesRemaining`: espera previa al movimiento.
- `exiting`: fase de salida de la jaula.

Se conservan `GHOST_STARTS`, `GHOST_RELEASE_INTERVAL` y `GHOST_EXIT`. La salida termina en la casilla exterior definida por `GHOST_EXIT`, actualmente `(13, 11)`.

## Reglas de salida

- Durante la espera, cada fantasma permanece en su posición inicial.
- El contador disminuye únicamente durante actualizaciones de juego activo.
- Al terminar la espera, el fantasma sigue una ruta transitable hacia `GHOST_EXIT`.
- Las decisiones de dirección se toman únicamente con ambas coordenadas alineadas.
- La ruta respeta paredes y permite atravesar la puerta para los fantasmas.
- No se utilizan los objetivos de persecución mientras `exiting` sea verdadero.
- La fase de salida termina únicamente al alcanzar la casilla exterior alineada.
- Después de salir, el fantasma utiliza su personalidad definida en SPEC 01.
- No se permite resolver el bloqueo mediante teletransporte o movimiento a través de paredes.
- `createGame()` y `resetPositions()` deben restaurar de forma consistente posiciones, direcciones, esperas y fase de salida.

## Plan de implementación

Cada paso debe dejar el juego ejecutable y verificable.

1. **Reproducir y localizar el bloqueo.** Revisar `initialGhostState()`, `decideGhostExit()` y `moveGhost()` en `src/js/game.js`. Comprobar la ruta desde cada entrada de `GHOST_STARTS` hasta `GHOST_EXIT` usando la geometría de `src/js/maze.js`. Documentar en la revisión del cambio la causa observada, sin asumir que el fallo está en una función concreta.
2. **Corregir la navegación de salida.** Ajustar las reglas necesarias en `src/js/game.js` para que los cuatro fantasmas alcancen `GHOST_EXIT` mediante movimientos legales y alineados. Mantener las esperas existentes y activar la personalidad solo al completar la salida. Verificar cada fantasma mediante un estado controlado sin colisiones con Pac-Man.
3. **Unificar el restablecimiento de la salida.** Revisar la restauración compartida por `createGame()` y `resetPositions()`. Corregir cualquier diferencia para que iniciar, reiniciar y perder una vida repitan la misma secuencia. Mantener las identidades y velocidades existentes.

## Criterios de aceptación

- [ ] Al iniciar, los cuatro fantasmas aparecen dentro de la jaula en sus posiciones actuales.
- [ ] Blinky comienza sin espera; Pinky, Inky y Clyde esperan 120, 240 y 360 actualizaciones activas, respectivamente.
- [ ] En una simulación controlada sin colisiones, cada fantasma alcanza `GHOST_EXIT` antes de completar 100 actualizaciones desde el inicio de su movimiento.
- [ ] Al alcanzar `GHOST_EXIT`, cada fantasma cambia `exiting` a falso y comienza su comportamiento individual.
- [ ] Ningún fantasma atraviesa una pared ni es teletransportado para salir.
- [ ] Los cuatro mantienen la velocidad de 0.1 casillas por frame y toman decisiones con coordenadas alineadas.
- [ ] Perder una vida restablece posiciones, direcciones, esperas y fase de salida de los cuatro fantasmas.
- [ ] Reiniciar restaura puntos, puntuación, vidas y la secuencia inicial de salida.
- [ ] Las personalidades de Blinky, Pinky, Inky y Clyde siguen cumpliendo las reglas de SPEC 01.
- [ ] Pac-Man continúa bloqueado por la puerta de la jaula.
- [ ] Los giros pendientes y el cruce del túnel siguen funcionando.
- [ ] Comer un punto suma diez puntos y lo elimina del mapa de la partida.
- [ ] Una colisión descuenta una sola vida y perder la última muestra la derrota.
- [ ] Comer todos los puntos muestra la victoria.
- [ ] Abrir `src/index.html` y jugar no genera errores en la consola.

## Decisiones

- **Sí:** corregir la salida por la puerta, porque se conserva la aparición dentro de la jaula solicitada por el usuario.
- **No:** colocar los fantasmas directamente en los pasillos exteriores, porque eliminaría la secuencia de salida elegida.
- **Sí:** mantener la activación escalonada, para conservar la dificultad actual.
- **Sí:** aplicar la misma secuencia al iniciar, reiniciar y perder una vida, para evitar estados inconsistentes.
- **Sí:** conservar el modelo de datos existente, porque ya representa espera y salida.
- **Sí:** mantener las reglas en `src/js/game.js`, respetando la separación entre lógica y renderizado.
- **No:** modificar el mapa o las personalidades, porque esta spec se limita al bloqueo de salida.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Una prueba normal termina por colisión antes de observar todas las salidas. | Verificar cada salida en estados controlados sin colisiones y después comprobar el juego normal. |
| La transición a persecución ocurre dentro de la jaula. | Finalizar `exiting` únicamente al alcanzar `GHOST_EXIT` con coordenadas alineadas. |
| La corrección pierde la alineación por errores acumulados de movimiento. | Conservar la velocidad actual y el ajuste a coordenadas enteras en los puntos de decisión. |
| El reinicio conserva una espera o fase anterior. | Mantener una restauración compartida del estado inicial de cada fantasma. |

## Qué **no** incluye esta spec

- Aparición directa fuera de la jaula.
- Cambios de mapa, puerta o posiciones iniciales.
- Nuevas personalidades, poderes o modos de comportamiento.
- Cambios de velocidad, controles, puntuación o vidas.
- Persistencia, dependencias o movimiento por tiempo transcurrido.
