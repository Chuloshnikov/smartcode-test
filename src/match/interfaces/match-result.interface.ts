import { Booking } from "../entities/booking.entity";
import { Claim } from "../entities/claim.entity";

export interface MatchResult {
  booking: string;
  claim: string;
  mismatch?: string[];
}

export interface PotentialMatch {
  booking: Booking;
  claim: Claim;
  score: number;
  mismatch: string[];
}