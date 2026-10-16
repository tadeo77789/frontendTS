# Modelo de palabras (LSC)

Aqui van los archivos del modelo entrenado. La app los busca en
`/models/lsc/model.json` (ver `WORD_MODEL_URL` en `src/app/config/api.config.ts`).
Si no estan, el motor cae al GestureRecognizer de 7 gestos de Google.

Expo copia todo lo que haya en `public/` a la raiz del sitio, tanto en
`expo start --web` como en `expo export`, asi que no hay que tocar nada mas.

## Archivos esperados

    model.json               grafo del modelo
    group1-shard1of*.bin     pesos (los nombra el conversor; pueden ser varios)
    glosas.json              lista de palabras, en el orden de las salidas

## De donde salen

Los genera `backend/src/domains/ia/training/extraction/export_model.py`, o el
notebook `colab_export.ipynb` si se entreno en Colab. Se copian tal cual desde
`export/tfjs/`: los `.bin` se llaman como diga `model.json`, asi que no hay que
renombrarlos.

El `.tflite` de la misma exportacion es para la app movil y no va aqui.

## Comprobacion

Con la app corriendo, `/models/lsc/model.json` debe responder 200. En la
pantalla de traduccion, el motor activo aparece como `modelo-lsc` en vez de
`gestos`.
