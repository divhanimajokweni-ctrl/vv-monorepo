export { default as LindiweSignalProcessor } from './pipeline';
export * from './lindiwe';
export * from './pipeline';
export * from './matchmaker';

export const ubuntuBackbone = {
  async process() {
    return { success: true };
  }
};