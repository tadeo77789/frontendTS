// jest-expo reemplaza los Web Streams por su polyfill, pero Request sigue siendo el de Node.
// axios, al cargarse, crea un ReadableStream para un Request y luego lo cancela: con la mezcla,
// cancel() rechaza sin que nadie lo atienda y Node termina el proceso. En los tests se usan
// los streams nativos de Node, que son los que entiende su Request.
const webStreams = require('node:stream/web');

globalThis.ReadableStream = webStreams.ReadableStream;
globalThis.WritableStream = webStreams.WritableStream;
globalThis.TransformStream = webStreams.TransformStream;
