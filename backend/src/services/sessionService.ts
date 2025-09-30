import { redisClient } from '../config/redis';

export class SessionService {
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds

  /**
   * Store user session in Redis
   */
  async createSession(userId: string, token: string, deviceInfo?: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${userId}`;
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    
    const sessionData = {
      token,
      createdAt: new Date().toISOString(),
      deviceInfo: deviceInfo || 'unknown',
      lastActivity: new Date().toISOString(),
    };

    // Store main session
    await redisClient.set(sessionKey, JSON.stringify(sessionData), this.SESSION_TTL);
    
    // Store in user sessions list (for multiple device support in future)
    await redisClient.set(userSessionsKey, token, this.SESSION_TTL);
  }

  /**
   * Get session data
   */
  async getSession(userId: string): Promise<any | null> {
    const sessionKey = `${this.SESSION_PREFIX}${userId}`;
    const sessionData = await redisClient.get(sessionKey);
    
    if (sessionData) {
      return JSON.parse(sessionData);
    }
    
    return null;
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(userId: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${userId}`;
    const sessionData = await this.getSession(userId);
    
    if (sessionData) {
      sessionData.lastActivity = new Date().toISOString();
      await redisClient.set(sessionKey, JSON.stringify(sessionData), this.SESSION_TTL);
    }
  }

  /**
   * Check if session exists and is valid
   */
  async isSessionValid(userId: string): Promise<boolean> {
    const sessionKey = `${this.SESSION_PREFIX}${userId}`;
    return await redisClient.exists(sessionKey);
  }

  /**
   * Destroy user session
   */
  async destroySession(userId: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${userId}`;
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    
    await Promise.all([
      redisClient.del(sessionKey),
      redisClient.del(userSessionsKey),
    ]);
  }

  /**
   * Destroy all sessions for a user (useful for security)
   */
  async destroyAllUserSessions(userId: string): Promise<void> {
    await this.destroySession(userId);
  }

  /**
   * Get session statistics
   */
  async getSessionStats(userId: string): Promise<any> {
    const session = await this.getSession(userId);
    
    if (!session) {
      return null;
    }

    const createdAt = new Date(session.createdAt);
    const lastActivity = new Date(session.lastActivity);
    const now = new Date();

    return {
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      deviceInfo: session.deviceInfo,
      sessionDuration: now.getTime() - createdAt.getTime(),
      timeSinceLastActivity: now.getTime() - lastActivity.getTime(),
      isActive: (now.getTime() - lastActivity.getTime()) < (30 * 60 * 1000), // Active if last activity within 30 minutes
    };
  }

  /**
   * Extend session TTL
   */
  async extendSession(userId: string, additionalSeconds: number = 3600): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${userId}`;
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    
    // Get current TTL and extend it
    const currentTtl = await redisClient.getClient().ttl(sessionKey);
    if (currentTtl > 0) {
      const newTtl = currentTtl + additionalSeconds;
      await Promise.all([
        redisClient.getClient().expire(sessionKey, newTtl),
        redisClient.getClient().expire(userSessionsKey, newTtl),
      ]);
    }
  }

  /**
   * Clean up expired sessions (can be called by a cron job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    // This would typically be handled by Redis TTL, but we can implement
    // additional cleanup logic here if needed
    let cleanedCount = 0;
    
    // In a production environment, you might want to scan for expired sessions
    // and perform additional cleanup operations
    
    return cleanedCount;
  }
}

export const sessionService = new SessionService();