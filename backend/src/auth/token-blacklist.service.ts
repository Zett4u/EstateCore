import { Injectable, Logger } from '@nestjs/common';

/**
 * In-memory Token Blacklist Service for cryptographically revoking active JWTs upon logout.
 * Implements automated TTL expiration cleanup to prevent unbounded memory growth.
 */
@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly revokedTokens = new Map<string, number>();

  /**
   * Revoke an active Bearer token.
   * @param token Raw JWT token string
   * @param ttlSeconds Revocation duration in seconds (defaults to standard 1h = 3600s)
   */
  revoke(token: string, ttlSeconds = 3600): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.revokedTokens.set(token, expiresAt);
    this.logger.log(`Session token revoked until ${new Date(expiresAt).toISOString()}`);
    this.cleanup();
  }

  /**
   * Check whether a given Bearer token has been revoked.
   */
  isRevoked(token: string): boolean {
    const expiresAt = this.revokedTokens.get(token);
    if (!expiresAt) return false;

    if (Date.now() > expiresAt) {
      this.revokedTokens.delete(token);
      return false;
    }
    return true;
  }

  /**
   * Periodic garbage collection of expired blacklist entries.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [token, expiresAt] of this.revokedTokens.entries()) {
      if (now > expiresAt) {
        this.revokedTokens.delete(token);
      }
    }
  }
}
