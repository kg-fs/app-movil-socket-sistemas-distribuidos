import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Mapa de imágenes optimizadas de Unsplash para cada producto
const IMAGENES_PRODUCTOS = {
  1: 'https://images.unsplash.com/photo-1496181130204-755241524eab?w=400&auto=format&fit=crop&q=80', // Laptop
  2: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&auto=format&fit=crop&q=80', // Mouse
  3: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=80', // Teclado
  4: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop&q=80', // Monitor
  5: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80', // Auriculares
  6: 'https://images.unsplash.com/photo-1598550476439-6847785fce6e?w=400&auto=format&fit=crop&q=80', // Silla Gamer
  7: 'https://images.unsplash.com/photo-1603184017905-b09f296c9c30?w=400&auto=format&fit=crop&q=80', // Webcam
  8: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&auto=format&fit=crop&q=80', // Microfono
  9: 'https://images.unsplash.com/photo-1597872200969-2b6c7a500f4f?w=400&auto=format&fit=crop&q=80', // Disco SSD 1TB
  10: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&auto=format&fit=crop&q=80', // Memoria RAM 16GB
  11: 'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=400&auto=format&fit=crop&q=80', // Tablet
  12: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80', // Smartphone
  13: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&auto=format&fit=crop&q=80', // Impresora
  14: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&auto=format&fit=crop&q=80', // Router WiFi
  15: 'https://images.unsplash.com/photo-1558538337-aab544368de8?w=400&auto=format&fit=crop&q=80', // Cable HDMI
};

const obtenerImagenProducto = (id) => {
  return IMAGENES_PRODUCTOS[id] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&auto=format&fit=crop&q=80';
};

const obtenerCategoria = (nombre) => {
  const n = text => text.toLowerCase();
  const lowerNombre = n(nombre);
  if (lowerNombre.includes('laptop') || lowerNombre.includes('tablet') || lowerNombre.includes('smartphone')) return 'Dispositivos';
  if (lowerNombre.includes('ssd') || lowerNombre.includes('ram')) return 'Componentes';
  if (lowerNombre.includes('silla')) return 'Mobiliario';
  if (lowerNombre.includes('wifi') || lowerNombre.includes('impresora') || lowerNombre.includes('router')) return 'Red/Oficina';
  return 'Accesorios';
};

const formatearPrecio = (valor) => {
  if (valor === undefined || valor === null) return '0';
  if (typeof valor === 'number') {
    if (isNaN(valor)) return '0';
    return valor.toLocaleString();
  }
  const num = Number(valor);
  if (isNaN(num)) return String(valor);
  return num.toLocaleString();
};

