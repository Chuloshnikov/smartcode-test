import { IsString, IsDateString } from 'class-validator';

export class Claim {
  @IsString()
  id: string;

  @IsString()
  medicalServiceCode: string;

  @IsDateString()
  bookingDate: string;

  @IsString()
  insurance: string;

  @IsString()
  patient: string;
}