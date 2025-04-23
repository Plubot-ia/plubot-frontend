// src/hooks/useFormValidation.js
import { useState } from 'react';

const useFormValidation = () => {
    const [errors, setErrors] = useState({});

    const validateWhatsappNumber = (number) => {
        if (!number) return '';
        const regex = /^\+\d{10,15}$/;
        return regex.test(number) ? '' : 'Formato inválido (ej. +1234567890)';
    };

    const validateMenuJson = (json) => {
        if (!json) return '';
        try {
            JSON.parse(json);
            return '';
        } catch {
            return 'JSON inválido';
        }
    };

    const validateForm = (formData) => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'El nombre es obligatorio';
        if (!formData.purpose) newErrors.purpose = 'El propósito es obligatorio';
        newErrors.whatsappNumber = validateWhatsappNumber(formData.whatsappNumber);
        newErrors.menuJson = validateMenuJson(formData.menuJson);
        setErrors(newErrors);
        return Object.values(newErrors).every((error) => !error);
    };

    return { errors, validateForm, validateWhatsappNumber, validateMenuJson, setErrors };
};

export default useFormValidation;