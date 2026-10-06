# SPEC 03 — Power pellets y fantasmas comestibles

> **Status:** Implemented
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-10-05
> **Objective:** Añadir cuatro power pellets que permitan a Pac-Man comer fantasmas temporalmente y enviarlos de regreso a su casa.

## Alcance

**Incluido:**

- Cambios en `src/js/maze.js`, `src/js/game.js` y `src/js/render.js`.
- Cuatro pellets en `(1,3)`, `(26,3)`, `(1,23)` y `(26,23)`, sustituyendo puntos normales.
- Poder temporal, huida, puntuación encadenada y regreso a casa como ojos.
- Restauración consistente al perder una vida y reiniciar.
- Verificación mediante estados controlados y juego manual en el navegador.

**Fuera de alcance:**

- Sonidos y HUD nuevo.
- Nuevos mapas, niveles y persistencia.
- Cambios de velocidad, controles o dimensiones.
- Reproducción exacta del arcade y migración a movimiento por tiempo transcurrido.
- Verificación automática en navegador.

## Modelo de datos

- `src/js/maze.js`: carácter `o` para pellets, convertido por `parseTile()` al valor de casilla `4`.
- `game.powerFramesRemaining`: duración restante del poder; comienza en cero.
- `game.ghostsEatenDuringPower`: contador para calcular la puntuación encadenada; comienza en cero.
- Cada fantasma incorpora `returning`: indica que regresa a casa como ojos; comienza en `false`.
- `game.dotsRemaining` cuenta puntos normales y pellets pendientes.
- Las coordenadas continúan expresadas en casillas, con origen arriba a la izquierda.
- Los contadores avanzan únicamente durante llamadas a `update(game)` con la partida activa.
- `MAZE` sigue siendo la plantilla pristine; solo se modifica la copia en `game.grid` durante una partida.
- No se persiste ningún dato entre partidas.

## Reglas de comportamiento

### Consumo y duración

- Cada pellet desaparece, suma 50 puntos y decrementa `dotsRemaining` una sola vez.
- Activa el poder durante 360 actualizaciones activas, aproximadamente seis segundos a 60 FPS.
- La actualización que consume el pellet es la primera de esas 360 actualizaciones protegidas.
- Otro pellet renueva la duración a 360 actualizaciones y reinicia la cadena de puntuación.
- La activación ocurre antes de resolver colisiones de esa actualización.
- Una duración que comienza una actualización en uno todavía protege sus colisiones; el poder expira para la siguiente actualización.

### Fantasmas asustados

- Todos los fantasmas que no estén regresando son comestibles mientras el poder esté activo.
- Conservan la velocidad actual de 0.1 casillas por frame.
- Fuera de la casa, eligen el vecino legal más alejado de la casilla redondeada de Pac-Man según distancia euclídea al cuadrado.
- Conservan la restricción de no invertir salvo en callejones.
- Los empates se resuelven con el orden existente: `left`, `right`, `up`, `down`.
- Quienes esperan o salen mantienen su espera y ruta de salida.
- Esos fantasmas también son comestibles, pero comienzan a huir únicamente al completar la salida.
- Al terminar el poder, recuperan su color y personalidad.
- Las decisiones de movimiento siguen ocurriendo únicamente con ambas coordenadas alineadas.

### Comer y revivir

- Comer fantasmas consecutivos suma 200, 400, 800 y 1600 puntos; los siguientes mantienen 1600.
- Un fantasma comido activa `returning` y se dibuja únicamente como ojos.
- Durante el regreso no causa daño ni puede comerse de nuevo.
- Regresa por una ruta mínima transitable a su propia posición en `GHOST_STARTS`, identificada mediante `kind`.
- La ruta considera la puerta y la conexión horizontal de `TUNNEL_ROW`.
- Puede invertir dirección durante el regreso.
- Mantiene la velocidad actual durante el regreso.
- Al llegar alineado a su posición inicial, desactiva `returning`, revive y comienza la salida sin una nueva espera.
- Si todavía queda poder, vuelve a ser comestible y huye después de salir.
- Comer un fantasma no descuenta vidas ni interrumpe la resolución de otras colisiones.
- Cada fantasma puede otorgar puntuación una sola vez antes de completar su regreso y revivir.

### Victoria y restauración

