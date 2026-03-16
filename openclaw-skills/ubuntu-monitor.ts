import { Skill, Action, Context } from '@openclaw/sdk';

export default class UbuntuMonitor extends Skill {
  name = 'ubuntu-monitor';
  description = 'Monitors the Ubuntu Accord Backbone and alerts the Founder of State changes.';

  @Action({
    description: 'Processes a System State change from Lindiwe AI.',
    inputs: {
      mode: 'string',
      buffer: 'number',
      reason: 'string',
      riskFlags: 'string[]',
      confidence: 'number',
      timestamp: 'string',
    },
  })
  async onStateChange(
    ctx: Context,
    input: {
      mode: string;
      buffer: number;
      reason: string;
      riskFlags?: string[];
      confidence?: number;
      timestamp?: string;
    }
  ) {
    const emoji =
      input.mode === 'SHIELD'
        ? '🛡️'
        : input.mode === 'EMERGENCY'
        ? '🚨'
        : input.mode === 'PROSPERITY'
        ? '🌟'
        : '📊';

    const riskFlagText = input.riskFlags?.length
      ? `\n\n🔍 *Risk Flags:*\n${input.riskFlags.map((f) => `• ${f}`).join('\n')}`
      : '';

    const message = `${emoji} *Ubuntu System Alert: ${input.mode} MODE*\n\n` +
      `*Lindiwe's Reason:* ${input.reason}\n\n` +
      `💰 *Current Buffer:* R ${input.buffer.toLocaleString()}` +
      riskFlagText +
      `\n\n_OpenClaw Note: I am monitoring for further volatility._`;

    await ctx.agent.say(message);

    if (input.mode === 'SHIELD' || input.mode === 'EMERGENCY') {
      await ctx.agent.think(
        'Analyze the last 5 Stitch transactions for high-risk patterns. Look for unusual withdrawal amounts, gambling transactions, or signs of financial distress.'
      );
    }
  }

  @Action({
    description: 'Get current system status from the Ubuntu Backbone.',
  })
  async getSystemStatus(ctx: Context) {
    try {
      const response = await fetch(`${process.env.UBUNTU_BACKBONE_URL}/api/backbone?action=state`, {
        headers: {
          'Authorization': `Bearer ${process.env.UBUNTU_API_KEY}`,
        },
      });
      
      if (!response.ok) {
        await ctx.agent.say('❌ Failed to connect to Ubuntu Backbone.');
        return;
      }

      const state = await response.json();
      
      const modeEmoji = state.currentMode === 'shield' ? '🛡️' : 
                        state.currentMode === 'emergency' ? '🚨' : 
                        state.currentMode === 'prosperity' ? '🌟' : '📊';

      const statusMessage = `${modeEmoji} *Ubuntu Backbone Status*\n\n` +
        `*Mode:* ${state.currentMode.toUpperCase()}\n` +
        `*Entry Threshold:* ${state.entryThreshold}\n` +
        `*Safety Buffer:* R ${state.safetyBuffer.currentBalance.toLocaleString()} / R ${state.safetyBuffer.targetBalance.toLocaleString()}\n` +
        `*Buffer Health:* ${(state.safetyBuffer.healthRatio * 100).toFixed(1)}%\n\n` +
        `*Village Pulse:*\n` +
        `• Stability: ${(state.villagePulse.stability * 100).toFixed(0)}%\n` +
        `• Anxiety: ${(state.villagePulse.anxiety * 100).toFixed(0)}%\n` +
        `• Excitement: ${(state.villagePulse.excitement * 100).toFixed(0)}%`;

      await ctx.agent.say(statusMessage);
    } catch (error) {
      await ctx.agent.say('❌ Error connecting to Ubuntu Backbone: ' + (error as Error).message);
    }
  }

  @Action({
    description: 'Get health status of the OpenClaw-Lindiwe connection.',
  })
  async checkConnection(ctx: Context) {
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
    
    await ctx.agent.say(`*OpenClaw Gateway Status*\n\n` +
      `Gateway URL: ${gatewayUrl}\n` +
      `Backbone URL: ${process.env.UBUNTU_BACKBONE_URL || 'Not configured'}\n` +
      `Integration: ${process.env.OPENCLAW_ENABLED === 'true' ? '✅ Enabled' : '⚠️ Disabled'}`);
  }
}
