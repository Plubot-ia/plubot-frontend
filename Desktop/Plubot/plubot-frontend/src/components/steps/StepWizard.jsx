import { useState, useEffect } from 'react';
import Step1Basic from './Step1Basic';
import Step2Template from './Step2Template';
import Step3Customization from './Step3Customization';
import Step4Review from './Step4Review';
import useAPI from '../../hooks/useAPI'; // Cambiado a ruta relativa
import useFormValidation from '../../hooks/useFormValidation';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StepWizard = ({ templates, editingBot, setEditingBot, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: editingBot?.name || '',
        tone: editingBot?.tone || 'amigable',
        purpose: editingBot?.purpose || '',
        whatsappNumber: editingBot?.whatsapp_number || '',
        businessInfo: editingBot?.business_info || '',
        pdfUrl: editingBot?.pdf_url || '',
        imageUrl: editingBot?.image_url || '',
        menuJson: '',
        nodes: editingBot?.flows?.map((flow, i) => ({
            id: `${i}`,
            type: 'custom',
            data: {
                userMessage: flow.userMessage,
                botResponse: flow.botResponse,
                condition: flow.condition || '',
                action: flow.actions?.[0] || { type: 'none', value: '' },
                onChange: (id, updatedData) => {
                    setFormData((prev) => ({
                        ...prev,
                        nodes: prev.nodes.map((node) =>
                            node.id === id ? { ...node, data: { ...node.data, ...updatedData } } : node
                        ),
                    }));
                },
            },
            position: { x: 250, y: i * 100 + 50 },
        })) || [],
        edges: [],
        selectedTemplate: '',
        templates,
        editingBot,
    });

    const { createBot, updateBot } = useAPI();
    const { validateForm } = useFormValidation();

    useEffect(() => {
        const steps = document.querySelectorAll('.progress-step');
        steps.forEach((s, i) => s.classList.toggle('active', i + 1 === step));
    }, [step]);

    const handleSubmit = async () => {
        if (!validateForm(formData)) return;

        try {
            const botData = {
                name: formData.name,
                tone: formData.tone,
                purpose: formData.purpose,
                whatsapp_number: formData.whatsappNumber,
                business_info: formData.businessInfo,
                pdf_url: formData.pdfUrl,
                image_url: formData.imageUrl,
                flows: formData.nodes.map((node) => ({
                    userMessage: node.data.userMessage,
                    botResponse: node.data.botResponse,
                    condition: node.data.condition,
                    actions: node.data.action?.type !== 'none' ? [node.data.action] : [],
                })),
                template_id: formData.selectedTemplate || null,
                menu_json: formData.menuJson,
            };

            if (formData.editingBot) {
                await updateBot(formData.editingBot.id, botData);
                toast.success('¡Chatbot actualizado con éxito!');
            } else {
                await createBot(botData);
                toast.success('¡Chatbot creado con éxito!');
            }

            setEditingBot(null);
            onSuccess();
            setStep(1);
            setFormData({
                name: '',
                tone: 'amigable',
                purpose: '',
                whatsappNumber: '',
                businessInfo: '',
                pdfUrl: '',
                imageUrl: '',
                menuJson: '',
                nodes: [],
                edges: [],
                selectedTemplate: '',
                templates,
            });
        } catch (error) {
            toast.error(`Error al guardar el chatbot: ${error.message}`);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <Step1Basic
                        onNext={() => setStep(2)}
                        formData={formData}
                        setFormData={setFormData}
                    />
                );
            case 2:
                return (
                    <Step2Template
                        onNext={() => setStep(3)}
                        onBack={() => setStep(1)}
                        templates={templates}
                        formData={formData}
                        setFormData={setFormData}
                    />
                );
            case 3:
                return (
                    <Step3Customization
                        onNext={() => setStep(4)}
                        onBack={() => setStep(2)}
                        formData={formData}
                        setFormData={setFormData}
                    />
                );
            case 4:
                return (
                    <Step4Review
                        onBack={() => setStep(3)}
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleSubmit}
                        isLoading={formData.isLoading}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div>
            {/* Notificaciones */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />

            {/* Barra de progreso */}
            <div className="progress-bar-container mb-6">
                <div className="flex justify-between mb-2">
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`progress-step w-1/4 h-2 rounded-full ${step >= s ? 'bg-cyan-500' : 'bg-gray-600'}`}
                        />
                    ))}
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                    <span>Información</span>
                    <span>Plantilla</span>
                    <span>Personalización</span>
                    <span>Revisión</span>
                </div>
            </div>

            {/* Render del paso actual */}
            {renderStep()}
        </div>
    );
};

export default StepWizard;