- Ganar requiere consumir todos los puntos y pellets.
- Perder una vida cancela el poder y la cadena, y restaura posiciones, direcciones, esperas, salida y estado de regreso de los actores.
- La pérdida de una vida conserva puntuación y consumibles restantes.
- Reiniciar restaura pellets, puntos, puntuación, vidas y todos los estados iniciales.
- Fuera del poder, las colisiones mantienen las reglas actuales de pérdida de vida y derrota.

### Visuales

- Los pellets tienen radio de 6 px y parpadean.
- Los fantasmas asustados se dibujan azules.
- Durante las últimas 120 actualizaciones del poder alternan azul y blanco.
- Los ojos en regreso no muestran cuerpo ni parpadeo de advertencia.
- El renderizado refleja el estado del juego sin modificar temporizadores ni reglas.

## Plan de implementación

Cada paso debe dejar el juego ejecutable y verificable. Si un paso resulta demasiado grande, dividirlo en cambios funcionales pequeños sin ampliar el alcance.

1. **Incorporar pellets consumibles y visibles.** Actualizar el mapa y `parseTile()` en `src/js/maze.js`. Adaptar conteo y consumo en `src/js/game.js`, y dibujo en `src/js/render.js`. Comprobar posiciones, puntuación de 50, eliminación, condición de victoria y restauración al reiniciar.
2. **Añadir poder y colisiones comestibles.** Incorporar duración, renovación, cadena y estado `returning` en `src/js/game.js`. Excluir los fantasmas en regreso de las colisiones y conservar transitoriamente su movimiento existente hasta incorporar la ruta de regreso. Añadir su dibujo como ojos en `src/js/render.js`. Comprobar límites del temporizador, consumo y colisión en la misma actualización, puntuación y cancelación al perder una vida.
3. **Implementar navegación de regreso y revival.** Reutilizar la búsqueda existente para llegar a cada posición inicial mediante movimientos legales, permitiendo inversión durante el regreso. Enlazar la llegada alineada con la salida sin espera. Comprobar regreso por puerta y túnel, ausencia de daño y revival comestible mientras quede poder.
4. **Incorporar huida y apariencia asustada.** Añadir elección del vecino más alejado y mantener la prioridad regreso → espera/salida → huida o personalidad. Dibujar fantasmas azules y aviso azul/blanco durante las últimas 120 actualizaciones. Comprobar alineación, velocidad, salida durante el poder y recuperación de personalidades al expirar.

## Criterios de aceptación

- [ ] Aparecen exactamente cuatro pellets en las posiciones acordadas, con radio de 6 px y parpadeo.
- [ ] Cada pellet suma 50 puntos, desaparece y decrementa el contador una sola vez.
- [ ] Los puntos normales siguen sumando diez puntos.
- [ ] El poder protege exactamente 360 actualizaciones activas, incluyendo la que consume el pellet.
- [ ] Otro pellet renueva la duración y reinicia la cadena.
- [ ] Consumir un pellet protege ante una colisión comestible en esa misma actualización.
- [ ] Los fantasmas asustados eligen el vecino permitido más alejado de Pac-Man con el desempate definido.
- [ ] Los fantasmas conservan su velocidad y toman decisiones con coordenadas alineadas.
- [ ] Esperas y salidas de la casa siguen funcionando durante el poder.
- [ ] Los fantasmas en espera o salida son comestibles y solo comienzan a huir al completar la salida.
- [ ] La puntuación encadenada es 200, 400, 800 y 1600, con máximo de 1600 por captura posterior.
- [ ] Las colisiones con varios fantasmas comestibles en una actualización se resuelven sin descontar vidas.
- [ ] Un fantasma en regreso no otorga puntos adicionales ni causa daño.
- [ ] Los ojos regresan por una ruta mínima legal sin atravesar paredes y consideran puerta y túnel.
- [ ] Cada fantasma revive en su propia posición inicial y vuelve a salir sin espera adicional.
- [ ] Un fantasma revivido es comestible si aún queda poder.
- [ ] Los fantasmas asustados son azules y alternan azul/blanco durante las últimas 120 actualizaciones.
- [ ] Al expirar el poder se recuperan colores, personalidades y colisiones normales.
- [ ] Perder una vida cancela poder y cadena sin restaurar consumibles ni borrar puntuación.
- [ ] Reiniciar restaura todo el estado inicial, incluidos pellets y estados de regreso.
- [ ] La victoria requiere consumir también los pellets.
- [ ] Giros pendientes, bloqueo de la puerta para Pac-Man, túnel y overlays de victoria/derrota siguen funcionando.
- [ ] Abrir `src/index.html` y jugar manualmente no genera errores en la consola.
- [ ] Las comprobaciones controladas y manuales se documentan sin presentar pruebas pendientes como realizadas.

