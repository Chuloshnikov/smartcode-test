import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Booking } from '../entities/booking.entity';
import { Claim } from '../entities/claim.entity';

export class MatchRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Booking)
  bookings: Booking[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Claim)
  claims: Claim[];
}