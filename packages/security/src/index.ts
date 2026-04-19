export class BreachResponse {
  static recordFailedAttempt(ip: string): void {
    console.log(`Failed login attempt from IP: ${ip}`);
    // TODO: Implement proper breach response logic
  }
}