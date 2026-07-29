import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

function App() {
  const [mensajeDb, setMensajeDb] = useState<string>('Cargando...');

  useEffect(() => {
    // Llamada al comando Rust
    invoke<string>('probar_conexion')
      .then((res) => setMensajeDb(res))
      .catch((err) => setMensajeDb(`Error: ${err}`));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Ferretería App</h1>
      <div style={{ background: '#222', color: '#0f0', padding: '15px', borderRadius: '8px' }}>
        <strong>Estado de la Base de Datos:</strong>
        <p>{mensajeDb}</p>
      </div>
    </div>
  );
}

export default App;