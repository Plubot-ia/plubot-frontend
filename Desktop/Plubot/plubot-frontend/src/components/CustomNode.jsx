// src/components/CustomNode.jsx
import { useState } from 'react';

const CustomNode = ({ data, id }) => {
    const [userMessage, setUserMessage] = useState(data.userMessage || '');
    const [botResponse, setBotResponse] = useState(data.botResponse || '');
    const [condition, setCondition] = useState(data.condition || '');
    const [actionType, setActionType] = useState(data.action?.type || 'none');
    const [actionValue, setActionValue] = useState(data.action?.value || '');

    const handleChange = (field, value) => {
        if (field === 'userMessage') setUserMessage(value);
        if (field === 'botResponse') setBotResponse(value);
        if (field === 'condition') setCondition(value);
        if (field === 'actionType') setActionType(value);
        if (field === 'actionValue') setActionValue(value);

        const updatedData = {
            userMessage,
            botResponse,
            condition,
            action: { type: actionType, value: actionValue },
            [field]: value,
        };
        data.onChange(id, updatedData);
    };

    return (
        <div className="custom-node">
            <div className="mb-2">
                <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => handleChange('userMessage', e.target.value)}
                    placeholder="Mensaje del usuario"
                    className="w-full"
                />
            </div>
            <div className="mb-2">
                <textarea
                    value={botResponse}
                    onChange={(e) => handleChange('botResponse', e.target.value)}
                    placeholder="Respuesta del bot"
                    className="w-full"
                />
            </div>
            <div className="mb-2">
                <input
                    type="text"
                    value={condition}
                    onChange={(e) => handleChange('condition', e.target.value)}
                    placeholder="Condición (opcional)"
                    className="w-full"
                />
            </div>
            <div className="mb-2">
                <label className="text-gray-300">Acción (opcional):</label>
                <select
                    value={actionType}
                    onChange={(e) => handleChange('actionType', e.target.value)}
                    className="contact-select w-full mt-1"
                >
                    <option value="none">Ninguna</option>
                    <option value="payment_link">Enviar enlace de pago</option>
                    <option value="schedule_link">Enviar enlace de cita</option>
                </select>
            </div>
            {actionType !== 'none' && (
                <div>
                    <input
                        type="text"
                        value={actionValue}
                        onChange={(e) => handleChange('actionValue', e.target.value)}
                        placeholder={actionType === 'payment_link' ? 'Monto (ej. 50)' : 'URL de Calendly'}
                        className="contact-input w-full mt-1"
                    />
                </div>
            )}
        </div>
    );
};

export default CustomNode;
export const nodeTypes = { custom: CustomNode };