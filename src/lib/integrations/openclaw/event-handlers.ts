import { serviceBus } from "../../services/service-bus";
import { getOpenClawGateway, type OpenClawNotification } from "./gateway";

export interface OpenClawEventPayload {
  mode: "prosperity" | "expansion" | "stability" | "shield" | "emergency";
  buffer: {
    current: number;
    target: number;
    healthRatio: number;
  };
  reasoning: string;
  riskFlags: string[];
  confidence: number;
}

export function registerOpenClawEventHandlers(): () => void {
  const cleanupFns: (() => void)[] = [];

  const backboneStateHandler = serviceBus.on(
    "backbone:state_changed",
    async (payload: Record<string, unknown>) => {
      const gateway = getOpenClawGateway();
      if (!gateway.isEnabled()) return;

      const notification: OpenClawNotification = {
        type: "MODE_CHANGE",
        mode: (payload.mode as OpenClawEventPayload["mode"]) || "stability",
        buffer: {
          current: (payload.bufferCurrent as number) || 0,
          target: (payload.bufferTarget as number) || 0,
          healthRatio: (payload.healthRatio as number) || 0,
        },
        reasoning: (payload.reasoning as string) || "State changed",
        riskFlags: (payload.riskFlags as string[]) || [],
        confidence: (payload.confidence as number) || 0,
        timestamp: new Date().toISOString(),
      };

      await gateway.notifyStateChange(notification);
    }
  );
  cleanupFns.push(backboneStateHandler);

  const shieldTriggeredHandler = serviceBus.on(
    "lindiwe:shield_triggered",
    async (payload: Record<string, unknown>) => {
      const gateway = getOpenClawGateway();
      if (!gateway.isEnabled()) return;

      const notification: OpenClawNotification = {
        type: "SHIELD",
        mode: "shield",
        buffer: {
          current: (payload.bufferCurrent as number) || 0,
          target: (payload.bufferTarget as number) || 0,
          healthRatio: (payload.healthRatio as number) || 0,
        },
        reasoning: (payload.reasoning as string) || "Shield mode triggered",
        riskFlags: (payload.riskFlags as string[]) || ["SHIELD_ACTIVATED"],
        confidence: 0.9,
        timestamp: new Date().toISOString(),
      };

      await gateway.notifyStateChange(notification);
    }
  );
  cleanupFns.push(shieldTriggeredHandler);

  const emergencyHandler = serviceBus.on(
    "system:emergency",
    async (payload: Record<string, unknown>) => {
      const gateway = getOpenClawGateway();
      if (!gateway.isEnabled()) return;

      const notification: OpenClawNotification = {
        type: "EMERGENCY",
        mode: "emergency",
        buffer: {
          current: (payload.bufferCurrent as number) || 0,
          target: (payload.bufferTarget as number) || 0,
          healthRatio: (payload.healthRatio as number) || 0,
        },
        reasoning: (payload.reasoning as string) || "Emergency state activated",
        riskFlags: (payload.riskFlags as string[]) || ["EMERGENCY", "CRITICAL"],
        confidence: 0.95,
        timestamp: new Date().toISOString(),
      };

      await gateway.notifyStateChange(notification);
      await gateway.notifyPriorityAlert((payload.message as string) || "Emergency state activated");
    }
  );
  cleanupFns.push(emergencyHandler);

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}
