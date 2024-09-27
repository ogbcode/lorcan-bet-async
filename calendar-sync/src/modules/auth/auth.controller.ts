import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  HttpStatus,
  BadRequestException,
  UseGuards,
  Version,
  Post,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtAuthGuard } from './guards/JwtAuthGuard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { get } from 'http';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Redirects to Google OAuth login
   * @param {Response} res Express Response object
   */
  @Version('1')
  @ApiOperation({ summary: 'Redirect to Google OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth 2.0 login page',
  })
  @Get('google/login')
  async googleLogin(@Res() res: Response): Promise<void> {
    const googleAuthUrl = this.authService.generateGoogleAuthUrl();
    res.redirect(googleAuthUrl); // Directs user to Google's OAuth login page
  }

  /**
   * Handles the Google OAuth callback
   * @param {string} code Authorization code from Google
   * @param {Response} res Express Response object
   */
  @Version('1')
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiResponse({
    status: 200,
    description: 'Login successful and JWT generated',
  })
  @ApiResponse({ status: 400, description: 'Authorization code not provided' })
  @ApiResponse({
    status: 500,
    description: 'Failed to authenticate with Google',
  })
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ): Promise<Response> {
    if (!code) {
      throw new BadRequestException('Authorization code not provided');
    }

    try {
      // Exchange the code for Google OAuth tokens
      const tokens = await this.authService.getGoogleTokens(code);
      const googleUser = await this.authService.verifyGoogleIdToken(
        tokens.id_token,
      );

      // Store Google user data in the database
      const user=await this.authService.storeGoogleUserData(googleUser);
      const accessToken = tokens.access_token;

      // Set JWT token as a cookie
      res.cookie('jwt', accessToken, { httpOnly: true });

      // Return response with the JWT token
      return res.status(HttpStatus.OK).json({
        message: 'Login successful',
        token: accessToken,
        userId:user.user.id
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to authenticate with Google',
      );
    }
  }

  /**
   * Logs out the user and clears JWT cookie
   * @param {Response} res Express Response object
   */
  @Version('1')
  @ApiOperation({ summary: 'Logout user and clear JWT' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @Post('logout')
  async logout(@Res() res: Response): Promise<Response> {
    res.clearCookie('jwt'); // Clear the JWT cookie
    return res.status(HttpStatus.OK).json({ message: 'Logout successful' });
  }
}
