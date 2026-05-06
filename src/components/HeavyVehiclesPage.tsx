import React, { useState, useMemo, useEffect } from 'react';
import { ModernFormContainer } from './ModernFormContainer';
import { ModernSelect } from './ModernSelect';
import { ModernInput } from './ModernInput';
import { firebaseHeavyVehiclesStorage, HeavyVehicleRecord } from '../services/firebaseHeavyVehiclesStorage';
import {
  getMunicipios,
  addUserMunicipio,
  addUserDistrito
} from '../services/municipioService';
import './HeavyVehiclesPage.css';

interface HeavyVehiclesPageProps {
  onClose: () => void;
}

const regionesRD = [
  'Ozama o Metropolitana',
  'Cibao Norte',
  'Cibao Sur',
  'Cibao Nordeste',
  'Cibao Noroeste',
  'Santiago',
  'Valdesia',
  'Enriquillo',
  'El Valle',
  'Yuma',
  'Higuamo'
];

const provinciasPorRegion: Record<string, string[]> = {
  'Ozama o Metropolitana': ['Distrito Nacional', 'Santo Domingo'],
  'Cibao Norte': ['Puerto Plata', 'Espaillat'],
  'Cibao Sur': ['La Vega', 'Monseñor Nouel', 'Sánchez Ramírez'],
  'Cibao Nordeste': ['Duarte', 'María Trinidad Sánchez', 'Samaná', 'Hermanas Mirabal'],
  'Cibao Noroeste': ['Valverde', 'Monte Cristi', 'Dajabón', 'Santiago Rodríguez'],
  'Santiago': ['Santiago'],
  'Valdesia': ['San Cristóbal', 'Peravia', 'San José de Ocoa'],
  'Enriquillo': ['Barahona', 'Pedernales', 'Independencia', 'Bahoruco'],
  'El Valle': ['San Juan', 'Elías Piña', 'Azua'],
  'Yuma': ['La Altagracia', 'La Romana', 'El Seibo'],
  'Higuamo': ['San Pedro de Macorís', 'Hato Mayor', 'Monte Plata']
};

const municipiosPorProvinciaDefault: Record<string, string[]> = {
  'Distrito Nacional': ['Zona Colonial', 'Gazcue', 'Ciudad Nueva', 'San Carlos', 'Villa Juana', 'Cristo Rey', 'La Esperilla'],
  'Santo Domingo': ['Los Alcarrizos', 'Pedro Brand', 'San Antonio de Guerra', 'Boca Chica', 'Santo Domingo Este', 'Santo Domingo Norte', 'Santo Domingo Oeste'],
  'Puerto Plata': ['Puerto Plata', 'Altamira', 'Guananico', 'Imbert', 'Los Hidalgos', 'Luperón', 'Río San Juan', 'Villa Isabela', 'Villa Montellano'],
  'Espaillat': ['Moca', 'Cayetano Germosén', 'Gaspar Hernández', 'Jamao al Norte'],
  'La Vega': ['La Vega', 'Cotuí', 'Constanza'],
  'Monseñor Nouel': ['Bonao', 'Maimón', 'Cevicos'],
  'Sánchez Ramírez': ['Cotuí', 'Cevicos', 'Fantino'],
  // resto opcional para esta implementación
};

const distritosPorMunicipio: Record<string, string[]> = {
  'Santo Domingo Este': ['San Luis', 'Mendoza', 'San Isidro'],
  'Santo Domingo Norte': ['La Victoria', 'Villa Mella'],
  'Santo Domingo Oeste': ['Hato Nuevo', 'Altos de Arroyo Hondo'],
  'Boca Chica': ['La Caleta'],
  'Los Alcarrizos': ['Palmarejo-Villa Linda'],
  'Monte Plata': ['Chirino', 'Don Juan'],
  'Moca': ['José Contreras', 'San Víctor', 'Juan López'],
  'Puerto Plata': ['Yásica Arriba'],
  'La Vega': ['Parque Duarte'],
  'Duarte': ['Nagua'],
};

