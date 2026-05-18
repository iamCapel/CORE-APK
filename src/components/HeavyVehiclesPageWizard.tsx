import React, { useState, useMemo, useEffect } from 'react';
import { firebaseHeavyVehiclesStorage, HeavyVehicleRecord } from '../services/firebaseHeavyVehiclesStorage';
import {
  getMunicipios,
  addUserMunicipio,
  addUserDistrito
} from '../services/municipioService';
import './HeavyVehiclesPageWizard.css';

interface HeavyVehiclesPageWizardProps {
  onClose: () => void;
}

const regionesRD = [
  'Ozama o Metropolitana', 'Cibao Norte', 'Cibao Sur', 'Cibao Nordeste',
  'Cibao Noroeste', 'Santiago', 'Valdesia', 'Enriquillo',
  'El Valle', 'Yuma', 'Higuamo'
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
  'Excavadora', 'Retroexcavadora', 'Motoniveladora', 'Rodillo Compactador',
  'Rodillo Liso', 'Rodillo Pata de Cabra', 'Rodillo Neumático', 'Cargador Frontal',
  'Bulldozer', 'Camión Volquete', 'Camión Cisterna', 'Camión de Carga',
  'Compactadora', 'Compactadora Vibratoria', 'Pavimentadora', 'Finisher',
  'Recicladora de Asfalto', 'Fresadora', 'Barredora', 'Distribuidor de Asfalto',
  'Planta de Asfalto', 'Planta de Concreto', 'Mezcladora de Concreto',
  'Bomba de Concreto', 'Vibradora de Concreto', 'Zanjadora', 'Perforadora',
  'Martillo Hidráulico', 'Grúa', 'Minicargador', 'Tractor',
  'Generador Eléctrico', 'Compresor de Aire', 'Otros'
];

