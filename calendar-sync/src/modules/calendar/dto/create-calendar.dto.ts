import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCalendarDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  googleCalendarId: string;

  @IsNotEmpty()
  @IsString()
  summary: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  channelId: string;

  @IsOptional()
  @IsString()
  colorId?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  foregroundColor?: string;

  @IsOptional()
  selected?: boolean;

  @IsOptional()
  @IsString()
  accessRole?: string;

  @IsOptional()
  defaultReminders?: any[]; // Adjust the type as needed

  @IsOptional()
  conferenceProperties?: any; // Adjust the type as needed
}
