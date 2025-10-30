import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MatchService } from './match.service';

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async match(
    @Body() body: any,
  ): Promise<any> {
    const matches = await this.matchService.matchBookingsWithClaims(
      body.bookings,
      body.claims,
    );

    return { matches };
  }
}