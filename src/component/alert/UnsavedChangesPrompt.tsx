import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface UnsavedChangesPromptProps {
  when: boolean;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const UnsavedChangesPrompt: React.FC<UnsavedChangesPromptProps> = ({
  when,
  message = 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời đi?',
  onConfirm,
  onCancel
}) => {
  const location = useLocation();
  const [confirmedNavigation, setConfirmedNavigation] = useState(false);

  useEffect(() => {
    if (!when) return;

    const handlePopState = () => {
      if (!confirmedNavigation && when) {
        const confirmLeave = window.confirm(message);
        
        if (!confirmLeave) {
          // Ngăn navigation
          window.history.pushState(null, '', location.pathname);
          onCancel?.();
        } else {
          onConfirm?.();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [when, confirmedNavigation, message, location.pathname, onConfirm, onCancel]);

  return null;
};