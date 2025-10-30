import { IsString, IsDateString } from 'class-validator';

export class Booking {
  @IsString()
  id: string;

  @IsString()
  patient: string;

  @IsString()
  test: string;

  @IsString()
  insurance: string;

  @IsDateString()
  reservationDate: string;
}