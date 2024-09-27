import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auth } from './entities/auth.entity';
import { CreateAuthDto } from './dto/create-auth.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Injectable()
export class AuthService {
  private oAuth2Client: OAuth2Client;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
  ) {
    // Validate environment variables and initialize OAuth2Client
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!googleClientId || !googleClientSecret || !googleRedirectUri) {
      throw new HttpException(
        'Missing Google OAuth environment variables',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.oAuth2Client = new OAuth2Client(
      googleClientId,
      googleClientSecret,
      googleRedirectUri,
    );
  }

  /**
   * Generates the Google OAuth URL for user login.
   * @returns {string} Google OAuth 2.0 URL
   */
  generateGoogleAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar', // Full access to Google Calendar
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  /**
   * Exchange the authorization code for access and refresh tokens.
   * @param {string} code Authorization code from Google
   * @returns {Promise<any>} Google OAuth tokens
   */
  async getGoogleTokens(code: string): Promise<any> {
    try {
      const { tokens } = await this.oAuth2Client.getToken(code);
      return tokens;
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve Google OAuth tokens',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Verifies the Google ID token and retrieves the user's profile information.
   * @param {string} idToken Google ID token
   * @returns {Promise<TokenPayload>} Google user profile information
   */
  async verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
    try {
      const ticket = await this.oAuth2Client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      return ticket.getPayload();
    } catch (error) {
      throw new HttpException(
        'Invalid Google ID token',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Creates a JWT token for an authenticated user.
   * @param {any} user User information
   * @returns {Promise<string>} JWT token
   */
  async createJwtToken(user: any): Promise<string> {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }

  /**
   * Validates the JWT token from the request header.
   * @param {string} token JWT token from the request
   * @returns {Promise<any>} Decoded user information or null
   */
  async validateUser(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (err) {
      return err.message;
    }
  }

  /**
   * Stores Google user data in the database.
   * @param {TokenPayload} payload Google user information
   * @returns {Promise<Auth>} Saved user data
   */
  async storeGoogleUserData(payload: TokenPayload): Promise<Auth> {
    const { sub: googleId, email, picture: profilePictureUrl, name } = payload;
  
    try {
      // Check if the user already exists
      let user = await this.authRepository.findOne({
        where: { googleId },
        relations: ['user'],
      });
      if (!user) {
        // Create both Auth and User DTOs in one step
        const createAuthDto: CreateAuthDto = {
          googleId,
          email,
          user: {
            name,
            profilePictureUrl,
          },
        };
  
        // Create and save the new Auth entity
        user = await this.authRepository.save(this.authRepository.create(createAuthDto));
        return user
      }
  
      return user;
    } catch (error) {
      throw new HttpException(
        `Failed to store Google user data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
