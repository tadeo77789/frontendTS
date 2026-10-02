/**
 * Graba repeticiones propias de cada seña para reajustar el modelo.
 *
 * El modelo aprendio de 25 personas grabadas en un estudio, con una camara,
 * una distancia y una luz concretas. Medido: señas que aciertan el 100% contra
 * señantes nuevos del dataset no salen nunca frente a otra camara. Eso no se
 * arregla con mas datos de estudio, sino con datos de la camara que se va a
 * usar.
 *
 * Lo grabado pasa por el MISMO segmentador y el mismo remuestreo que la
 * clasificacion en vivo (ver setSampleSink en modelWordEngine.web.ts), asi que
 * lo que se guarda es exactamente lo que el modelo vera despues. Grabarlo por
 * otro camino enseñaria algo que en vivo no ocurre.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../../../shared/components/common/AppHeader';
import { useColors } from '../../../app/providers/ThemeContext';
import {
  gestureEngine,
  wordVocabulary,
  wordState,
  setSampleSink,
  guardarMuestra,
  contarPorGlosa,
  borrarMuestrasDe,
  descargarMuestras,
} from '../../Translation/services/vision';
import { showConfirm, showError, showInfo } from '../../../shared/utils/dialogs';
import type { AdminStackParams } from '../../../app/routes/AdminStackNavigator';

type Nav = NativeStackNavigationProp<AdminStackParams>;

/**
 * Repeticiones por seña que hacen falta.
 *
 * Diez es el minimo con el que un reajuste nota la diferencia sin volverse un
 * trabajo de dias: 54 señas x 10 son 540 grabaciones, unas dos horas. Con
 * menos de cinco por seña el modelo apenas se mueve.
 */
const META_POR_SENA = 10;

