import { Injectable } from '@nestjs/common';
import { Booking } from './entities/booking.entity';
import { Claim } from './entities/claim.entity';
import { MatchResult, PotentialMatch } from './interfaces/match-result.interface';
import { TESTS_MAP } from '../common/constants/tests-map.constants';

@Injectable()
export class MatchService {
  private readonly testsMapDict: Record<string, string>;

  constructor() {
    // Преобразуем массив TESTS_MAP в объект для быстрого доступа
    this.testsMapDict = TESTS_MAP.reduce((acc, mapping) => {
      acc[mapping.bookingTestId] = mapping.claimTestId;
      return acc;
    }, {});
  }

  // Основная функция для матчинга
  async matchBookingsWithClaims(bookings: Booking[], claims: Claim[]): Promise<MatchResult[]> {
    const potentialMatches: PotentialMatch[] = [];

    // Группируем bookings по patient для быстрого доступа
    const bookingsByPatient = new Map<string, Booking[]>();
    for (const booking of bookings) {
      if (!bookingsByPatient.has(booking.patient)) {
        bookingsByPatient.set(booking.patient, []);
      }
      bookingsByPatient.get(booking.patient)!.push(booking);
    }

    // Итерируем только по связанным букингам
    for (const claim of claims) {
      const relatedBookings = bookingsByPatient.get(claim.patient);
      if (!relatedBookings) continue;

      for (const booking of relatedBookings) {
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

    // Сортируем по убыванию score
    potentialMatches.sort((a, b) => b.score - a.score);

    // Применяем жадный алгоритм для выбора 1:1 совпадений
    return this.performGreedyMatching(potentialMatches);
  }

  // Проверка базовых критериев совпадения
  private passesMandatoryCriteria(booking: Booking, claim: Claim): boolean {
    const bookingDate = new Date(booking.reservationDate).toISOString().split('T')[0];
    const claimDate = new Date(claim.bookingDate).toISOString().split('T')[0];
    return booking.patient === claim.patient && bookingDate === claimDate;
  }

  // Подсчёт очков совпадения
  private calculateMatchScore(booking: Booking, claim: Claim): { score: number; mismatch: string[] } {
    let score = 0;
    const mismatch: string[] = [];

    // Проверяем тест через мап
    const mappedTest = this.testsMapDict[booking.test];
    if (mappedTest === claim.medicalServiceCode) {
      score += 1;
    } else {
      mismatch.push('test');
    }

    // Проверяем время (часы и минуты)
    const bookingTime = this.extractTime(booking.reservationDate);
    const claimTime = this.extractTime(claim.bookingDate);
    if (bookingTime && claimTime && bookingTime === claimTime) {
      score += 1;
    } else {
      mismatch.push('time');
    }

    // Проверяем страховую компанию
    if (booking.insurance === claim.insurance) {
      score += 1;
    } else {
      mismatch.push('insurance');
    }

    return { score, mismatch };
  }

  // Вспомогательная функция для извлечения времени
  private extractTime(dateString: string): string | null {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;

      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      const time = `${hours}:${minutes}`;
      return time === '00:00' ? null : time;
    } catch {
      return null;
    }
  }

  // Жадный алгоритм выбора наилучших совпадений
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