import { Test, TestingModule } from '@nestjs/testing';
import { MatchService } from './match.service';
import { Booking } from './entities/booking.entity';
import { Claim } from './entities/claim.entity';

describe('MatchService', () => {
  let service: MatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchService],
    }).compile();

    service = module.get<MatchService>(MatchService);
  });

  describe('matchBookingsWithClaims', () => {
    it('should match bookings with claims correctly', async () => {
      const bookings: Booking[] = [
        {
          id: 'booking_1',
          patient: 'patient_1',
          test: 'test_1',
          insurance: 'AON',
          reservationDate: '2025-05-16T11:00:00.000Z',
        },
        {
          id: 'booking_7',
          patient: 'patient_7',
          test: 'test_1',
          insurance: 'AON',
          reservationDate: '2025-05-15T10:30:00.000Z',
        },
        {
          id: 'booking_9',
          patient: 'patient_8',
          test: 'test_1',
          insurance: 'FASCHIM',
          reservationDate: '2025-05-15T10:30:00.000Z',
        },
      ];

      const claims: Claim[] = [
        {
          id: 'claim_1',
          medicalServiceCode: 'medical_service_1',
          bookingDate: '2025-05-15T10:33:00.000Z',
          insurance: 'AON',
          patient: 'patient_1',
        },
        {
          id: 'claim_9',
          medicalServiceCode: 'medical_service_2',
          bookingDate: '2025-05-15T10:31:00.000Z',
          insurance: 'AON',
          patient: 'patient_8',
        },
        {
          id: 'claim_10',
          medicalServiceCode: 'medical_service_2',
          bookingDate: '2025-05-15T00:00:00.000Z',
          insurance: 'FASCHIM',
          patient: 'patient_8',
        },
      ];

      const result = await service.matchBookingsWithClaims(bookings, claims);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        booking: 'booking_9',
        claim: 'claim_10',
        mismatch: ['time', 'test'],
      });
    });

    it('should return empty array when no matches found', async () => {
      const bookings: Booking[] = [
        {
          id: 'booking_1',
          patient: 'patient_99',
          test: 'test_1',
          insurance: 'AON',
          reservationDate: '2025-05-16T11:00:00.000Z',
        },
      ];

      const claims: Claim[] = [
        {
          id: 'claim_1',
          medicalServiceCode: 'medical_service_1',
          bookingDate: '2025-05-15T10:33:00.000Z',
          insurance: 'AON',
          patient: 'patient_1',
        },
      ];

      const result = await service.matchBookingsWithClaims(bookings, claims);
      expect(result).toHaveLength(0);
    });

    it('should prioritize matches with higher scores', async () => {
      const bookings: Booking[] = [
        {
          id: 'booking_1',
          patient: 'patient_1',
          test: 'test_1',
          insurance: 'AON',
          reservationDate: '2025-05-15T10:30:00.000Z',
        },
      ];

      const claims: Claim[] = [
        {
          id: 'claim_1',
          medicalServiceCode: 'medical_service_1',
          bookingDate: '2025-05-15T10:30:00.000Z',
          insurance: 'AON',
          patient: 'patient_1',
        },
        {
          id: 'claim_2',
          medicalServiceCode: 'medical_service_2',
          bookingDate: '2025-05-15T10:30:00.000Z',
          insurance: 'AON',
          patient: 'patient_1',
        },
      ];

      const result = await service.matchBookingsWithClaims(bookings, claims);
      
      // claim_1 должен иметь более высокий score из-за совпадения test
      expect(result[0].claim).toBe('claim_1');
    });
  });

  describe('passesMandatoryCriteria', () => {
    it('should return true when patient and date match', () => {
      const booking: Booking = {
        id: 'booking_1',
        patient: 'patient_1',
        test: 'test_1',
        insurance: 'AON',
        reservationDate: '2025-05-15T10:30:00.000Z',
      };

      const claim: Claim = {
        id: 'claim_1',
        medicalServiceCode: 'medical_service_1',
        bookingDate: '2025-05-15T14:45:00.000Z', // разное время, но та же дата
        insurance: 'AON',
        patient: 'patient_1',
      };

      const result = (service as any).passesMandatoryCriteria(booking, claim);
      expect(result).toBe(true);
    });

    it('should return false when patient does not match', () => {
      const booking: Booking = {
        id: 'booking_1',
        patient: 'patient_1',
        test: 'test_1',
        insurance: 'AON',
        reservationDate: '2025-05-15T10:30:00.000Z',
      };

      const claim: Claim = {
        id: 'claim_1',
        medicalServiceCode: 'medical_service_1',
        bookingDate: '2025-05-15T14:45:00.000Z',
        insurance: 'AON',
        patient: 'patient_2', // другой пациент
      };

      const result = (service as any).passesMandatoryCriteria(booking, claim);
      expect(result).toBe(false);
    });
  });
});