# Garibaldi: contexto del proyecto

- Web pública: https://garibaldipcb.com/menu/
- Repositorio: https://github.com/alexijoseg87/Garibaldi-Menu.git
- Código del menú: `menu/index.html`. Fotos en la raíz del repositorio.
- Publicación existente: los cambios enviados a `main` se despliegan en el dominio mediante Cloudflare. No crear una web duplicada en otro servicio.
- El navegador consulta `/api/menu`; `_worker.js` lo reenvía a `https://garibaldi-api.alexijoseg87.workers.dev/menu`.
- Los productos y precios provienen de Loyverse. El menú actualiza al abrir, al volver a la pestaña y cada 60 segundos mientras está visible.
- Preferencia del usuario: obtener el precio de la API, sin introducir precios manuales para productos nuevos.
- Estilo de fotos: producto aislado y centrado, fondo y mesa beige cálido, iluminación suave; bebidas frías con condensación.
- Cristal normal de botella es distinta de Cristal Extra Botella y Cristal Lata.
- Las fotografías ilustrativas deben conservar su indicación en `menuMedia`.
- Existen excepciones históricas con precios de respaldo para Corona, Coronita y jugo de mango. No usarlas como modelo para nuevos precios.
- No guardar credenciales ni tokens en este archivo.

## Trabajo del 2026-10-28

Se preparó la foto `garibaldi-cristal-botella.jpg` y la asociación automática por nombre para Cristal normal de botella. Se conserva el ID y precio de Loyverse y se aplica también después de cada sincronización. La consulta de API realizada inicialmente solo devolvió Cristal Extra, Cristal Extra Botella y Cristal Lata; confirmar la presencia del nuevo producto en Loyverse antes de afirmar que ya aparece en el menú.

Foto generada con la herramienta integrada de imágenes. Prompt: una botella completa de Cristal cubana regular, cristal verde, tapa plateada, etiqueta roja y blanca con palmera y sin la palabra Extra, centrada con condensación, fondo y mesa beige e iluminación cálida igual a las otras cervezas.
