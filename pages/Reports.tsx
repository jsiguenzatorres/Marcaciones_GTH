
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, AlertCircle, Calendar, Filter, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import { getPunches, getDeviceConfig } from '../services/storage';
import { PunchType } from '../types';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const config = getDeviceConfig();
  
  // Calculate default range (Current Month)
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  // Get raw punches for this employee
  const allPunches = getPunches().filter(p => p.employeeCode === config?.employeeCode);

  // Filter punches by date range
  const filteredPunches = useMemo(() => {
    return allPunches.filter(p => {
        const punchDate = p.timestamp.split('T')[0];
        return punchDate >= startDate && punchDate <= endDate;
    });
  }, [allPunches, startDate, endDate]);

  const stats = useMemo(() => {
    return [
      { name: 'Entradas', count: filteredPunches.filter(p => p.type === PunchType.ENTRY).length, color: '#003366' },
      { name: 'Salidas', count: filteredPunches.filter(p => p.type === PunchType.EXIT).length, color: '#F2A900' },
      { name: 'Ocasional', count: filteredPunches.filter(p => p.type === PunchType.OCCASIONAL_EXIT).length, color: '#0055A5' },
    ];
  }, [filteredPunches]);

  const applyQuickRange = (type: 'current' | 'last_month' | 'today') => {
      const today = new Date();
      if (type === 'current') {
          setStartDate(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
          setEndDate(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]);
      } else if (type === 'last_month') {
          setStartDate(new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0]);
          setEndDate(new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]);
      } else if (type === 'today') {
          const t = today.toISOString().split('T')[0];
          setStartDate(t);
          setEndDate(t);
      }
  };

  const downloadCSV = () => {
    if (!filteredPunches.length) return;
    
    // CSV Header
    const headers = ['ID', 'Empleado', 'Fecha', 'Hora', 'Tipo', 'Tarde/Temprano', 'GPS Lat', 'GPS Lng'];
    
    // CSV Rows
    const rows = filteredPunches.map(p => {
        const date = new Date(p.timestamp);
        const warning = p.isLate ? 'TARDE' : (p.isEarly ? 'SALIDA TEMPRANA' : '-');
        return [
            p.id,
            p.employeeCode,
            date.toLocaleDateString(),
            date.toLocaleTimeString(),
            p.type,
            warning,
            p.gpsLat,
            p.gpsLng
        ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-bfa-gray">
      <Header title="Reportes" />
      <main className="container mx-auto px-4 py-6">
        
        {/* Back Button */}
        <button 
            onClick={() => navigate('/')} 
            className="mb-4 flex items-center text-gray-500 hover:text-bfa-blue transition-colors font-medium"
        >
            <ArrowLeft size={20} className="mr-1" />
            Volver al Inicio
        </button>
        
        {/* Filter Section */}
        <div className="bg-white p-5 rounded-xl shadow-md mb-6 border-l-4 border-bfa-gold">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <div className="flex items-center text-bfa-blue font-bold">
                    <Filter size={20} className="mr-2"/>
                    <h2>Filtros de Fecha</h2>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => applyQuickRange('today')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors">
                        Hoy
                    </button>
                    <button onClick={() => applyQuickRange('current')} className="text-xs bg-blue-50 hover:bg-blue-100 text-bfa-blue px-3 py-1 rounded transition-colors">
                        Mes Actual
                    </button>
                    <button onClick={() => applyQuickRange('last_month')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors">
                        Mes Anterior
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Desde</label>
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-3 text-gray-400"/>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                            className="pl-9 w-full border-gray-300 rounded-lg shadow-sm border p-2 text-sm focus:ring-bfa-blue focus:border-bfa-blue"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Hasta</label>
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-3 text-gray-400"/>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                            className="pl-9 w-full border-gray-300 rounded-lg shadow-sm border p-2 text-sm focus:ring-bfa-blue focus:border-bfa-blue"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end items-center">
                <span className="text-xs text-gray-500 mr-2 uppercase font-bold">Total Encontrado:</span>
                <span className="text-sm font-bold text-bfa-blue bg-blue-50 px-3 py-1 rounded-full">
                    {filteredPunches.length} registros
                </span>
            </div>
        </div>

        {/* Charts Section */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-bfa-blue">Resumen Gráfico</h2>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats}>
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        <YAxis allowDecimals={false} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {stats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* List Section */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Detalle de Asistencia</h2>
                <button 
                    onClick={downloadCSV}
                    disabled={filteredPunches.length === 0}
                    className={`flex items-center text-sm font-medium px-3 py-2 rounded transition-colors
                        ${filteredPunches.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-bfa-blue hover:bg-blue-100'}`}
                >
                    <Download size={16} className="mr-2"/> Exportar CSV
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-left border-b border-gray-200">
                            <th className="p-3 font-bold text-gray-600">Fecha</th>
                            <th className="p-3 font-bold text-gray-600">Tipo</th>
                            <th className="p-3 font-bold text-gray-600">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPunches.length === 0 ? (
                             <tr><td colSpan={3} className="p-8 text-center text-gray-400 italic">No hay registros para mostrar en el rango seleccionado.</td></tr>
                        ) : filteredPunches.reverse().map(p => (
                            <tr key={p.id} className="border-b last:border-0 border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="p-3">
                                    <div className="font-medium text-gray-900">{new Date(p.timestamp).toLocaleDateString()}</div>
                                    <div className="text-xs text-gray-500">{new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold 
                                        ${p.type === PunchType.ENTRY ? 'bg-blue-100 text-bfa-blue' : 
                                          p.type === PunchType.EXIT ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'}`}>
                                        {p.type === PunchType.OCCASIONAL_EXIT ? 'Ocasional' : p.type}
                                    </span>
                                </td>
                                <td className="p-3">
                                    {p.isLate && (
                                        <span className="flex items-center text-red-600 text-xs font-bold mb-1">
                                            <AlertCircle size={12} className="mr-1"/> Tarde
                                        </span>
                                    )}
                                    {p.isEarly && (
                                        <span className="flex items-center text-orange-600 text-xs font-bold">
                                            <AlertCircle size={12} className="mr-1"/> Salida Temp.
                                        </span>
                                    )}
                                    {!p.isLate && !p.isEarly && <span className="text-green-600 text-xs font-medium">A Tiempo</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
