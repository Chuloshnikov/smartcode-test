import { Injectable } from '@nestjs/common';
import { Booking } from './entities/booking.entity';
import { Claim } from './entities/claim.entity';
import { MatchResult, PotentialMatch } from './interfaces/match-result.interface';
import { TESTS_MAP } from '../common/constants/tests-map.constants';

@Injectable()
export class MatchService {
  private readonly testsMapDict: Record<string, string>;

  constructor() {
    // преобразователь массива для быстрого доступа по bookingTestId
    this.testsMapDict = TESTS_MAP.reduce((acc, mapping) => {
      acc[mapping.bookingTestId] = mapping.claimTestId;
      return acc;
    }, {});
  }


  //получаем массивы бронирований и заявок и возвращаем список совпадений
  async matchBookingsWithClaims(bookings: Booking[], claims: Claim[]): Promise<MatchResult[]> {
    const potentialMatches: PotentialMatch[] = [];

    // Выявляем все портенциальнфе совпадения 
    for (const booking of bookings) {
      for (const claim of claims) {
        if (this.passesMandatoryCriteria(booking, claim)) {
          const { score, mismatch } = this.calculateMatchScore(booking, claim);
          potentialMatches.push({
            booking,
            claim,
            score,
            mismatch,
          });
        }
      }
    }

    // Сортировка по убыванию в score
    potentialMatches.sort((a, b) => b.score - a.score);

    // Жадный алгоритм для 1:1 матчинга Greed Algo
    return this.performGreedyMatching(potentialMatches);
  }

  private passesMandatoryCriteria(booking: Booking, claim: Claim): boolean {
    // Обязательные критерии: patient и дата (без таймфрейма) должны совпадать
    const bookingDate = new Date(booking.reservationDate).toISOString().split('T')[0];
    const claimDate = new Date(claim.bookingDate).toISOString().split('T')[0];

    return booking.patient === claim.patient && bookingDate === claimDate;
  }

  private calculateMatchScore(booking: Booking, claim: Claim): { score: number; mismatch: string[] } {
    let score = 0;
    const mismatch: string[] = [];

    // Тест через маппинг
    const mappedTest = this.testsMapDict[booking.test];
    if (mappedTest === claim.medicalServiceCode) {
      score += 1;
    } else {
      mismatch.push('test');
    }

    // Точное время (часы и минуты)
    const bookingTime = this.extractTime(booking.reservationDate);
    const claimTime = this.extractTime(claim.bookingDate);
    
    if (bookingTime && claimTime && bookingTime === claimTime) {
      score += 1;
    } else {
      mismatch.push('time');
    }

    // Страховая компания
    if (booking.insurance === claim.insurance) {
      score += 1;
    } else {
      mismatch.push('insurance');
    }

    return { score, mismatch };
  }

  private extractTime(dateString: string): string | null {
    try {
      const date = new Date(dateString);
      // Проверяем, что дата валидна и время не равно 00:00:00 (что может означать отсутствие времени)
      if (isNaN(date.getTime())) {
        return null;
      }
      
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      const time = `${hours}:${minutes}`;
      
      // Если время 00:00, считаем что время не указано
      return time === '00:00' ? null : time;
    } catch {
      return null;
    }
  }

  private performGreedyMatching(potentialMatches: PotentialMatch[]): MatchResult[] {
    const results: MatchResult[] = [];
    const matchedBookings = new Set<string>();
    const matchedClaims = new Set<string>();

    for (const match of potentialMatches) {
      if (!matchedBookings.has(match.booking.id) && !matchedClaims.has(match.claim.id)) {
        const result: MatchResult = {
          booking: match.booking.id,
          claim: match.claim.id,
        };

        // Добавляем mismatch только если есть несовпадения
        if (match.mismatch.length > 0) {
          result.mismatch = match.mismatch;
        }

        results.push(result);
        matchedBookings.add(match.booking.id);
        matchedClaims.add(match.claim.id);
      }
    }

    return results;
  }
}

//Как-то так