import { groupVocabulary } from '../vocabularyCategories';

const keysOf = (groups: ReturnType<typeof groupVocabulary>) => groups.map(g => g.key);
const wordsOf = (groups: ReturnType<typeof groupVocabulary>, key: string) =>
  groups.find(g => g.key === key)?.words ?? [];

describe('groupVocabulary', () => {
  it('reparte las palabras del modelo por categoria', () => {
    const groups = groupVocabulary(['rojo', 'hola', 'dos', 'gracias', 'azul']);
    expect(keysOf(groups)).toEqual(['greetings', 'courtesy', 'colors', 'numbers']);
    expect(wordsOf(groups, 'colors')).toEqual(['azul', 'rojo']);
  });

  it('ordena los numeros en orden numerico y no alfabetico', () => {
    const groups = groupVocabulary(['tres', 'dies', 'uno', 'dos', 'cinco']);
    expect(wordsOf(groups, 'numbers')).toEqual(['uno', 'dos', 'tres', 'cinco', 'dies']);
  });

  it('manda a "Otros" lo que no tiene categoria, en orden alfabetico', () => {
    const groups = groupVocabulary(['hola', 'cafe', 'baño', 'zapato']);
    expect(wordsOf(groups, 'others')).toEqual(['baño', 'cafe', 'zapato']);
  });

  it('pone en "Añadidos" solo las palabras grabadas que el modelo no trae', () => {
    const groups = groupVocabulary(['hola', 'baño'], ['Hola', 'bano', 'mesa', 'Casa', 'mesa']);
    expect(wordsOf(groups, 'added')).toEqual(['Casa', 'mesa']);
  });

  it('no devuelve grupos vacios', () => {
    expect(groupVocabulary([], [])).toEqual([]);
  });
});
