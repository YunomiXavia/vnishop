// NotificationProps for Notification Component
export interface NotificationProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}
