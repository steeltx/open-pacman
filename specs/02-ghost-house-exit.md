# SPEC 02 — Validar salida de la jaula

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-10-05
> **Objective:** Validar que los cuatro fantasmas salen por la puerta de su jaula y corregir únicamente los fallos reproducibles de esa secuencia.

## Contexto observado

La simulación controlada del código actual no reproduce el bloqueo. Se invocó `moveGhost()` para cada fantasma sin colisiones con Pac-Man.

| Fantasma | Espera en actualizaciones | Actualizaciones desde el primer movimiento hasta finalizar la salida |
| --- | ---: | ---: |
| Blinky | 0 | 31 |
| Pinky | 120 | 41 |
| Inky | 240 | 41 |
| Clyde | 360 | 51 |

Los cuatro alcanzan `GHOST_EXIT` y desactivan `exiting`. En esa misma actualización comienzan el movimiento de persecución, por lo que la posición al terminar la llamada puede no coincidir exactamente con la casilla de salida.

Las direcciones iniciales de salida son legales según la geometría actual. `createGame()` y `resetPositions()` ya reutilizan `initialGhostState()`.

Estos resultados no sustituyen la verificación mediante `update(game)` y juego en el navegador. No se ha identificado una causa del bloqueo ni se ha realizado una corrección.

## Registro de verificación — Paso 1

- Se revisaron `initialGhostState()`, `decideGhostExit()` y `moveGhost()` y la geometría de `src/js/maze.js`.
- Se ejecutaron los scripts clásicos en un contexto aislado de Node.js, con `window` simulado, sin modificar archivos de ejecución.
- La simulación con llamadas a `moveGhost()` confirmó los tiempos de la tabla del contexto observado.
- Para comprobar `update(game)` sin colisiones, Pac-Man se mantuvo inmóvil en `(-10.5, -10.5)` con velocidad cero. Este estado artificial solo aísla la salida; no representa una partida normal.
- Se instrumentó temporalmente `decideGhostExit()` en memoria para observar la posición antes del desplazamiento de persecución. Los cuatro finalizaron la salida exactamente en `(13, 11)`, en las actualizaciones 31, 161, 281 y 411.
- El primer movimiento ocurrió en las actualizaciones 1, 121, 241 y 361. Desde ese movimiento hasta finalizar la salida transcurrieron 31, 41, 41 y 51 actualizaciones, respectivamente.
- Durante la salida se comprobó un desplazamiento de 0.1 casillas por actualización de movimiento y que las casillas redondeadas ocupadas no fueran paredes. La simulación integrada terminó con tres vidas.
- Un intento inicial con Pac-Man dentro del mapa produjo una colisión y restablecimiento de posiciones. Ese resultado no corresponde a un bloqueo de salida y no sirve como simulación sin colisiones.
- No se reprodujo un bloqueo ni se identificó una causa que justifique modificar navegación.
- La comprobación interactiva en navegador queda pendiente: hay navegadores instalados, pero esta sesión no dispone de una herramienta de interacción visual. Las simulaciones no verifican renderizado, controles ni errores de consola durante juego real.

## Registro de verificación — Paso 2

- Las comprobaciones controladas del paso 1 no identificaron un fallo de navegación de salida reproducible.
- Este paso no requiere cambios de código con la evidencia disponible. Se conservan `decideGhostExit()`, las esperas existentes y la transición a las personalidades.
- No se atribuye una causa al bloqueo reportado ni se presenta la navegación como corregida.
- La conclusión es limitada a los estados controlados probados. La verificación interactiva en navegador sigue pendiente; si reproduce un fallo de salida, deberá retomarse este paso con ese estado y comprobar la corrección.

## Registro de verificación — Paso 3

- Se confirmó que `createGame()` y `resetPositions()` comparten `initialGhostState()` sin diferencias en posiciones, direcciones, esperas o fase de salida. Las identidades y velocidades también coinciden.
- En una simulación aislada se alteraron actores y progreso antes de llamar a `resetPositions()`. Los actores quedaron iguales a los de una partida nueva; puntuación, puntos restantes y mapa de la partida conservaron su progreso.
- Se verificó la rama de colisión de `update(game)` superponiendo Pac-Man y Blinky. Para aislar esa rama se sustituyeron temporalmente las funciones de movimiento por funciones vacías dentro del contexto de prueba. Se descontó exactamente una vida y los actores recuperaron su estado inicial.
- Una nueva llamada a `createGame()` restauró puntuación cero, tres vidas, puntos y estado inicial de los actores.
- Se repitieron las secuencias controladas de creación y restablecimiento: primeros movimientos en 1, 121, 241 y 361; fin de salida en 31, 161, 281 y 411. La rama de pérdida de vida se comprobó por separado mediante igualdad de estado con la partida nueva.
- Se revisó `startGame()` en `src/js/main.js`: tanto iniciar como reiniciar llaman a `createGame()`. No se comprobó la interacción con el botón mediante navegador.
- No se identificaron diferencias reproducibles que requieran modificar el restablecimiento. Este paso no requiere cambios de código con la evidencia disponible.
- Por petición del usuario no se realizará verificación automática en navegador. El juego manual y los criterios asociados permanecen pendientes de verificación humana.