export const ModelSamplesScreen: React.FC = () => {
  const C = useColors();
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const esAncho = width >= 900;

  const [permiso, pedirPermiso] = useCameraPermissions();
  const [encendida, setEncendida] = useState(false);
  const [glosas, setGlosas] = useState<string[]>([]);
  const [cuentas, setCuentas] = useState<Record<string, number>>({});
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [estado, setEstado] = useState<'quieto' | 'senando' | 'analizando'>('quieto');
  const [ultima, setUltima] = useState<string | null>(null);

  // La seña elegida se lee desde el callback del motor, que no se vuelve a
  // crear en cada render: sin el ref guardaria siempre la primera.
  const seleccionadaRef = useRef<string | null>(null);
  seleccionadaRef.current = seleccionada;

  const refrescar = useCallback(async () => {
    setCuentas(await contarPorGlosa());
  }, []);

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  const encender = useCallback(async () => {
    if (!permiso?.granted) {
      const res = await pedirPermiso();
      if (!res.granted) return;
    }

    setSampleSink(datos => {
      const glosa = seleccionadaRef.current;
      if (!glosa) return;
      const plano = new Float32Array(datos.length * datos[0].length);
      datos.forEach((frame, i) => plano.set(frame, i * frame.length));
      void guardarMuestra(glosa, plano)
        .then(() => {
          setUltima(glosa);
          return refrescar();
        })
        .catch(err => showError(String(err?.message ?? err)));
    });

    await gestureEngine.start(() => {});
    setEncendida(true);
    setGlosas(wordVocabulary().map(v => v.word));
  }, [permiso, pedirPermiso, refrescar]);

  const apagar = useCallback(() => {
    setSampleSink(null);
    gestureEngine.stop();
    setEncendida(false);
    setEstado('quieto');
  }, []);

  useEffect(() => () => {
    setSampleSink(null);
    gestureEngine.stop();
  }, []);

  useEffect(() => {
    if (!encendida) return;
    const id = setInterval(() => setEstado(wordState()), 200);
    return () => clearInterval(id);
  }, [encendida]);

  const borrar = useCallback(async (glosa: string) => {
    const ok = await showConfirm({
      title: 'Borrar repeticiones',
      message: `Se borran las ${cuentas[glosa] ?? 0} repeticiones de "${glosa}". No se puede deshacer.`,
      icon: 'warning',
      confirmText: 'Borrar',
      cancelText: 'Cancelar',
      destructive: true,
    });
    if (!ok) return;
    await borrarMuestrasDe(glosa);
    await refrescar();
  }, [cuentas, refrescar]);

  const exportar = useCallback(async () => {
    const n = await descargarMuestras();
    if (n === 0) {
      showInfo('Todavia no hay nada grabado.');
      return;
    }
    showInfo(
      `Se descargaron mis_muestras.json y mis_muestras.bin con ${n} repeticiones. ` +
        'Subelos a Colab para reajustar el modelo.',
      'Listo',
    );
  }, []);

  const total = Object.values(cuentas).reduce((a, b) => a + b, 0);
  const completas = glosas.filter(g => (cuentas[g] ?? 0) >= META_POR_SENA).length;
  const faltan = glosas.filter(g => (cuentas[g] ?? 0) < META_POR_SENA);

  const etiquetaEstado = !encendida
    ? 'Camara apagada'
    : !seleccionada
      ? 'Elige una seña de la lista'
      : estado === 'senando'
        ? 'Grabando…'
        : `Listo para grabar "${seleccionada}"`;

  return (
    <View style={[styles.root, { backgroundColor: C.backgroundGray }]}>
      <AppHeader showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>

          <View style={styles.hero}>
            <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={17} color={C.primaryDark} />
              <Text style={[styles.backLinkText, { color: C.primaryDark }]}>Volver</Text>
            </TouchableOpacity>
            <View style={[styles.heroBadge, { backgroundColor: C.primaryBg }]}>
              <Ionicons name="videocam-outline" size={14} color={C.primary} />
              <Text style={[styles.heroBadgeText, { color: C.primaryDark }]}>Modelo</Text>
            </View>
            <Text style={[styles.title, { color: C.textPrimary }]}>Mis repeticiones</Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
              El modelo aprendio de otras personas con otra camara. Estas grabaciones le enseñan la tuya.
              Elige una seña, hazla completa y detente: cada vez que te detengas se guarda una repeticion.
            </Text>
          </View>

          <View style={[styles.grid, esAncho && styles.gridWide]}>

            <View style={[styles.col, esAncho && styles.colLeft]}>
              <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={styles.camaraMarco}>
                  {encendida ? (
                    <CameraView style={styles.camara} facing="front" animateShutter={false} />
                  ) : (
                    <View style={[styles.camara, styles.camaraApagada, { backgroundColor: C.inputBg }]}>
                      <Ionicons name="videocam-off-outline" size={34} color={C.textHint} />
                    </View>
                  )}
                  {encendida && estado === 'senando' && (
                    <View style={styles.grabando}>
                      <View style={styles.puntoRojo} />
                      <Text style={styles.grabandoTexto}>grabando</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.estado, { color: C.textSecondary }]}>{etiquetaEstado}</Text>
                {ultima && (
                  <Text style={[styles.guardada, { color: C.primary }]}>
                    Guardada una repeticion de "{ultima}"
                  </Text>
                )}

                <TouchableOpacity
                  onPress={encendida ? apagar : encender}
                  activeOpacity={0.9}
                  style={[styles.boton, { backgroundColor: encendida ? C.inputBg : C.primary, borderColor: C.border }]}
                >
                  <Ionicons
                    name={encendida ? 'stop-outline' : 'play-outline'}
                    size={18}
                    color={encendida ? C.textPrimary : '#fff'}
                  />
                  <Text style={[styles.botonTexto, { color: encendida ? C.textPrimary : '#fff' }]}>
                    {encendida ? 'Detener camara' : 'Encender camara'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[styles.cardTitulo, { color: C.textPrimary }]}>Avance</Text>
                <View style={styles.cifras}>
                  <View style={styles.cifra}>
                    <Text style={[styles.cifraValor, { color: C.primary }]}>{total}</Text>
                    <Text style={[styles.cifraEtiqueta, { color: C.textHint }]}>repeticiones</Text>
                  </View>
                  <View style={styles.cifra}>
                    <Text style={[styles.cifraValor, { color: C.primary }]}>
                      {completas}/{glosas.length || '—'}
                    </Text>
                    <Text style={[styles.cifraEtiqueta, { color: C.textHint }]}>señas completas</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={exportar}
                  activeOpacity={0.9}
                  style={[styles.boton, { backgroundColor: C.inputBg, borderColor: C.border }]}
                >
                  <Ionicons name="download-outline" size={18} color={C.textPrimary} />
                  <Text style={[styles.botonTexto, { color: C.textPrimary }]}>Exportar para reajustar</Text>
                </TouchableOpacity>
                <Text style={[styles.nota, { color: C.textHint }]}>
                  Descarga dos archivos y los subes a Colab. Van aparte porque en JSON ocuparian
                  cuatro veces mas.
                </Text>
              </View>
            </View>

            <View style={[styles.col, esAncho && styles.colRight]}>
              <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[styles.cardTitulo, { color: C.textPrimary }]}>
                  Señas {glosas.length > 0 && `(${glosas.length})`}
                </Text>
                <Text style={[styles.cardSub, { color: C.textHint }]}>
                  {glosas.length === 0
                    ? 'Enciende la camara para cargar el vocabulario del modelo.'
                    : `Meta: ${META_POR_SENA} repeticiones por seña. Faltan ${faltan.length}.`}
                </Text>

                <View style={styles.lista}>
                  {glosas.map(glosa => {
                    const n = cuentas[glosa] ?? 0;
                    const lista = n >= META_POR_SENA;
                    const activa = seleccionada === glosa;
                    return (
                      <TouchableOpacity
                        key={glosa}
                        onPress={() => setSeleccionada(activa ? null : glosa)}
                        onLongPress={() => n > 0 && borrar(glosa)}
                        activeOpacity={0.85}
                        style={[
                          styles.item,
                          {
                            backgroundColor: activa ? C.primaryBg : C.inputBg,
                            borderColor: activa ? C.primary : C.border,
                          },
                        ]}
                      >
                        <Text style={[styles.itemTexto, { color: activa ? C.primaryDark : C.textPrimary }]}>
                          {glosa}
                        </Text>
                        <Text style={[styles.itemCuenta, { color: lista ? C.primary : C.textHint }]}>
                          {n}/{META_POR_SENA}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {glosas.length > 0 && (
                  <Text style={[styles.nota, { color: C.textHint }]}>
                    Toca una seña para elegirla. Manten pulsado para borrar sus repeticiones.
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: 48 },
  inner: { width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 18 },

  hero: { marginBottom: 20 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  backLinkText: { fontSize: 14, fontWeight: '700' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
  heroBadgeText: { fontSize: 12, fontWeight: '800' },
  title: { fontSize: 27, fontWeight: '800', marginTop: 10 },
  subtitle: { fontSize: 14, fontWeight: '500', marginTop: 8, lineHeight: 21, maxWidth: 640 },

  grid: { gap: 16 },
  gridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { gap: 16 },
  colLeft: { flex: 1.1 },
  colRight: { flex: 1 },

  card: { borderRadius: 20, borderWidth: 1, padding: 22 },
  cardTitulo: { fontSize: 17, fontWeight: '800' },
  cardSub: { fontSize: 13, fontWeight: '600', marginTop: 4, marginBottom: 14 },

  camaraMarco: { borderRadius: 16, overflow: 'hidden', aspectRatio: 4 / 3 },
  camara: { flex: 1 },
  camaraApagada: { alignItems: 'center', justifyContent: 'center' },
  grabando: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  puntoRojo: { width: 9, height: 9, borderRadius: 999, backgroundColor: '#EF4444' },
  grabandoTexto: { color: '#fff', fontSize: 12, fontWeight: '700' },

  estado: { fontSize: 14, fontWeight: '600', marginTop: 14, textAlign: 'center' },
  guardada: { fontSize: 13, fontWeight: '700', marginTop: 4, textAlign: 'center' },

  boton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 14, borderWidth: 1, paddingVertical: 13, marginTop: 14 },
  botonTexto: { fontSize: 14, fontWeight: '800' },
  nota: { fontSize: 12, fontWeight: '500', marginTop: 10, lineHeight: 17 },

  cifras: { flexDirection: 'row', gap: 14, marginTop: 14 },
  cifra: { flex: 1 },
  cifraValor: { fontSize: 24, fontWeight: '800' },
  cifraEtiqueta: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  lista: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  itemTexto: { fontSize: 13, fontWeight: '700' },
  itemCuenta: { fontSize: 12, fontWeight: '800' },
});
