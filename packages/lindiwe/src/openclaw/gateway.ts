export interface OpenClawNotification {
  id: string;
  type: string;
}

export function openClawGateway() {
  return {
    async send(notification: OpenClawNotification) {
      console.log('Sent to OpenClaw:', notification);
    }
  };
}