## Alcance

**Incluido:**

- Intentar reproducir el bloqueo durante la salida de la jaula y documentar los resultados.
- Corregir únicamente fallos reproducibles de la secuencia de salida.
- Mantener una fase de salida independiente de los objetivos de persecución.
- Conservar las esperas de 0, 120, 240 y 360 frames activos para Blinky, Pinky, Inky y Clyde.
- Aplicar la misma salida al iniciar, reiniciar y perder una vida.
- Modificar las reglas en `src/js/game.js` solo si las comprobaciones identifican un fallo.
- Registrar evidencias y resultados de verificación en `specs/02-ghost-house-exit.md`.
- Consultar la geometría y posiciones iniciales de `src/js/maze.js` sin modificarlas.
- Verificar la salida con estados controlados y mediante juego en el navegador.

**Fuera de alcance:**

- Colocar los fantasmas directamente fuera de la jaula.
- Cambiar el mapa, la puerta o los puntos de aparición.
- Cambiar personalidades, velocidades o dificultad mediante nuevas esperas.
- Cambiar renderizado, controles, puntuación, vidas o dimensiones.
- Incorporar poderes, nuevos modos de comportamiento o persistencia.
- Añadir dependencias o cambiar el modelo temporal basado en frames.
- Refactorizar navegación o restauración que ya cumplen los criterios sin un fallo reproducible.

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

1. **Documentar y contrastar la salida actual.** Revisar `initialGhostState()`, `decideGhostExit()` y `moveGhost()` junto con la geometría de `src/js/maze.js`. Repetir la simulación controlada y comprobar también `update(game)` sin colisiones. Observar la llegada alineada a `GHOST_EXIT` antes del siguiente desplazamiento. Intentar reproducir el bloqueo en el navegador. Registrar condiciones, resultados y cualquier limitación de verificación en esta spec; no inferir una causa si no se reproduce.
2. **Resolver únicamente fallos de navegación reproducidos.** Si las comprobaciones detectan un fallo de salida, documentar su causa y ajustar las reglas necesarias en `src/js/game.js`. Mantener esperas, movimientos legales y activación de personalidad al completar la salida. Repetir el estado que fallaba para verificar la corrección. Si no se detecta un fallo, registrar que este paso no requiere cambios de código.
3. **Contrastar y resolver diferencias de restablecimiento.** Comparar los estados de `createGame()` y `resetPositions()` y observar iniciar, reiniciar y perder una vida. Corregir únicamente diferencias reproducibles en posiciones, direcciones, esperas o fase de salida. Mantener identidades y velocidades. Si el restablecimiento existente cumple el contrato, conservarlo y registrar que no requiere cambios de código.

## Criterios de aceptación

- [ ] Las verificaciones controladas y en navegador tienen condiciones y resultados documentados; cualquier bloqueo reproducido incluye su causa y una comprobación posterior de la corrección.
- [ ] Si no se reproduce un fallo de salida o restablecimiento, se documenta el resultado sin introducir cambios de código innecesarios.
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

- **Sí:** validar primero la salida existente, porque la simulación inicial no reproduce el bloqueo reportado.
- **Sí:** combinar simulación y navegador, porque probar `moveGhost()` aisladamente no verifica la integración completa.
- **Sí:** admitir una resolución sin cambios de código si todos los criterios se cumplen, porque no se debe inventar una corrección.
- **No:** dar la verificación en navegador por realizada a partir de la simulación, porque son comprobaciones distintas.
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
| El bloqueo no se reproduce en el código actual. | Registrar evidencias y no atribuir una causa ni modificar código sin un fallo reproducible. |
| La simulación aislada oculta un problema de integración. | Comprobar también `update(game)` y el juego en navegador. |
| No se dispone de acceso al navegador durante la revisión. | Documentar la limitación y dejar los criterios correspondientes pendientes de verificación humana. |
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
- Cambios preventivos de navegación o restablecimiento sin un fallo reproducible.
