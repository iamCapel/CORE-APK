import React, { useState, useMemo } from 'react';
import { ModernFormContainer } from './ModernFormContainer';
import { ModernSelect } from './ModernSelect';
import { ModernInput } from './ModernInput';
import { firebaseHeavyVehiclesStorage, HeavyVehicleRecord } from '../services/firebaseHeavyVehiclesStorage';
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

const municipiosPorProvincia: Record<string, string[]> = {
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

const heavyVehicleTypes = [
  'Camión Volqueta',
  'Excavadora',
  'Bulldozer',
  'Retroexcavadora',
  'Grúa',
  'Dumpers',
  'Moto niveladora',
  'Compactadora'
];

const HeavyVehiclesPage: React.FC<HeavyVehiclesPageProps> = ({ onClose }) => {
  const [region, setRegion] = useState('');
  const [provincia, setProvincia] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [distrito, setDistrito] = useState('');
  const [distritoPersonalizado, setDistritoPersonalizado] = useState('');
  const [mostrarDistritoPersonalizado, setMostrarDistritoPersonalizado] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [hastaLaFecha, setHastaLaFecha] = useState(true);
  const [fechaFinal, setFechaFinal] = useState('');

  const [vehiculosDetalles, setVehiculosDetalles] = useState<Array<{ tipo: string; modelo: string; ficha: string; fichaError?: string }>>([
    { tipo: '', modelo: '', ficha: '', fichaError: '' }
  ]);
  const [numeroVehiculos, setNumeroVehiculos] = useState(1);

  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  const provinciasDisponibles = useMemo(() => (region ? provinciasPorRegion[region] || [] : []), [region]);
  const municipiosDisponibles = useMemo(() => (provincia ? municipiosPorProvincia[provincia] || [] : []), [provincia]);
  const distritosDisponibles = useMemo(() => (municipio ? distritosPorMunicipio[municipio] || [] : []), [municipio]);

  const distritoFinal = mostrarDistritoPersonalizado ? distritoPersonalizado : distrito;

  const handleVehiculoChange = (index: number, field: 'tipo' | 'modelo' | 'ficha', value: string) => {
    setVehiculosDetalles(prev => {
      const next = [...prev];
      const row = { ...next[index] };
      if (field === 'ficha') {
        const upper = value.toUpperCase();
        row.ficha = upper;
        row.fichaError = upper && !/^[A-Z]{2}-\d+$/.test(upper)
          ? 'Debe tener el formato XX-123 (dos letras, guion, números).'
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

  const setCantidadVehiculos = (cantidad: number) => {
    if (cantidad < 1) cantidad = 1;
    if (cantidad > 50) cantidad = 50;

    setNumeroVehiculos(cantidad);
    setVehiculosDetalles(prev => {
      const next = [...prev];
      if (cantidad > next.length) {
        for (let i = next.length; i < cantidad; i++) {
          next.push({ tipo: '', modelo: '', ficha: '', fichaError: '' });
        }
      } else if (cantidad < next.length) {
        next.splice(cantidad);
      }
      return next;
    });
  };

  const resetForm = () => {
    setRegion('');
    setProvincia('');
    setMunicipio('');
    setDistrito('');
    setDistritoPersonalizado('');
    setMostrarDistritoPersonalizado(false);
    setFechaInicio('');
    setHastaLaFecha(true);
    setFechaFinal('');
    setVehiculosDetalles([{ tipo: '', modelo: '', ficha: '', fichaError: '' }]);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!region || !provincia || !municipio || !distritoFinal) {
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
      region,
      provincia,
      municipio,
      distrito: distritoFinal,
      fechaInicio,
      hastaLaFecha,
      fechaFinal: hastaLaFecha ? new Date().toISOString().slice(0, 10) : fechaFinal,
      usuarioId: undefined,
      observaciones: 'Registro de vehículo pesado de formulario múltiple'
    };

    try {
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

              <ModernSelect
                id="municipio"
                icon="🏘️"
                hint="Municipio"
                placeholder={provincia ? 'Seleccionar municipio' : '— primero provincia —'}
                value={municipio}
                options={municipiosDisponibles.map(m => ({ value: m, label: m }))}
                disabled={!provincia}
                required
                onChange={setMunicipio}
              />
            </div>

            <div className="form-row">
              <ModernSelect
                id="distrito"
                icon="🏙️"
                hint="Distrito"
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
                    setMostrarDistritoPersonalizado(true);
                    setDistrito('');
                  } else {
                    setMostrarDistritoPersonalizado(false);
                    setDistrito(val);
                    setDistritoPersonalizado('');
                  }
                }}
              />

              {mostrarDistritoPersonalizado && (
                <ModernInput
                  id="distritoPersonalizado"
                  type="text"
                  label="Distrito personalizado"
                  placeholder="Ingresar nombre de distrito"
                  value={distritoPersonalizado}
                  onChange={(val) => setDistritoPersonalizado(String(val))}
                  required
                />
              )}
            </div>

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

            <div className="form-row" style={{ flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
                <h3>Vehículos ({vehiculosDetalles.length})</h3>
                <ModernInput
                  id="numVehiculos"
                  type="number"
                  label="Cantidad de vehículos"
                  placeholder="Ej 5"
                  value={numeroVehiculos}
                  onChange={(val) => setCantidadVehiculos(Number(val) || 1)}
                />
                <button type="button" className="btn-modern" style={{ minWidth: 'auto' }} onClick={addVehiculo}>
                  + Agregar vehículo
                </button>
              </div>

              {vehiculosDetalles.map((vehiculo, index) => (
                <div key={index} className="vehicle-row" style={{ border: '1px solid #444', padding: '12px', borderRadius: '8px' }}>
                  <div className="form-row" style={{ gap: '8px' }}>
                    <ModernSelect
                      id={`tipoVehiculo_${index}`}
                      icon="🚛"
                      hint={`Tipo de vehículo #${index + 1}`}
                      placeholder="Seleccionar tipo"
                      value={vehiculo.tipo}
                      options={heavyVehicleTypes.map(val => ({ value: val, label: val }))}
                      required
                      onChange={(val) => handleVehiculoChange(index, 'tipo', val)}
                    />

                    <ModernInput
                      id={`modelo_${index}`}
                      type="text"
                      label="Modelo (opcional)"
                      placeholder="Ej. CAT 320"
                      value={vehiculo.modelo}
                      onChange={(val) => handleVehiculoChange(index, 'modelo', String(val))}
                    />

                    <div style={{ alignSelf: 'flex-end' }}>
                      <button type="button" className="btn-modern" onClick={() => removeVehiculo(index)} style={{ background: '#c0392b' }}>
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <ModernInput
                    id={`ficha_${index}`}
                    type="text"
                    label={`Ficha del vehículo #${index + 1}`}
                    placeholder="Ej. AB-12345"
                    value={vehiculo.ficha}
                    onChange={(val) => handleVehiculoChange(index, 'ficha', String(val))}
                    required
                  />
                  {vehiculo.fichaError && <p style={{ color: '#ffb703', marginTop: '-0.8rem' }}>{vehiculo.fichaError}</p>}
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
        </ModernFormContainer>
      </div>
    </div>
  );
};

export default HeavyVehiclesPage;
