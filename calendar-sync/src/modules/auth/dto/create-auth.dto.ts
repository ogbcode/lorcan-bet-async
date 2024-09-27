import { Type } from 'class-transformer';
import { IsString, IsOptional, IsEmail, ValidateNested } from 'class-validator';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';

export class CreateAuthDto {
 
  @IsString()
  googleId: string;

  @IsEmail()
  email: string;
  
  @ValidateNested()
  @Type(() => CreateUserDto)
  user: CreateUserDto;
  
}
