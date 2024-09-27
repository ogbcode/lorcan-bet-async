import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Auth } from 'src/modules/auth/entities/auth.entity';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  auth?:Auth
}