const opcionesIntervencion = [
  'Rehabilitación Camino Vecinal',
  'Rehabilitación acceso a mina',
  'Restauración Calles comunidad',
  'Confección de cabezal de puente',
  'Restauración de vías de Comunicación',
  'Operativo de Emergencia',
  'Limpieza de alcantarillas',
  'Confección de puente',
  'Limpieza de Cañada',
  'Colocación de alcantarillas',
  'Canalización',
  'Desalojo',
  'Habilitación Zona protegida o Espacio público'
];

const canalOptions = ['Río', 'Arroyo', 'Cañada'];

const heavyVehicleTypes = [
  'Excavadora',
  'Retroexcavadora',
  'Motoniveladora',
  'Rodillo Compactador',
  'Rodillo Liso',
  'Rodillo Pata de Cabra',
  'Rodillo Neumático',
  'Cargador Frontal',
  'Bulldozer',
  'Camión Volquete',
  'Camión Cisterna',
  'Camión de Carga',
  'Compactadora',
  'Compactadora Vibratoria',
  'Pavimentadora',
  'Finisher',
  'Recicladora de Asfalto',
  'Fresadora',
  'Barredora',
  'Distribuidor de Asfalto',
  'Planta de Asfalto',
  'Planta de Concreto',
  'Mezcladora de Concreto',
  'Bomba de Concreto',
  'Vibradora de Concreto',
  'Zanjadora',
  'Perforadora',
  'Martillo Hidráulico',
  'Grúa',
  'Minicargador',
  'Tractor',
  'Generador Eléctrico',
  'Compresor de Aire',
  'Otros'
];

