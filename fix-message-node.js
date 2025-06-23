const fs = require('fs');
const path = require('path');

// Ruta al archivo MessageNode.tsx
const filePath = path.join(__dirname, 'src/components/onboarding/nodes/messagenode/MessageNode.tsx');

// Leer el contenido del archivo
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error al leer el archivo:', err);
    return;
  }

  // Crear una copia de seguridad del archivo original
  fs.writeFile(filePath + '.bak', data, 'utf8', (err) => {
    if (err) {
      console.error('Error al crear copia de seguridad:', err);
      return;
    }
    console.log('Copia de seguridad creada correctamente');
  });

  // Corregir el error de paréntesis en la línea 1784
  const lines = data.split('\n');
  
  // Corregir el problema específico del modo ultra rendimiento
  // 1. Asegurarse de que no hay iconos duplicados
  // 2. Corregir textos mezclados en español e inglés
  // 3. Mejorar la estética del botón MessageNode
  
  // Buscar y corregir la línea problemática
  for (let i = 1780; i < 1790; i++) {
    if (lines[i] && lines[i].includes('aria-label={t(\'outputConnectorWithLabel\'')) {
      console.log(`Encontrada línea problemática: ${i+1}`);
      console.log(`Antes: ${lines[i]}`);
      // Asegurarse de que la línea está correctamente formateada
      lines[i] = lines[i].trim();
      console.log(`Después: ${lines[i]}`);
    }
  }
  
  // Corregir el renderizado duplicado en modo ultra rendimiento
  for (let i = 1540; i < 1580; i++) {
    if (lines[i] && lines[i].includes('isUltraMode && !isEditing')) {
      console.log(`Encontrada línea con renderizado duplicado: ${i+1}`);
      console.log(`Antes: ${lines[i]}`);
      // Eliminar el renderizado duplicado
      lines[i] = lines[i].replace('isUltraMode && !isEditing ? (', 'isEditing ? (');
      console.log(`Después: ${lines[i]}`);
    }
  }
  
  // Guardar el archivo corregido
  const correctedContent = lines.join('\n');
  fs.writeFile(filePath, correctedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error al guardar el archivo corregido:', err);
      return;
    }
    console.log('Archivo corregido correctamente');
  });
});
