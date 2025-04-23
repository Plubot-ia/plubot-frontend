// src/components/steps/Step1Basic.jsx
import React from 'react';
import { toast } from 'react-toastify';  // Importar toast desde react-toastify
import { useFormValidation } from '../../hooks/useFormValidation';

const Step1Basic = ({ onNext, formData, setFormData }) => {
    // Usamos useFormValidation para gestionar los errores
    const { errors, setErrors } = useFormValidation();

    // Función para manejar el cambio de valor en el input del nombre
    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });

        // Validación del campo 'name' (mínimo 3 caracteres)
        if (field === 'name' && value.length < 3) {
            setErrors((prev) => ({ ...prev, name: 'El nombre debe tener al menos 3 caracteres' }));
        } else {
            setErrors((prev) => ({ ...prev, name: '' }));
        }
    };

    // Función para manejar el clic en el botón "Siguiente"
    const handleNext = () => {
        if (!formData.name || !formData.purpose) {
            // Mostrar mensaje de error si faltan campos
            toast.error("Por favor, completa todos los campos antes de continuar.", {
                position: "top-right",
                autoClose: 3000, // Duración en ms
            });
            return;
        }

        // Mostrar mensaje de éxito al proceder
        toast.success("¡Información guardada exitosamente!", {
            position: "top-right",
            autoClose: 3000, // Duración en ms
        });

        onNext();
    };

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6 text-white">Paso 1: Información Básica</h2>

            <div className="mb-4">
                <label className="text-gray-300">Nombre del Chatbot</label>
                <input
                    className={`contact-input mb-2 ${errors.name ? 'error' : ''}`} // Se agrega clase 'error' si hay error
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}  // Llamada a handleChange
                    placeholder="Nombre del Chatbot"
                    required
                />
                {errors.name && (
                    <>
                        <i className="fas fa-exclamation-circle error-icon" />  {/* Icono de advertencia */}
                        <p className="text-red-500 mb-2">{errors.name}</p>  {/* Mensaje de error */}
                    </>
                )}
            </div>

            <div className="mb-4">
                <label className="text-gray-300">Tono del Chatbot</label>
                <select
                    className="contact-select mb-2"
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                >
                    <option value="amigable">Amigable</option>
                    <option value="profesional">Profesional</option>
                    <option value="divertido">Divertido</option>
                    <option value="serio">Serio</option>
                </select>
            </div>

            <div className="mb-4">
                <label className="text-gray-300">Propósito del Chatbot</label>
                <input
                    className="contact-input mb-2"
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="Propósito (ej. ventas, soporte)"
                    required
                />
            </div>

            <button
                type="button"
                className="quantum-btn w-full"
                onClick={handleNext}
                disabled={!formData.name || !formData.purpose || errors.name}  // Deshabilitar si hay error
            >
                Siguiente
            </button>
        </div>
    );
};

export default Step1Basic;
