import { IsNotEmpty, IsString, IsOptional, IsDate, IsBoolean } from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  googleEventId: string;

  @IsNotEmpty()
  @IsString()
  calendarId: string;

  @IsNotEmpty()
  @IsString()
  summary: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDate()
  startTime: Date;

  @IsNotEmpty()
  @IsDate()
  endTime: Date;

  @IsOptional()
  @IsString()
  location?: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  @IsString()
  htmlLink: string;

  @IsNotEmpty()
  @IsString()
  iCalUID: string;

  @IsNotEmpty()
  sequence: number;

  @IsOptional()
  @IsBoolean()
  useDefaultReminders?: boolean;

  @IsNotEmpty()
  @IsString()
  eventType: string;

  @IsOptional()
  @IsString()
  timeZone?: string;
}