const HeavyVehiclesPageWizard: React.FC<HeavyVehiclesPageWizardProps> = ({ onClose }) => {
  // Estado del wizard
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Paso 1: Actividad
  const [tipoIntervencion, setTipoIntervencion] = useState('');
  const [subTipoCanal, setSubTipoCanal] = useState('');

  // Paso 2: Ubicación
  const [region, setRegion] = useState('');
  const [provincia, setProvincia] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [distrito, setDistrito] = useState('');
  const [municipiosPorProvinciaState, setMunicipiosPorProvinciaState] = useState<Record<string, string[]>>({});
  const [distritosPorMunicipioState, setDistritosPorMunicipioState] = useState<Record<string, string[]>>({});
  
  // Estados para agregar municipio
  const [showAddMunicipioModal, setShowAddMunicipioModal] = useState(false);
  const [nuevoMunicipioNombre, setNuevoMunicipioNombre] = useState('');
  
  // Estados para agregar distrito
  const [showAddDistritoModal, setShowAddDistritoModal] = useState(false);
  const [nuevoDistritoNombre, setNuevoDistritoNombre] = useState('');

  // Paso 3: Fechas
  const [fechaInicio, setFechaInicio] = useState('');
  const [hastaLaFecha, setHastaLaFecha] = useState(true);
  const [fechaFinal, setFechaFinal] = useState('');

  // Paso 4: Cantidad y Vehículos
  const [cantidadVehiculos, setCantidadVehiculos] = useState(0);
  const [vehiculos, setVehiculos] = useState<Array<{ tipo: string; modelo: string; ficha: string; fichaError?: string }>>([]);

  // Estado general
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  const provinciasDisponibles = useMemo(() => (region ? provinciasPorRegion[region] || [] : []), [region]);
  const municipiosDisponibles = useMemo(() => (provincia ? municipiosPorProvinciaState[provincia] || [] : []), [provincia, municipiosPorProvinciaState]);
  const distritosDisponibles = useMemo(() => (municipio ? distritosPorMunicipioState[municipio] || [] : []), [municipio, distritosPorMunicipioState]);

  // Cargar municipios y distritos desde Firebase
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
        console.error('Error cargando municipios:', err);
      }
    };

    loadMunicipios();

    return () => {
      isMounted = false;
    };
  }, []);

  // Validación de cada paso
  const validateStep = (step: number): { isValid: boolean; message: string } => {
    switch (step) {
      case 1:
        if (!tipoIntervencion) return { isValid: false, message: 'Seleccione una actividad' };
        if (tipoIntervencion === 'Canalización' && !subTipoCanal) return { isValid: false, message: 'Seleccione el tipo de canal' };
        return { isValid: true, message: '' };

      case 2:
        if (!region) return { isValid: false, message: 'Seleccione una región' };
        if (!provincia) return { isValid: false, message: 'Seleccione una provincia' };
        if (!municipio) return { isValid: false, message: 'Seleccione un municipio' };
        if (!distrito) return { isValid: false, message: 'Seleccione un distrito' };
        return { isValid: true, message: '' };

      case 3:
        if (!fechaInicio) return { isValid: false, message: 'Seleccione la fecha de inicio' };
        if (!hastaLaFecha && !fechaFinal) return { isValid: false, message: 'Seleccione la fecha final' };
        return { isValid: true, message: '' };

      case 4:
        if (cantidadVehiculos < 0) return { isValid: false, message: 'La cantidad no puede ser negativa' };
        for (let i = 0; i < vehiculos.length; i++) {
          const v = vehiculos[i];
          if (!v.tipo) return { isValid: false, message: `Seleccione el tipo del vehículo #${i + 1}` };
          if (!v.ficha) return { isValid: false, message: `Ingrese la ficha del vehículo #${i + 1}` };
          if (v.fichaError) return { isValid: false, message: `Ficha inválida en vehículo #${i + 1}` };
        }
        return { isValid: true, message: '' };

      default:
        return { isValid: true, message: '' };
    }
  };

  // Navegación entre pasos
  const handleNext = () => {
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      setMensaje(validation.message);
      return;
    }
    setMensaje('');
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrevious = () => {
    setMensaje('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Manejo de cantidad de vehículos
  const handleCantidadChange = (cantidad: number) => {
    if (cantidad < 0) cantidad = 0;
    if (cantidad > 50) cantidad = 50;

    setCantidadVehiculos(cantidad);
    setVehiculos(prev => {
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

  // Manejo de cambios en vehículos
  const handleVehiculoChange = (index: number, field: 'tipo' | 'modelo' | 'ficha', value: string) => {
    setVehiculos(prev => {
      const next = [...prev];
      const row = { ...next[index] };

      if (field === 'ficha') {
        const raw = value.toUpperCase();
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
          ? 'Formato: AB-12345'
          : '';
      } else {
        row[field] = value;
      }

      next[index] = row;
      return next;
    });
  };

  // Guardar en Firebase
  const handleSubmit = async () => {
    const validation = validateStep(4);
    if (!validation.isValid) {
      setMensaje(validation.message);
      return;
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
      observaciones: 'Registro desde formulario wizard'
    };

    try {
      if (distrito && municipio) {
        const existingDistritos = distritosPorMunicipioState[municipio] || [];
        if (!existingDistritos.includes(distrito)) {
          addUserDistrito(municipio, distrito);
        }
      }

      setGuardando(true);
      await Promise.all(vehiculos.map(async (vehiculo) => {
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

      setMensaje('✅ Vehículos guardados exitosamente');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setMensaje('❌ Error al guardar el registro. Por favor, verifique su conexión a internet e intente nuevamente.');
      console.error('Error al guardar vehículos:', error);
    } finally {
      setGuardando(false);
    }
  };

  // Renderizado según el paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="wizard-step">
            <h2 className="step-title">🛠️ Seleccione la Actividad</h2>
            <p className="step-subtitle">Tipo de intervención que se va a realizar</p>

            <div className="form-group">
              <label>Actividad *</label>
              <select
                value={tipoIntervencion}
                onChange={(e) => setTipoIntervencion(e.target.value)}
                className="wizard-select"
              >
                <option value="">— Seleccione una actividad —</option>
                {opcionesIntervencion.map(opcion => (
                  <option key={opcion} value={opcion}>{opcion}</option>
                ))}
              </select>
            </div>

            {tipoIntervencion === 'Canalización' && (
              <div className="form-group">
                <label>Tipo de Canal *</label>
                <select
                  value={subTipoCanal}
                  onChange={(e) => setSubTipoCanal(e.target.value)}
                  className="wizard-select"
                >
                  <option value="">— Seleccione tipo de canal —</option>
                  {canalOptions.map(opcion => (
                    <option key={opcion} value={opcion}>{opcion}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="wizard-step">
            <h2 className="step-title">📍 Ubicación del Proyecto</h2>
            <p className="step-subtitle">Seleccione la ubicación precisa para el mapa</p>

            <div className="form-group">
              <label>Región *</label>
              <select
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setProvincia('');
                  setMunicipio('');
                  setDistrito('');
                }}
                className="wizard-select"
              >
                <option value="">— Seleccione región —</option>
                {regionesRD.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {region && (
              <div className="form-group">
                <label>Provincia *</label>
                <select
                  value={provincia}
                  onChange={(e) => {
                    setProvincia(e.target.value);
                    setMunicipio('');
                    setDistrito('');
                  }}
                  className="wizard-select"
                >
                  <option value="">— Seleccione provincia —</option>
                  {provinciasDisponibles.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            {provincia && (
              <div className="form-group">
                <label>Municipio *</label>
                <select
                  value={municipio}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '__ADD_NEW__') {
                      setShowAddMunicipioModal(true);
                    } else {
                      setMunicipio(value);
                      setDistrito('');
                    }
                  }}
                  className="wizard-select"
                >
                  <option value="">— Seleccione municipio —</option>
                  {municipiosDisponibles.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="__ADD_NEW__" style={{fontWeight: 'bold', color: '#FF8C00'}}>➕ Agregar nuevo municipio...</option>
                </select>
                
                {showAddMunicipioModal && (
                  <div className="add-municipio-inline">
                    <input
                      type="text"
                      placeholder="Nombre del nuevo municipio"
                      value={nuevoMunicipioNombre}
                      onChange={(e) => setNuevoMunicipioNombre(e.target.value)}
                      className="wizard-input"
                      autoFocus
                    />
                    <div className="inline-buttons">
                      <button
                        onClick={() => {
                          if (nuevoMunicipioNombre.trim() && provincia) {
                            addUserMunicipio(provincia, nuevoMunicipioNombre.trim());
                            setMunicipio(nuevoMunicipioNombre.trim());
                            const updatedMunicipios = [...(municipiosPorProvinciaState[provincia] || []), nuevoMunicipioNombre.trim()].sort();
                            setMunicipiosPorProvinciaState({
                              ...municipiosPorProvinciaState,
                              [provincia]: updatedMunicipios
                            });
                            setNuevoMunicipioNombre('');
                            setShowAddMunicipioModal(false);
                            setMensaje('✅ Municipio agregado exitosamente');
                            setTimeout(() => setMensaje(''), 3000);
                          }
                        }}
                        className="btn-add-inline"
                        disabled={!nuevoMunicipioNombre.trim()}
                      >
                        ✓ Agregar
                      </button>
                      <button
                        onClick={() => {
                          setShowAddMunicipioModal(false);
                          setNuevoMunicipioNombre('');
                        }}
                        className="btn-cancel-inline"
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {municipio && (
              <div className="form-group">
                <label>Distrito Municipal *</label>
                <select
                  value={distrito}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '__ADD_NEW__') {
                      setShowAddDistritoModal(true);
                      setDistrito('');
                    } else {
                      setDistrito(value);
                    }
                  }}
                  className="wizard-select"
                >
                  <option value="">— Seleccione distrito —</option>
                  {distritosDisponibles.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="__ADD_NEW__" style={{fontWeight: 'bold', color: '#FF8C00'}}>➕ Agregar nuevo distrito municipal...</option>
                </select>
                
                {showAddDistritoModal && (
                  <div className="add-municipio-inline">
                    <input
                      type="text"
                      placeholder="Nombre del nuevo distrito municipal"
                      value={nuevoDistritoNombre}
                      onChange={(e) => setNuevoDistritoNombre(e.target.value)}
                      className="wizard-input"
                      autoFocus
                    />
                    <div className="inline-buttons">
                      <button
                        onClick={() => {
                          if (nuevoDistritoNombre.trim() && municipio) {
                            addUserDistrito(municipio, nuevoDistritoNombre.trim());
                            setDistrito(nuevoDistritoNombre.trim());
                            const updatedDistritos = [...(distritosPorMunicipioState[municipio] || []), nuevoDistritoNombre.trim()].sort();
                            setDistritosPorMunicipioState({
                              ...distritosPorMunicipioState,
                              [municipio]: updatedDistritos
                            });
                            setNuevoDistritoNombre('');
                            setShowAddDistritoModal(false);
                            setMensaje('✅ Distrito municipal agregado exitosamente');
                            setTimeout(() => setMensaje(''), 3000);
                          }
                        }}
                        className="btn-add-inline"
                        disabled={!nuevoDistritoNombre.trim()}
                      >
                        ✓ Agregar
                      </button>
                      <button
                        onClick={() => {
                          setShowAddDistritoModal(false);
                          setNuevoDistritoNombre('');
                        }}
                        className="btn-cancel-inline"
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="wizard-step">
            <h2 className="step-title">📅 Fechas del Proyecto</h2>
            <p className="step-subtitle">Fecha de inicio y finalización</p>

            <div className="form-group">
              <label>Fecha de Inicio *</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="wizard-input"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hastaLaFecha}
                  onChange={(e) => setHastaLaFecha(e.target.checked)}
                />
                <span>Hasta la fecha actual</span>
              </label>
            </div>

            {!hastaLaFecha && (
              <div className="form-group">
                <label>Fecha Final *</label>
                <input
                  type="date"
                  value={fechaFinal}
                  onChange={(e) => setFechaFinal(e.target.value)}
                  min={fechaInicio}
                  className="wizard-input"
                />
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="wizard-step">
            <h2 className="step-title">🚚 Vehículos Pesados</h2>
            <p className="step-subtitle">Cantidad y detalles de los vehículos</p>

            <div className="form-group">
              <label>Cantidad de Vehículos *</label>
              <input
                type="number"
                min="0"
                max="50"
                value={cantidadVehiculos}
                onChange={(e) => handleCantidadChange(parseInt(e.target.value) || 0)}
                className="wizard-input"
              />
            </div>

            <div className="vehiculos-list">
              {vehiculos.map((vehiculo, index) => (
                <div key={index} className="vehiculo-card">
                  <h3 className="vehiculo-number">Vehículo #{index + 1}</h3>

                  <div className="form-group">
                    <label>Tipo de Vehículo *</label>
                    <select
                      value={vehiculo.tipo}
                      onChange={(e) => handleVehiculoChange(index, 'tipo', e.target.value)}
                      className="wizard-select"
                    >
                      <option value="">— Seleccionar tipo —</option>
                      {heavyVehicleTypes.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Modelo</label>
                    <input
                      type="text"
                      placeholder="Ej: CAT 320D"
                      value={vehiculo.modelo}
                      onChange={(e) => handleVehiculoChange(index, 'modelo', e.target.value)}
                      className="wizard-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Ficha * (Ej: AB-12345)</label>
                    <input
                      type="text"
                      placeholder="AB-12345"
                      value={vehiculo.ficha}
                      onChange={(e) => handleVehiculoChange(index, 'ficha', e.target.value)}
                      className={`wizard-input ${vehiculo.fichaError ? 'error' : ''}`}
                    />
                    {vehiculo.fichaError && (
                      <span className="error-text">{vehiculo.fichaError}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="wizard-step">
            <h2 className="step-title">✅ Confirmación</h2>
            <p className="step-subtitle">Revise la información antes de guardar</p>

            <div className="confirmation-section">
              <div className="confirmation-item">
                <strong>Actividad:</strong>
                <span>{tipoIntervencion} {subTipoCanal && `(${subTipoCanal})`}</span>
              </div>

              <div className="confirmation-item">
                <strong>Ubicación:</strong>
                <span>{region} › {provincia} › {municipio} › {distrito}</span>
              </div>

              <div className="confirmation-item">
                <strong>Fechas:</strong>
                <span>{fechaInicio} {hastaLaFecha ? '› Hasta la fecha' : `› ${fechaFinal}`}</span>
              </div>

              <div className="confirmation-item">
                <strong>Vehículos:</strong>
                <span>{cantidadVehiculos} vehículo(s)</span>
              </div>

              <div className="vehiculos-summary">
                {vehiculos.map((v, i) => (
                  <div key={i} className="vehiculo-summary">
                    <span className="vehiculo-badge">{i + 1}</span>
                    <div className="vehiculo-info">
                      <strong>{v.tipo}</strong>
                      {v.modelo && <span className="vehiculo-modelo">{v.modelo}</span>}
                      <span className="vehiculo-ficha">Ficha: {v.ficha}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="wizard-container">
      {/* Header */}
      <div className="wizard-header">
        <button className="wizard-back-btn" onClick={onClose} disabled={guardando}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <h1 className="wizard-main-title">Registro de Vehículos</h1>
      </div>

      {/* Progress Stepper */}
      <div className="wizard-stepper">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className={`stepper-item ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}>
            <div className="stepper-circle">{step}</div>
            {step < totalSteps && <div className="stepper-line" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="wizard-content">
        {renderStep()}
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`wizard-message ${mensaje.includes('✅') ? 'success' : 'error'}`}>
          {mensaje}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="wizard-actions">
        {currentStep > 1 && (
          <button
            className="wizard-btn wizard-btn-secondary"
            onClick={handlePrevious}
            disabled={guardando}
          >
            ← Anterior
          </button>
        )}

        {currentStep < totalSteps && (
          <button
            className="wizard-btn wizard-btn-primary"
            onClick={handleNext}
            disabled={guardando}
          >
            Siguiente →
          </button>
        )}

        {currentStep === totalSteps && (
          <button
            className="wizard-btn wizard-btn-success"
            onClick={handleSubmit}
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : '✓ Guardar Registro'}
          </button>
        )}
      </div>
    </div>
  );
};

export default HeavyVehiclesPageWizard;
