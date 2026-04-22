import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { AuthenticationError, ValidationError } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'vv-monorepo',
      audience: 'vv-api',
    });
  }

  /**
   * Generate refresh token (longer lived)
   */
  static generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '30d',
      issuer: 'vv-monorepo',
      audience: 'vv-api-refresh',
    });
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'vv-monorepo',
        audience: ['vv-api', 'vv-api-refresh'],
      }) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expired');
      }
      throw new AuthenticationError('Token verification failed');
    }
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticateUser(email: string, password: string): Promise<User> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is disabled');
    }

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    return user;
  }

  /**
   * Create new user with hashed password
   */
  static async createUser(userData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    role?: string;
  }): Promise<User> {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ValidationError('User with this email already exists');
    }

    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, userData.username))
      .limit(1);

    if (existingUsername.length > 0) {
      throw new ValidationError('Username already taken');
    }

    const hashedPassword = await this.hashPassword(userData.password);

    const [newUser] = await db
      .insert(users)
      .values({
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash: hashedPassword,
        role: userData.role || 'user',
      })
      .returning();

    return newUser;
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    return user || null;
  }

  /**
   * Update user profile
   */
  static async updateUser(
    userId: string,
    updates: Partial<Pick<User, 'firstName' | 'lastName' | 'isActive'>>
  ): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new ValidationError('User not found');
    }

    return updatedUser;
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    const isValidCurrentPassword = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValidCurrentPassword) {
      throw new ValidationError('Current password is incorrect');
    }

    const newHashedPassword = await this.hashPassword(newPassword);

    await db
      .update(users)
      .set({
        passwordHash: newHashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}