const HeavyVehiclesPage: React.FC<HeavyVehiclesPageProps> = ({ onClose }) => {
  const [tipoIntervencion, setTipoIntervencion] = useState('');
  const [subTipoCanal, setSubTipoCanal] = useState('');
  const [region, setRegion] = useState('');
  const [provincia, setProvincia] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [distrito, setDistrito] = useState('');
  const [mostrarAgregarDistrito, setMostrarAgregarDistrito] = useState(false);
  const [nuevoDistrito, setNuevoDistrito] = useState('');
  const [mostrarAgregarMunicipio, setMostrarAgregarMunicipio] = useState(false);
  const [nuevoMunicipio, setNuevoMunicipio] = useState('');
  const [municipiosPorProvinciaState, setMunicipiosPorProvinciaState] = useState<Record<string, string[]>>({});
  const [distritosPorMunicipioState, setDistritosPorMunicipioState] = useState<Record<string, string[]>>(distritosPorMunicipio);
  const [fechaInicio, setFechaInicio] = useState('');
  const [hastaLaFecha, setHastaLaFecha] = useState(true);
  const [fechaFinal, setFechaFinal] = useState('');

  const [vehiculosDetalles, setVehiculosDetalles] = useState<Array<{ tipo: string; modelo: string; ficha: string; fichaError?: string }>>([
    { tipo: '', modelo: '', ficha: '', fichaError: '' }
  ]);
  const [numeroVehiculos, setNumeroVehiculos] = useState<number>(1);

  const [tipoVehiculosDisponibles] = useState<string[]>(heavyVehicleTypes);

  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [municipioAgregado, setMunicipioAgregado] = useState(false);

  const provinciasDisponibles = useMemo(() => (region ? provinciasPorRegion[region] || [] : []), [region]);
  const municipiosDisponibles = useMemo(() => (provincia ? municipiosPorProvinciaState[provincia] || [] : []), [provincia, municipiosPorProvinciaState]);
  const distritosDisponibles = useMemo(() => (municipio ? distritosPorMunicipioState[municipio] || [] : []), [municipio, distritosPorMunicipioState]);

  useEffect(() => {
    let isMounted = true;

    const loadMunicipios = async () => {
      try {
        const data = await getMunicipios();
        if (!isMounted) return;

        setMunicipiosPorProvinciaState(
          Object.fromEntries(
            Object.entries(data.municipalities).map(([prov, props]) => [prov, props.municipios])
          )
        );

        const distritosMap: Record<string, string[]> = {};
        for (const perm of Object.values(data.municipalities)) {
          if (perm.distritos) {
            Object.entries(perm.distritos).forEach(([mun, dist]) => {
              distritosMap[mun] = dist;
            });
          }
        }

        setDistritosPorMunicipioState(prev => ({ ...prev, ...distritosMap }));
      } catch (err) {
        console.error('Error cargando municipios jerárquicos:', err);
      }
    };

    loadMunicipios();

    const refreshTimer = window.setInterval(() => {
      getMunicipios().then(data => {
        setMunicipiosPorProvinciaState(
          Object.fromEntries(
            Object.entries(data.municipalities).map(([prov, props]) => [prov, props.municipios])
          )
        );
        const distritosMap: Record<string, string[]> = {};
        for (const perm of Object.values(data.municipalities)) {
          if (perm.distritos) {
            Object.entries(perm.distritos).forEach(([mun, dist]) => {
              distritosMap[mun] = dist;
            });
          }
        }
        setDistritosPorMunicipioState(prev => ({ ...prev, ...distritosMap }));
      }).catch(() => {});
    }, 15 * 24 * 60 * 60 * 1000); // 15 días

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const handleVehiculoChange = (index: number, field: 'tipo' | 'modelo' | 'ficha', value: string) => {
    setVehiculosDetalles(prev => {
      const next = [...prev];
      const row = { ...next[index] };
      if (field === 'ficha') {
        const raw = value.toUpperCase();
        // Limpiar caracteres inválidos y usar el formato: LL-NNNNN
        const sanitized = raw.replace(/[^A-Z0-9-]/g, '');
        const sinGuion = sanitized.replace(/-/g, '');

        const letras = sinGuion.slice(0, 2).replace(/[^A-Z]/g, '');
        const numeros = sinGuion.slice(2).replace(/[^0-9]/g, '');

        let fichaFormateada = letras;
        if (letras.length === 2) {
          fichaFormateada += '-';
          fichaFormateada += numeros;
        }

        row.ficha = fichaFormateada;
        row.fichaError = fichaFormateada && !/^[A-Z]{2}-\d+$/.test(fichaFormateada)
          ? 'Formato inválido: debe ser dos letras mayúsculas, un guion y números (Ej. AB-12345).'
          : '';
      } else {
        row[field] = value;
      }
      next[index] = row;
      return next;
    });
  };

  const addVehiculo = () => {
    setVehiculosDetalles(prev => [...prev, { tipo: '', modelo: '', ficha: '', fichaError: '' }]);
    setNumeroVehiculos(prev => prev + 1);
  };



  const removeVehiculo = (index: number) => {
    setVehiculosDetalles(prev => prev.filter((_, i) => i !== index));
    setNumeroVehiculos(prev => Math.max(1, prev - 1));
  };

  const setCantidadVehiculos = (cantidad: number | string) => {
    let numeric = Number(cantidad);
    if (Number.isNaN(numeric) || cantidad === '') {
      numeric = 0;
    }

    if (numeric < 0) numeric = 0;
    if (numeric > 50) numeric = 50;

    setNumeroVehiculos(numeric);
    setVehiculosDetalles(prev => {
      const next = [...prev];
      if (numeric > next.length) {
        for (let i = next.length; i < numeric; i++) {
          next.push({ tipo: '', modelo: '', ficha: '', fichaError: '' });
        }
      } else if (numeric < next.length) {
        next.splice(numeric);
      }
      return next;
    });
  };

  const resetForm = () => {
    setRegion('');
    setProvincia('');
    setMunicipio('');
    setDistrito('');
    setFechaInicio('');
    setHastaLaFecha(true);
    setFechaFinal('');
    setVehiculosDetalles([{ tipo: '', modelo: '', ficha: '', fichaError: '' }]);
  };

  const handleAddMunicipio = () => {
    const nombre = nuevoMunicipio.trim();
    if (!provincia) {
      setMensaje('Seleccione primero la provincia antes de agregar municipio.');
      return;
    }
    if (!nombre) {
      setMensaje('Ingrese el nombre del municipio a agregar.');
      return;
    }

    const existingMunicipios = municipiosPorProvinciaState[provincia] || [];
    if (existingMunicipios.includes(nombre)) {
      setMensaje('El municipio ya existe en la provincia seleccionada.');
      return;
    }

    const updatedMunicipios = [...existingMunicipios, nombre].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    setMunicipiosPorProvinciaState(prev => ({
      ...prev,
      [provincia]: updatedMunicipios
    }));
    addUserMunicipio(provincia, nombre);
    setMunicipio(nombre);
    setMostrarAgregarMunicipio(false);
    setNuevoMunicipio('');
    
    // Mostrar animación de "Agregado"
    setMunicipioAgregado(true);
    setMensaje(`Municipio '${nombre}' agregado a ${provincia} y seleccionado.`);
    
    // Ocultar animación después de 3 segundos
    setTimeout(() => {
      setMunicipioAgregado(false);
    }, 3000);
  };

  const handleAddDistrito = () => {
    const nombre = nuevoDistrito.trim();
    if (!municipio) {
      setMensaje('Seleccione primero el municipio antes de agregar el distrito.');
      return;
    }
    if (!nombre) {
      setMensaje('Ingrese el nombre del distrito a agregar.');
      return;
    }

    const existingDistritos = distritosPorMunicipioState[municipio] || [];
    if (existingDistritos.includes(nombre)) {
      setMensaje('El distrito ya existe en el municipio seleccionado.');
      return;
    }

    const updatedDistritos = [...existingDistritos, nombre].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    setDistritosPorMunicipioState(prev => ({
      ...prev,
      [municipio]: updatedDistritos
    }));
    addUserDistrito(municipio, nombre);
    setDistrito(nombre);
    setMostrarAgregarDistrito(false);
    setNuevoDistrito('');
    setMensaje(`Distrito '${nombre}' agregado a ${municipio} y seleccionado.`);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!tipoIntervencion) {
      setMensaje('Seleccione el tipo de intervención.');
      return;
    }

    if (tipoIntervencion === 'Canalización' && !subTipoCanal) {
      setMensaje('Seleccione el tipo de canal.');
      return;
    }

    if (!region || !provincia || !municipio || !distrito) {
      setMensaje('Por favor complete todos los campos de dirección jerárquica.');
      return;
    }

    if (!fechaInicio) {
      setMensaje('Seleccione fecha de inicio.');
      return;
    }

    if (!hastaLaFecha && !fechaFinal) {
      setMensaje('Seleccione fecha final o marque "Hasta la fecha".');
      return;
    }

    if (vehiculosDetalles.length === 0) {
      setMensaje('Agregue al menos un vehículo.');
      return;
    }

    for (let index = 0; index < vehiculosDetalles.length; index++) {
      const vehiculo = vehiculosDetalles[index];
      if (!vehiculo.tipo) {
        setMensaje(`Complete el tipo para el vehículo #${index + 1}.`);
        return;
      }
      if (!vehiculo.ficha || vehiculo.fichaError) {
        setMensaje(`Ficha inválida para el vehículo #${index + 1}.`);
        return;
      }
    }

    const baseRecord: Omit<HeavyVehicleRecord, 'id' | 'tipoVehiculo' | 'modelo' | 'ficha' | 'cantidadVehiculos'> = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tipoIntervencion,
      subTipoCanal: tipoIntervencion === 'Canalización' ? subTipoCanal : undefined,
      region,
      provincia,
      municipio,
      distrito,
      fechaInicio,
      hastaLaFecha,
      fechaFinal: hastaLaFecha ? new Date().toISOString().slice(0, 10) : fechaFinal,
      usuarioId: undefined,
      observaciones: 'Registro de vehículo pesado de formulario múltiple'
    };

    try {
      // Guardar distrito como parte de catálogo de distritos para este municipio.
      if (distrito && municipio) {
        const existingDistritos = distritosPorMunicipioState[municipio] || [];
        if (!existingDistritos.includes(distrito)) {
          const updatedDistritos = [...existingDistritos, distrito].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
          setDistritosPorMunicipioState(prev => ({
            ...prev,
            [municipio]: updatedDistritos
          }));
          addUserDistrito(municipio, distrito);
        }
      }

      setGuardando(true);
      await Promise.all(vehiculosDetalles.map(async (vehiculo) => {
        const id = crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

        const record: HeavyVehicleRecord = {
          id,
          ...baseRecord,
          cantidadVehiculos: 1,
          tipoVehiculo: vehiculo.tipo,
          modelo: vehiculo.modelo || undefined,
          ficha: vehiculo.ficha
        };

        await firebaseHeavyVehiclesStorage.saveHeavyVehicle(record);
      }));

      setMensaje('Todos los vehículos se guardaron en Firebase correctamente.');
      resetForm();
    } catch (error) {
      setMensaje('Error guardando el registro. Vea la consola.');
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="heavy-vehicles-page">
      <div className="topbar-modern">
        <button
          title="Volver al Dashboard"
          className="topbar-back-button-modern"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <div className="topbar-actions-modern">
          <h1 className="topbar-title">Registro Vehículos Pesados</h1>
        </div>
      </div>

      <div className="heavy-vehicles-content">
        <ModernFormContainer
          title="Nuevo registro de vehículo pesado"
          subtitle="Complete los datos para almacenar en Firestore"
          icon="🚚"
        >
          <form onSubmit={onSubmit}>
            {/* 1. Select de actividades - Tipo de Intervención */}
            <div className="form-row">
              <ModernSelect
                id="tipoIntervencion"
                icon="🛠️"
                hint="Tipo de Intervención"
                placeholder="Seleccionar actividad"
                value={tipoIntervencion}
                options={opcionesIntervencion.map(opcion => ({ value: opcion, label: opcion }))}
                required
                onChange={setTipoIntervencion}
              />

              {tipoIntervencion === 'Canalización' && (
                <ModernSelect
                  id="subTipoCanal"
                  icon="💧"
                  hint="Tipo de Canal"
                  placeholder="Seleccionar tipo de canal"
                  value={subTipoCanal}
                  options={canalOptions.map(opcion => ({ value: opcion, label: opcion }))}
                  required
                  onChange={setSubTipoCanal}
                />
              )}
            </div>

            {/* 2. Select de regiones */}
            <div className="form-row">
              <ModernSelect
                id="region"
                icon="🗺️"
                hint="Región"
                placeholder="Seleccionar región"
                value={region}
                options={regionesRD.map(r => ({ value: r, label: r }))}
                required
                onChange={setRegion}
              />
            </div>

            {/* 3. Filtro de búsqueda por municipios */}
            <div className="form-row">
              <ModernSelect
                id="municipio"
                icon="🏘️"
                hint="Municipio (Filtro de búsqueda)"
                placeholder={provincia ? 'Buscar municipio...' : '— seleccione provincia primero —'}
                value={municipio}
                options={municipiosDisponibles.map(m => ({ value: m, label: `${m}, ${provincia}` }))}
                disabled={!provincia}
                required
                onChange={setMunicipio}
              />
            </div>

            {/* 4. Botón agregar municipio */}
            <div className="form-row">
              <button
                type="button"
                className="btn-modern"
                onClick={() => {
                  if (!provincia) {
                    setMensaje('Seleccione primero la provincia');
                    return;
                  }
                  setNuevoMunicipio('');
                  setMostrarAgregarMunicipio(true);
                }}
                style={{ background: '#2a9d8f', maxWidth: '300px' }}
              >
                ➕ Agregar municipio
              </button>
            </div>

            {/* 5. Select de provincias de la región seleccionada */}
            <div className="form-row">
              <ModernSelect
                id="provincia"
                icon="📍"
                hint="Provincia"
                placeholder={region ? 'Seleccionar provincia' : '— primero región —'}
                value={provincia}
                options={provinciasDisponibles.map(p => ({ value: p, label: p }))}
                disabled={!region}
                required
                onChange={setProvincia}
              />
            </div>

            {/* Distrito municipal */}
            <div className="form-row">
              <ModernSelect
                id="distrito"
                icon="🏙️"
                hint="Distrito Municipal"
                placeholder={municipio ? 'Seleccionar distrito' : '— primero municipio —'}
                value={distrito}
                options={[
                  ...distritosDisponibles.map(d => ({ value: d, label: d })),
                  { value: 'otros', label: '➕ Otro distrito', special: true }
                ]}
                disabled={!municipio}
                required
                onChange={(val) => {
                  if (val === 'otros') {
                    setMostrarAgregarDistrito(true);
                    setDistrito('');
                  } else {
                    setDistrito(val);
                  }
                }}
              />
            </div>

            {/* 9. Select de fecha de inicio */}
            <div className="form-row">
              <ModernInput
                id="fechaInicio"
                type="date"
                label="Fecha de inicio"
                placeholder="Fecha de inicio"
                value={fechaInicio}
                onChange={(val) => setFechaInicio(String(val))}
                required
              />

              <div className="modern-input-container">
                <label>
                  <input
                    type="checkbox"
                    checked={hastaLaFecha}
                    onChange={(ev) => {
                      setHastaLaFecha(ev.target.checked);
                      if (ev.target.checked) setFechaFinal('');
                    }}
                  />
                  {' '}Hasta la fecha
                </label>
              </div>

              <ModernInput
                id="fechaFinal"
                type="date"
                label="Fecha final"
                placeholder="Fecha final"
                value={fechaFinal}
                onChange={(val) => setFechaFinal(String(val))}
                disabled={hastaLaFecha}
                required={!hastaLaFecha}
              />
            </div>

            {/* 10. Select de total de vehículos (0-99) */}
            <div className="form-row" style={{ flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
                <h3>Total de vehículos: {vehiculosDetalles.length}</h3>
                <ModernSelect
                  id="numVehiculos"
                  icon="🔢"
                  hint="Cantidad de vehículos (0-99)"
                  placeholder="Seleccionar cantidad"
                  value={String(numeroVehiculos)}
                  options={Array.from({ length: 100 }, (_, i) => ({ value: String(i), label: String(i) }))}
                  onChange={(val) => setCantidadVehiculos(Number(val))}
                />
              </div>

              {/* 11. Mini informe - Select de modelo de vehículos pesados disponibles */}
              {vehiculosDetalles.map((vehiculo, index) => (
                <div key={index} className="vehicle-row" style={{ border: '1px solid #444', padding: '12px', borderRadius: '8px', background: '#1a1d2e' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#2a9d8f' }}>Vehículo #{index + 1}</h4>
                  
                  <div className="form-row" style={{ gap: '8px' }}>
                    <ModernSelect
                      id={`tipoVehiculo_${index}`}
                      icon="🚛"
                      hint={`Modelo de vehículo pesado`}
                      placeholder="Seleccionar modelo"
                      value={vehiculo.tipo}
                      options={tipoVehiculosDisponibles.map(val => ({ value: val, label: val }))}
                      required
                      onChange={(val) => handleVehiculoChange(index, 'tipo', val)}
                    />

                    <ModernInput
                      id={`modelo_${index}`}
                      type="text"
                      label="Marca/Modelo (opcional)"
                      placeholder="Ej. CAT 320"
                      value={vehiculo.modelo}
                      onChange={(val) => handleVehiculoChange(index, 'modelo', String(val))}
                    />
                  </div>

                  <ModernInput
                    id={`ficha_${index}`}
                    type="text"
                    label={`Ficha CV-${String(index + 1).padStart(5, '0')}`}
                    placeholder="Ej. AB-12345"
                    value={vehiculo.ficha}
                    onChange={(val) => handleVehiculoChange(index, 'ficha', String(val))}
                    required
                  />
                  {vehiculo.fichaError && (
                    <p style={{ color: '#ffb703', marginTop: '-0.8rem', fontSize: '0.85rem' }}>
                      {vehiculo.fichaError}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="btn-modern"
              disabled={guardando}
              style={{ maxWidth: '240px', marginTop: '0.5rem' }}
            >
              {guardando ? 'Guardando...' : 'Guardar Registro'}
            </button>

            {mensaje && <p style={{ marginTop: '1rem', color: '#fff' }}>{mensaje}</p>}
          </form>

          {mostrarAgregarMunicipio && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}>
              <div style={{
                width: '90%',
                maxWidth: '420px',
                background: '#10121a',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                padding: 16
              }}>
                <h2 style={{ margin: '0 0 8px', color: '#fff', fontSize: '1.1rem' }}>Agregar municipio existente</h2>
                <p style={{ color: '#ddd', margin: '0 0 12px' }}>
                  Provincia: <strong>{provincia || '(seleccionar provincia primero)'}</strong>
                </p>
                <ModernInput
                  id="nuevoMunicipio"
                  type="text"
                  label="Nombre del municipio"
                  placeholder="Ej. San Francisco de Macorís"
                  value={nuevoMunicipio}
                  onChange={(val) => setNuevoMunicipio(String(val))}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                  <button type="button" className="btn-modern" onClick={() => setMostrarAgregarMunicipio(false)} style={{ background: '#565a69' }}>
                    Cancelar
                  </button>
                  <button type="button" className="btn-modern" onClick={handleAddMunicipio} style={{ background: '#2a9d8f' }}>
                    Agregar municipio
                  </button>
                </div>
              </div>
            </div>
          )}

          {mostrarAgregarDistrito && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}>
              <div style={{
                width: '90%',
                maxWidth: '420px',
                background: '#10121a',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                padding: 16
              }}>
                <h2 style={{ margin: '0 0 8px', color: '#fff', fontSize: '1.1rem' }}>Agregar distrito municipal</h2>
                <p style={{ color: '#ddd', margin: '0 0 12px' }}>
                  Municipio: <strong>{municipio || '(seleccionar municipio primero)'}</strong>
                </p>
                <ModernInput
                  id="nuevoDistrito"
                  type="text"
                  label="Nombre del distrito"
                  placeholder="Ej. Los Pinos"
                  value={nuevoDistrito}
                  onChange={(val) => setNuevoDistrito(String(val))}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                  <button type="button" className="btn-modern" onClick={() => setMostrarAgregarDistrito(false)} style={{ background: '#565a69' }}>
                    Cancelar
                  </button>
                  <button type="button" className="btn-modern" onClick={handleAddDistrito} style={{ background: '#2a9d8f' }}>
                    Agregar distrito
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 8. Animación de aguardado de municipio agregado */}
          {municipioAgregado && (
            <div style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              background: 'linear-gradient(135deg, #2a9d8f, #26866f)',
              color: '#fff',
              padding: '16px 24px',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(42, 157, 143, 0.4)',
              zIndex: 10000,
              animation: 'slideInRight 0.3s ease-out',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: '280px'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <div>
                <strong style={{ display: 'block', fontSize: '1rem' }}>¡Agregado!</strong>
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Municipio agregado exitosamente</span>
              </div>
            </div>
          )}

        </ModernFormContainer>
      </div>
    </div>
  );
};

export default HeavyVehiclesPage;
