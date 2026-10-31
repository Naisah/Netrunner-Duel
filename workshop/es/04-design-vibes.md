<!-- l10n-sync: source-file="04-design-vibes.md" -->
# Parte 4: Tematización orientada al diseño

---

En esta parte, usarás los flujos de planificación e implementación de Copilot para diseñar una transformación visual completa. Esto es desarrollo orientado al diseño: comienza con la visión, itera sobre los elementos visuales y deja que Copilot se encargue del trabajo pesado de CSS.

## Tarea 1: Planifica el Tema Retro

<!-- track:vscode:start -->
Cambia a modo **Plan** en GitHub Copilot Chat.
<!-- track:vscode:end -->

<!-- track:cli:start -->
Usa `/plan` en GitHub Copilot CLI o pulsa **Shift+Tab** hasta activar el modo de planificación.
<!-- track:cli:end -->

Ingresa este prompt:

> Quiero transformar esta página en una experiencia completa de arcade retro. Planifica una renovación visual integral que incluya: efectos de líneas de barrido CRT en el fondo, un brillo de neón en el título que pulse como un letrero, una insignia VS animada con cambios de color en degradado, una capa de brillo y resplandor en las tarjetas de resultados de usuarios, animaciones de entrada flotante para los campos de texto, texto de carga que cambie entre verde y morado, y efectos de resplandor al pasar el cursor sobre los cuadros de contribuciones. Mantén el fondo oscuro (#0a0a1a) y los colores de acento verde (#5fed83) y morado (#8a2be2). Usa un tema oscuro con la tipografía retro para videojuegos Press Start 2P de Google Fonts.

Copilot generará un plan detallado de implementación que cubre todos los efectos visuales. **No lo aceptes de inmediato** — revisa el plan e itera:

- Sugiere ajustes en la velocidad de las animaciones (por ejemplo, "Haz que el pulso de neón sea más lento, de unos 3 segundos").
- Pregunta sobre efectos específicos (por ejemplo, "¿Cómo funcionará la capa de brillo de las tarjetas?").
- Solicita cambios en el enfoque si algo no te convence

Una vez que estés satisfecho con el plan, deja que Copilot proceda con la implementación.

## Tarea 2: Implementa el Tema

<!-- track:vscode:start -->
Cambia a modo **Agent** y pide a Copilot que implemente el plan:
<!-- track:vscode:end -->

> Implementa el plan para el tema de arcade retro que acabamos de diseñar.

<!-- track:cli:start -->
Cuando estés satisfecho con el plan, pide a Copilot CLI que lo implemente.
<!-- track:cli:end -->

Copilot agregará múltiples animaciones CSS, pseudo-elementos y transiciones en tu hoja de estilos. Esto puede incluir:

- `@keyframes` para scanlines, pulso neón, shimmer y efectos de aparición flotante
- Pseudo-elementos (`::before`, `::after`) para efectos de superposición
- CSS custom properties para los colores del tema
- Transiciones y estados hover para elementos interactivos

Una vez aplicados los cambios, **revisa la vista previa en tu navegador** para ver la transformación completa al estilo retro arcade.

<!-- track:cli:start -->
Después de aplicar los cambios, usa `/diff` para revisar los cambios de estilo antes de aprobarlos.
<!-- track:cli:end -->

## Tarea 3: Ajusta las Vibras

> **⚠️ ¿No ves los cambios?** Si el nuevo tema o las animaciones no aparecen, detén el servidor de desarrollo (`Ctrl+C`), reinícialo con `npm run dev` y actualiza la página con una recarga forzada (`Ctrl+Shift+R`).

Mantén la vista previa del navegador abierta e itera sobre el diseño. Prueba prompts como:

> El efecto de líneas de barrido es demasiado intenso; reduce la opacidad a 0.03.

> Añade un sutil parpadeo eléctrico al texto del título.

> La insignia VS debería pulsar con más intensidad.

Esto es **desarrollo orientado al diseño** — estás iterando sobre la salida visual en tiempo real. Cada prompt refina la experiencia hasta que se sienta correcta. No te conformes con "suficientemente bueno" — perfecciona las vibras hasta que la página parezca pertenecer a un gabinete arcade.

## Tarea 4: Actualiza las Instrucciones

Tus instrucciones deben reflejar las decisiones de diseño importantes para que los siguientes prompts se mantengan alineados.

<!-- track:vscode:start -->
Pídele a Copilot Chat:

> Añade una sección de guía de diseño a `copilot-instructions.md` que describa el tema de arcade retro: colores, tipografías y estilo de animación.
<!-- track:vscode:end -->

<!-- track:cli:start -->
Pídele a Copilot CLI:

> Actualiza las instrucciones del repositorio con una breve guía de diseño para el tema de arcade retro: colores, tipografías, estilo de animación y la regla de que la nueva interfaz debe mantener la estética de neón.
<!-- track:cli:end -->

Haz commit de las instrucciones y los cambios de diseño cuando la página se vea como quieres.

## ✅ Parte 4 Completa

**Lo que aprendiste:**

- Usar flujos de planificación para diseñar un **sistema visual antes de implementarlo**
- **Iterar sobre los resultados visuales** con comentarios de seguimiento rápidos
- **Actualizar las instrucciones tras tomar decisiones importantes** para que Copilot mantenga la identidad visual
