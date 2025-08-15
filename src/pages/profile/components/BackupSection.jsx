import DataBackupPanel from '../../../components/sync/DataBackupPanel';
import '../styles/BackupSection.css';

/**
 * Componente para la sección de respaldo de datos en el perfil
 * @param {Object} props - Propiedades del componente
 */
const BackupSection = () => {
  return (
    <div className='profile-section backup-section'>
      <h2 className='section-title'>Respaldo de Datos</h2>
      <div className='section-description'>
        <p>
          Exporta tus plubots como archivo JSON para tener un respaldo adicional o importa plubots
          previamente exportados. Esto te permite proteger tu trabajo y transferirlo entre
          dispositivos o cuentas si es necesario.
        </p>
      </div>

      <DataBackupPanel />

      <div className='backup-info'>
        <h3>¿Por qué es importante hacer respaldos?</h3>
        <ul>
          <li>
            <strong>Protección contra pérdidas:</strong> Mantén tus plubots seguros incluso si hay
            problemas con tu cuenta o con el servidor.
          </li>
          <li>
            <strong>Transferencia entre dispositivos:</strong> Lleva tus plubots contigo a cualquier
            dispositivo o navegador.
          </li>
          <li>
            <strong>Compartir con otros usuarios:</strong> Exporta tus plubots para compartirlos con
            otros usuarios de Plubot.
          </li>
          <li>
            <strong>Versiones y experimentación:</strong> Crea respaldos antes de hacer cambios
            importantes para poder volver atrás si es necesario.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BackupSection;
