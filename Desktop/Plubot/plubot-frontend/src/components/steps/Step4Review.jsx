// src/components/steps/Step4Review.jsx
import useFormValidation from '../../hooks/useFormValidation';
import useFileUpload from '../../hooks/useFileUpload';
import { toast } from 'react-toastify'; // Importar toast

const Step4Review = ({ onBack, formData, setFormData, onSubmit, isLoading }) => {
    const { validateWhatsappNumber, validateMenuJson, errors } = useFormValidation();
    const { uploadFile, uploadProgress, responseMessage, setResponseMessage } = useFileUpload();

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const isPdfOrImage = file.type.includes('pdf') || file.type.startsWith('image/');
        if (!isPdfOrImage) {
            toast.error("Formato de archivo no válido. Solo se aceptan PDF o imágenes.", {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        const fileUrl = await uploadFile(file);
        if (fileUrl) {
            if (file.type.includes('pdf')) {
                setFormData({ ...formData, pdfUrl: fileUrl });
                toast.success("PDF subido con éxito", { autoClose: 3000 });
            } else {
                setFormData({ ...formData, imageUrl: fileUrl });
                toast.success("Imagen subida con éxito", { autoClose: 3000 });
            }
        }
    };

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6 text-white">Paso 4: Revisión</h2>
            <div className="mb-4">
                <label className="text-gray-300">Número de WhatsApp</label>
                <input
                    className="contact-input mb-2"
                    type="text"
                    value={formData.whatsappNumber}
                    onChange={(e) => {
                        setFormData({ ...formData, whatsappNumber: e.target.value });
                        const valid = validateWhatsappNumber(e.target.value);
                        if (!valid) {
                            toast.warn("Número de WhatsApp inválido", { autoClose: 3000 });
                        }
                    }}
                    placeholder="Número de WhatsApp (+1234567890)"
                />
                {errors.whatsappNumber && <p className="text-red-500 mb-2">{errors.whatsappNumber}</p>}
            </div>

            <div className="mb-4">
                <label className="text-gray-300">Información del Negocio</label>
                <textarea
                    className="contact-textarea mb-2"
                    value={formData.businessInfo}
                    onChange={(e) => setFormData({ ...formData, businessInfo: e.target.value })}
                    placeholder="Información del negocio (opcional)"
                />
            </div>

            <div className="form-grid mb-4">
                <div>
                    <label className="text-gray-300">URL del PDF</label>
                    <input
                        className="contact-input"
                        type="url"
                        value={formData.pdfUrl}
                        onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                        placeholder="URL del PDF (opcional)"
                    />
                </div>
                <div>
                    <label className="text-gray-300">URL de la Imagen</label>
                    <input
                        className="contact-input"
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="URL de la Imagen (opcional)"
                    />
                </div>
            </div>

            <div className="mb-4">
                <label className="text-gray-300">Menú en JSON</label>
                <textarea
                    className="contact-textarea mb-2"
                    value={formData.menuJson}
                    onChange={(e) => {
                        setFormData({ ...formData, menuJson: e.target.value });
                        const valid = validateMenuJson(e.target.value);
                        if (!valid) {
                            toast.warn("El JSON del menú es inválido", { autoClose: 3000 });
                        }
                    }}
                    placeholder='Menú en JSON (opcional): {"Cafés": {"Latte": {"precio": 3.5}}}'
                />
                {errors.menuJson && <p className="text-red-500 mb-2">{errors.menuJson}</p>}
            </div>

            <div className="file-upload mb-4">
                <label className="text-gray-300">Subir PDF o Imagen (máx. 5MB)</label>
                <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} />
                {uploadProgress > 0 && (
                    <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                    </div>
                )}
            </div>

            {responseMessage && (
                <div className="response-message mt-4 text-white" dangerouslySetInnerHTML={{ __html: responseMessage }} />
            )}

            <div className="flex space-x-4">
                <button className="quantum-btn magenta flex-1" onClick={onBack}>
                    Atrás
                </button>
                <button
                    className="quantum-btn flex-1"
                    onClick={() => {
                        toast.success(formData.editingBot ? "Bot actualizado con éxito" : "Bot creado con éxito", {
                            autoClose: 3000,
                        });
                        onSubmit();
                    }}
                    disabled={isLoading || errors.whatsappNumber || errors.menuJson}
                >
                    {isLoading ? 'Guardando...' : formData.editingBot ? 'Actualizar' : 'Crear'}
                </button>
            </div>
        </div>
    );
};

export default Step4Review;