export default function App() {
  const [socket, setSocket] = useState(null);
  const [estadoConexion, setEstadoConexion] = useState('Conectando...');
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState('');
  const [correo, setCorreo] = useState('');
  const [proforma, setProforma] = useState(null);
  useEffect(() => {
    setEstadoConexion('Intentando conectar...');

    const ws = new WebSocket('ws://177.7.42.180:3000');

    const timeout = setTimeout(() => {
      setEstadoConexion('Sin respuesta del servidor (10s)');
    }, 10000);

    ws.onopen = () => {
      clearTimeout(timeout);
      setEstadoConexion('Conectado ✅');
      ws.send(JSON.stringify({ tipo: 'CATALOGO' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.tipo === 'CATALOGO_RESPONSE') {
          setProductos(data.productos);
          setEstadoConexion(`Conectado (${data.productos.length} productos)`);
        } else if (data.tipo === 'COMPRA_EXITOSA') {
          setProforma(data);
          Alert.alert(
            'Compra Exitosa',
            'La proforma fue generada y enviada a su correo.'
          );
          setCarrito([]);
        } else if (data.tipo === 'ERROR') {
          Alert.alert('Error del Servidor', data.mensaje);
        }
      } catch (e) {
        setEstadoConexion('Error al procesar respuesta');
      }
    };

    ws.onerror = (error) => {
      clearTimeout(timeout);
      setEstadoConexion('Error de conexión al servidor');
      Alert.alert(
        'Error de Conexión',
        'No se pudo conectar al servidor.\n\n¿El servidor está encendido?'
      );
    };

    ws.onclose = (event) => {
      clearTimeout(timeout);
      setEstadoConexion('Desconectado (Código: ' + event.code + ')');
    };

    setSocket(ws);

    return () => {
      clearTimeout(timeout);
      ws.close();
    };
  }, []);

  const agregarAlCarrito = (producto) => {
    setCarrito([...carrito, producto]);
  };

  const eliminarDelCarrito = (index) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito.splice(index, 1);
    setCarrito(nuevoCarrito);
  };

  const calcularTotal = () => {
    return carrito.reduce(
      (total, producto) => total + producto.precio,
      0
    );
  };

  const realizarCompra = () => {
    if (!cliente.trim()) {
      Alert.alert(
        'Error',
        'Ingrese el nombre del cliente'
      );
      return;
    }

    if (!correo.trim()) {
      Alert.alert(
        'Error',
        'Ingrese el correo electrónico'
      );
      return;
    }

    if (carrito.length === 0) {
      Alert.alert(
        'Error',
        'El carrito está vacío'
      );
      return;
    }

    // Agrupar los productos por ID para calcular la cantidad de cada uno
    const productosAgrupados = {};
    carrito.forEach((item) => {
      if (productosAgrupados[item.id]) {
        productosAgrupados[item.id].cantidad += 1;
      } else {
        productosAgrupados[item.id] = {
          id: item.id,
          cantidad: 1,
        };
      }
    });

    const productosCompra = Object.values(productosAgrupados);

    socket.send(
      JSON.stringify({
        tipo: 'COMPRA',
        cliente,
        correo,
        productos: productosCompra,
      })
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Encabezado */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>Bienvenido a</Text>
              <Text style={styles.titulo}>⚡ ElectroStore</Text>
            </View>
            <View style={[
              styles.badgeConexion,
              estadoConexion === 'Conectado' ? styles.badgeConectado :
                estadoConexion === 'Conectando...' ? styles.badgeConectando : styles.badgeDesconectado
            ]}>
              <View style={[
                styles.puntoConexion,
                { backgroundColor: estadoConexion === 'Conectado' ? '#10b981' : estadoConexion === 'Conectando...' ? '#f59e0b' : '#ef4444' }
              ]} />
              <Text style={styles.textoBadgeConexion}>
                {estadoConexion === 'Conectado' ? 'En línea' : estadoConexion}
              </Text>
            </View>
          </View>

          {/* Formulario Cliente */}
          <View style={styles.formulario}>
            <View style={styles.seccionTituloContainer}>
              <Ionicons name="person-outline" size={20} color="#4f46e5" />
              <Text style={styles.subtituloSeccion}>Datos de Facturación</Text>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="Nombre Completo"
                placeholderTextColor="#94a3b8"
                value={cliente}
                onChangeText={setCliente}
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="Correo Electrónico"
                placeholderTextColor="#94a3b8"
                value={correo}
                onChangeText={setCorreo}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Catálogo de Productos */}
          <View style={styles.seccionTituloContainer}>
            <Ionicons name="grid-outline" size={20} color="#4f46e5" />
            <Text style={styles.subtituloSeccion}>Catálogo de Productos</Text>
          </View>

          <FlatList
            data={productos}
            scrollEnabled={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const imagen = obtenerImagenProducto(item.id);
              const categoria = obtenerCategoria(item.nombre);
              return (
                <View style={styles.card}>
                  <Image
                    source={{ uri: imagen }}
                    style={styles.imagenProducto}
                    resizeMode="cover"
                  />

                  <View style={styles.infoProducto}>
                    <View style={styles.tagCategoriaContainer}>
                      <Text style={styles.tagCategoria}>{categoria}</Text>
                    </View>
                    <Text style={styles.nombre} numberOfLines={1}>
                      {item.nombre}
                    </Text>
                    <Text style={styles.precio}>
                      ${formatearPrecio(item.precio)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.botonAgregar}
                    onPress={() => agregarAlCarrito(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={22} color="white" />
                  </TouchableOpacity>
                </View>
              );
            }}
          />

          {/* Carrito de Compras */}
          <View style={styles.carritoHeader}>
            <View style={styles.seccionTituloContainer}>
              <Ionicons name="cart-outline" size={22} color="#4f46e5" />
              <Text style={styles.subtituloSeccion}>Tu Carrito</Text>
              {carrito.length > 0 && (
                <View style={styles.badgeContador}>
                  <Text style={styles.textoContador}>{carrito.length}</Text>
                </View>
              )}
            </View>

            {carrito.length > 0 && (
              <TouchableOpacity
                style={styles.botonVaciar}
                onPress={() => setCarrito([])}
                activeOpacity={0.6}
              >
                <Ionicons name="trash-outline" size={14} color="#ef4444" style={{ marginRight: 4 }} />
                <Text style={styles.textoVaciar}>Vaciar</Text>
              </TouchableOpacity>
            )}
          </View>

          {carrito.length === 0 ? (
            <View style={styles.carritoVacioContainer}>
              <Ionicons name="basket-outline" size={48} color="#cbd5e1" />
              <Text style={styles.vacio}>Tu carrito está vacío</Text>
            </View>
          ) : (
            carrito.map((item, index) => {
              const imagen = obtenerImagenProducto(item.id);
              return (
                <View key={index} style={styles.itemCarrito}>
                  <Image
                    source={{ uri: imagen }}
                    style={styles.imagenMini}
                    resizeMode="cover"
                  />

                  <View style={styles.infoCarrito}>
                    <Text style={styles.nombreMini} numberOfLines={1}>
                      {item.nombre}
                    </Text>
                    <Text style={styles.precioMini}>
                      ${item.precio}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.botonEliminar}
                    onPress={() => eliminarDelCarrito(index)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          {/* Tarjeta de Resumen y Compra */}
          {carrito.length > 0 && (
            <View style={styles.tarjetaResumen}>
              <View style={styles.filaResumen}>
                <Text style={styles.textoTotalEtiqueta}>Subtotal</Text>
                <Text style={styles.textoTotalValor}>${formatearPrecio(calcularTotal())}</Text>
              </View>

              <View style={styles.filaResumen}>
                <Text style={styles.textoTotalEtiqueta}>Envío</Text>
                <Text style={styles.textoTotalValorGratis}>Gratis</Text>
              </View>

              <View style={styles.divisor} />

              <View style={styles.filaTotal}>
                <Text style={styles.textoTotalPrincipal}>Total a Pagar</Text>
                <Text style={styles.valorTotalPrincipal}>${formatearPrecio(calcularTotal())}</Text>
              </View>

              <TouchableOpacity
                style={styles.botonComprar}
                onPress={realizarCompra}
                activeOpacity={0.8}
              >
                <Ionicons name="wallet-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.textoComprar}>
                  Confirmar Compra
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Proforma Generada */}
          {proforma && (
            <View style={styles.proforma}>
              <View style={styles.cabeceraTicket}>
                <Ionicons name="receipt-outline" size={26} color="#4f46e5" />
                <Text style={styles.tituloTicket}>Proforma Digital</Text>
              </View>

              <View style={styles.divisorTicket} />

              <View style={styles.filaTicket}>
                <Text style={styles.etiquetaTicket}>Cliente</Text>
                <Text style={styles.valorTicket}>{proforma.cliente}</Text>
              </View>

              <View style={styles.filaTicket}>
                <Text style={styles.etiquetaTicket}>Correo</Text>
                <Text style={styles.valorTicket} numberOfLines={1}>{proforma.correo}</Text>
              </View>

              <View style={styles.filaTicket}>
                <Text style={styles.etiquetaTicket}>Monto Total</Text>
                <Text style={[styles.valorTicket, { fontWeight: '700', color: '#10b981' }]}>
                  ${formatearPrecio(proforma.total)}
                </Text>
              </View>

              <View style={styles.divisorTicket} />

              <View style={styles.pdfContainer}>
                <Ionicons name="document-attach" size={22} color="#6366f1" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.pdfTitulo}>Archivo PDF Generado</Text>
                  <Text style={styles.pdfRuta} numberOfLines={1}>{proforma.pdf}</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  badgeConexion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeConectado: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  badgeConectando: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  badgeDesconectado: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  puntoConexion: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  textoBadgeConexion: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  formulario: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  seccionTituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subtituloSeccion: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '500',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  imagenProducto: {
    width: 85,
    height: 85,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  infoProducto: {
    flex: 1,
    paddingLeft: 14,
    justifyContent: 'center',
  },
  tagCategoriaContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  tagCategoria: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4f46e5',
    textTransform: 'uppercase',
  },
  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  precio: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4f46e5',
  },
  botonAgregar: {
    backgroundColor: '#4f46e5',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  carritoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  badgeContador: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  textoContador: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  botonVaciar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  textoVaciar: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  carritoVacioContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  vacio: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  itemCarrito: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  imagenMini: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  infoCarrito: {
    flex: 1,
    paddingLeft: 12,
  },
  nombreMini: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  precioMini: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  botonEliminar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
  },
  tarjetaResumen: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  textoTotalEtiqueta: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  textoTotalValor: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  textoTotalValorGratis: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '700',
  },
  divisor: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 14,
  },
  filaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  textoTotalPrincipal: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '700',
  },
  valorTotalPrincipal: {
    fontSize: 22,
    color: '#4f46e5',
    fontWeight: '800',
  },
  botonComprar: {
    backgroundColor: '#10b981',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  textoComprar: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  proforma: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cabeceraTicket: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tituloTicket: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginLeft: 8,
  },
  divisorTicket: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 12,
    borderStyle: 'dashed',
  },
  filaTicket: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  etiquetaTicket: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  valorTicket: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '700',
    maxWidth: '65%',
  },
  pdfContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  pdfTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
  pdfRuta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
});