## Registro de verificación

- Comprobaciones controladas ejecutadas con Node.js y `vm`, cargando los scripts clásicos con un objeto `window` simulado.
- Paso 1: geometría, cuatro posiciones, consumo único, puntuación de pellets y puntos, plantilla intacta, reinicio, victoria incluyendo pellets y llamadas de dibujo con radio de 6 px y parpadeo.
- Paso 2: estado inicial, capturas simultáneas, primera y última actualización protegida de las 360, cadena y máximo de puntuación, exclusión de fantasmas en regreso, renovación, pérdida de vida, derrota, reinicio y dibujo solo de ojos.
- Paso 3: rutas mínimas legales para los cuatro fantasmas, paso por la puerta, llegada a la posición propia, salida sin espera, conexión del túnel, inversión, regreso sin daño y revival comestible. Se corrigieron dos supuestos de las comprobaciones: el destino propio no exige cruzar el túnel desde su borde y un punto bajo Pac-Man suma diez puntos durante una comprobación de colisión.
- Paso 4: huida por distancia y desempate, velocidad sin cambios, decisiones alineadas, espera y salida durante el poder, recuperación de personalidad y color, alternancia azul/blanco, prioridad del regreso y renderizado sin mutación del estado.
- `git diff --check` no detectó errores de espacios en los cuatro pasos.
- Pendiente: abrir `src/index.html` y verificar visualmente el juego, Start/reinicio, giros pendientes, bloqueo de puerta para Pac-Man, túnel, pérdida de vidas, overlays y ausencia de errores en la consola. No se ha ejecutado ni automatizado una comprobación en navegador; los criterios de aceptación permanecen sin marcar hasta su revisión final.

## Decisiones

- **Sí:** cuatro pellets en posiciones clásicas, sustituyendo puntos sin cambiar la geometría.
- **Sí:** temporización por frames activos, porque mantiene el modelo actual.
- **No:** duración basada en tiempo real, porque requeriría cambiar el modelo temporal.
- **Sí:** velocidades sin cambios, para preservar alineación con las casillas.
- **Sí:** huida determinista por distancia, para obtener un comportamiento sencillo y verificable.
- **No:** navegación aleatoria durante el poder, porque se eligió huida explícita.
- **Sí:** regreso navegado como ojos, porque conserva la mecánica visual elegida.
- **No:** teletransporte a la casa, porque elimina el recorrido solicitado.
- **Sí:** revival comestible mientras quede poder, permitiendo repetir capturas con puntuación máxima de 1600 por captura.
- **Sí:** renovación de duración y reinicio de cadena al comer otro pellet, para mantener reglas claras.
- **Sí:** prioridad regreso → espera/salida → huida o personalidad, para evitar interferencias entre estados.
- **Sí:** verificación controlada y juego manual, conservando la decisión previa de no automatizar el navegador.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La tasa de refresco cambia la duración real del poder. | Definir el contrato en actualizaciones activas y expresar los segundos como equivalencia nominal a 60 FPS. |
| El temporizador expira antes de resolver una colisión que debería proteger. | Comprobar explícitamente la primera y última actualización protegida y el consumo con colisión simultánea. |
| Huida o regreso interfiere con la salida de la casa. | Aplicar prioridad explícita de comportamientos y verificar espera, salida y revival durante el poder. |
| Un fantasma comido otorga puntos repetidamente por permanecer cerca de Pac-Man. | Activar `returning` en la primera captura y excluirlo de colisiones hasta revivir. |
| El regreso pierde alineación o ignora el túnel. | Reutilizar navegación existente, conservar velocidad y verificar llegada alineada a cada posición inicial. |
| Reiniciar o perder una vida conserva estados temporales. | Restaurar todos los campos nuevos en `createGame()` y `resetPositions()` según sus contratos. |
| La simulación no verifica visuales ni controles. | Mantener criterios de juego manual pendientes hasta su comprobación humana. |

## Qué **no** incluye esta spec

- Sonidos ni interfaz adicional.
- Nuevos mapas, niveles o persistencia.
- Cambios de velocidad, controles o dimensiones.
- Reproducción exacta del arcade.
- Migración a movimiento por tiempo transcurrido.
- Verificación automática en navegador.
