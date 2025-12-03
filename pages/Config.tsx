import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, MapPin, Search, UserCheck, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import BfaLoadingSpinner from '../components/BfaLoadingSpinner';
import { DeviceConfig } from '../types';
import { saveDeviceConfig, getDeviceConfig, fetchEmployeeFromMaster, generateUUID } from '../services/storage';

const Config: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<DeviceConfig>>({
    deviceId: '',
    employeeCode: '',
    employeeName: '',
    position: '',
    assignedPhone: '',
    immediateManager: '',
    officeLat: 13.6929, // Default BFA HQ approx
    officeLng: -89.2182
  });

  useEffect(() => {
    const existing = getDeviceConfig();
    if (existing) {
      setFormData(existing);
    } else {
        // Initialize ID on mount if new
        setFormData(prev => ({ ...prev, deviceId: generateUUID() }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearchEmployee = async () => {
      if (!formData.employeeCode) {
          setSearchError('Ingrese un código para buscar.');
          return;
      }
      
      setLoading(true);
      setSearchError(null);
      
      const employee = await fetchEmployeeFromMaster(formData.employeeCode);
      
      setLoading(false);
      
      if (employee) {
          setFormData(prev => ({
              ...prev,
              employeeName: employee.employeeName,
              position: employee.position,
              assignedPhone: employee.assignedPhone,
              immediateManager: employee.immediateManager,
              officeLat: employee.officeLat,
              officeLng: employee.officeLng
          }));
      } else {
          setSearchError('Empleado no encontrado en el maestro. Verifique el código o ingrese los datos manualmente.');
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeCode || !formData.employeeName) return;

    const config: DeviceConfig = {
      ...formData as DeviceConfig,
      configuredAt: new Date().toISOString()
    };
    
    saveDeviceConfig(config);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bfa-gray">
      <Header title="Configuración de Dispositivo" />
      
      {loading && <BfaLoadingSpinner fullScreen text="Buscando Empleado..." />}

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-bfa-gold">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-bfa-blue">Datos del Colaborador</h2>
              <UserCheck size={24} className="text-bfa-gold"/>
          </div>
          
          <p className="text-xs text-gray-500 mb-6 bg-blue-50 p-2 rounded">
            Ingrese su código de empleado y presione "Buscar" para obtener sus datos oficiales.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Search Section */}
            <div>
              <label className="block text-sm font-bold text-gray-700">Código Empleado</label>
              <div className="flex mt-1">
                  <input 
                    required 
                    name="employeeCode" 
                    value={formData.employeeCode} 
                    onChange={handleChange} 
                    className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-bfa-blue focus:ring-bfa-blue border p-2 uppercase" 
                    type="text" 
                    placeholder="Ej: 1001" 
                  />
                  <button 
                    type="button"
                    onClick={handleSearchEmployee}
                    className="bg-bfa-blue text-white px-4 py-2 rounded-r-md hover:bg-opacity-90 transition-colors flex items-center"
                  >
                      <Search size={18} />
                  </button>
              </div>
              {searchError && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertTriangle size={12} className="mr-1"/> {searchError}
                  </p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <input required name="employeeName" value={formData.employeeName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm border p-2 text-gray-600" type="text" readOnly />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700">Cargo</label>
                    <input required name="position" value={formData.position} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm border p-2 text-gray-600" type="text" readOnly />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700">Celular</label>
                    <input name="assignedPhone" value={formData.assignedPhone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm border p-2 text-gray-600" type="tel" readOnly />
                    </div>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700">Jefe Inmediato</label>
                <input required name="immediateManager" value={formData.immediateManager} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm border p-2 text-gray-600" type="text" readOnly />
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <h4 className="flex items-center text-bfa-blue font-bold mb-3 text-sm"><MapPin size={16} className="mr-2"/>Ubicación Oficina (Automático)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500">Latitud</label>
                            <input name="officeLat" type="number" step="any" value={formData.officeLat} readOnly className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 border p-2 text-xs text-gray-500" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">Longitud</label>
                            <input name="officeLng" type="number" step="any" value={formData.officeLng} readOnly className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 border p-2 text-xs text-gray-500" />
                        </div>
                    </div>
                </div>
            </div>

            <button type="submit" className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-bfa-blue bg-bfa-gold hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bfa-blue mt-6">
              <Save className="mr-2" size={18} />
              Confirmar y Guardar
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Config;