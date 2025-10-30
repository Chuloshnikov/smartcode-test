import { Module } from '@nestjs/common';
import { MatchController } from './match/match.controller';
import { MatchService } from './match/match.service';

@Module({
  imports: [],
  controllers: [MatchController],
  providers: [MatchService],
})
export class AppModule {}
