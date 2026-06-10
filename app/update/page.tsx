import React from 'react'
import { FileUp, Save, UploadCloud } from 'lucide-react'

export default function UpdatePage() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10 animate-fade-in">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Actualizar Indicadores</h1>
        <p className="text-gray-500 mt-2 text-sm font-medium">Sube la matriz de Excel o ingresa los valores reales manualmente</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Carga Masiva */}
        <div className="glass-card p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Carga Masiva (Excel)</h2>
            <p className="text-gray-500 text-sm mb-6">Arrastra tu archivo xlsx exportado de tu plantilla estándar.</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:bg-brand-50 hover:border-brand-300 transition-colors cursor-pointer group flex flex-col items-center justify-center py-16">
              <UploadCloud className="w-12 h-12 text-gray-400 group-hover:text-brand-500 mb-4 transition-colors" />
              <p className="text-sm font-bold text-gray-700">Haz clic o arrastra un archivo aquí</p>
              <p className="text-xs text-gray-400 mt-2">XLSX, XLS (Max. 10MB)</p>
            </div>
          </div>
          
          <button className="mt-8 w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
            <FileUp className="w-5 h-5" /> Procesar Archivo
          </button>
        </div>

        {/* Ingreso Manual */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ingreso Manual Rápido</h2>
          <p className="text-gray-500 text-sm mb-6">Selecciona el programa e indicador a actualizar.</p>
          
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Programa</label>
              <select className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-3 outline-none">
                <option>ATAL</option>
                <option>EACTIVA</option>
                <option>UTC</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Indicador</label>
              <select className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-3 outline-none">
                <option>% Fluidez lectora</option>
                <option>Docentes formados</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Valor Real (Corte Actual)</label>
              <input type="number" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-3 outline-none" placeholder="Ej. 85.5" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Observaciones</label>
              <textarea rows={3} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-3 outline-none" placeholder="Justificación de la variación..."></textarea>
            </div>

            <button type="button" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Guardar Reporte
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
