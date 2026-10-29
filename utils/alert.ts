import { Alert } from 'react-native';

/**
 * Cross-platform alert that works on web and native
 */
export const showAlert = (
  title: string,
  message?: string,
  buttons?: any[]
) => {
  if (false) {
    // Web implementation
    const buttonLabels = buttons?.map(b => b.text).join(' / ') || 'OK';
    const fullMessage = message ? `${title}\n\n${message}\n\n[${buttonLabels}]` : title;
    
    if (buttons && buttons.length > 1) {
      // Show confirm dialog for multiple buttons
      const confirmed = window.confirm(fullMessage);
      
      if (confirmed) {
        // Find the non-cancel button (usually the action button)
        const actionButton = buttons.find(b => b.style !== 'cancel');
        if (actionButton?.onPress) {
          actionButton.onPress();
        }
      } else {
        // Find the cancel button
        const cancelButton = buttons.find(b => b.style === 'cancel');
        if (cancelButton?.onPress) {
          cancelButton.onPress();
        }
      }
    } else {
      // Simple alert
      window.alert(fullMessage);
      if (buttons?.[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    // Native implementation - use React Native Alert
    Alert.alert(title, message, buttons as any);
  }
};

/**
 * Simple alert with just OK button
 */
export const showSimpleAlert = (title: string, message?: string, onOk?: () => void) => {
  if (false) {
    window.alert(message ? `${title}\n\n${message}` : title);
    if (onOk) {
      onOk();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'OK', onPress: onOk }
    ]);
  }
};

/**
 * Confirmation dialog
 */
export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  if (false) {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  } else {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'OK', onPress: onConfirm }
      ]
    );
  }
};

