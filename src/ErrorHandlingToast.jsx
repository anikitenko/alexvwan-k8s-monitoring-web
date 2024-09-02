import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import {useState, useCallback} from "react";
import {ErrorHandlingToastContext} from "./ErrorHandlingToastContext";

const ErrorHandlingToast = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((text, context = 'info') => {
        setToasts(toasts => [...toasts, { text, context }]);
    }, []);

    const removeToast = useCallback(() => {
        setToasts(toasts => {
            const [, ...rest] = toasts;
            return rest;
        });
    }, []);
    return (
        <ErrorHandlingToastContext.Provider value={{addToast}}>
            {children}
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 99999 }}>
                {toasts.map((toast, index) => (
                    <Toast key={index} onClose={removeToast} delay={3000} autohide bg={toast.context}>
                        <Toast.Header>
                            <strong className="me-auto">Notification</strong>
                        </Toast.Header>
                        <Toast.Body>{toast.text}</Toast.Body>
                    </Toast>
                ))}
            </ToastContainer>
        </ErrorHandlingToastContext.Provider>
    )
}

export default ErrorHandlingToast;