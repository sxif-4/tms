import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { isDateKey, utcMidnight } from '../../shared/utils/park-date';
import { CreateParkTicketDto } from './dto/create-park-ticket.dto';
import { GateSaleDto } from './dto/gate-sale.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { ParkTicketsService } from './park-tickets.service';
import {
  type ParkTicketChannel,
  type ParkTicketRow,
  type ParkTicketStatus,
} from './park-tickets.repository';

/**
 * Staff sales/check-in plus the two visitor-facing actions (buy a ticket, list
 * mine), which bare `@Roles()` overrides open to any authenticated user — the
 * same arrangement hotel-bookings uses.
 *
 * Route order matters: `/mine` and `/lookup/:reference` are declared before
 * `/:id`, or Nest would match them as an id.
 */
@Controller('park-tickets')
@Roles(Role.Admin, Role.ParkStaff)
export class ParkTicketsController {
  constructor(private readonly ticketsService: ParkTicketsService) {}

  @Get()
  findAll(
    @Query('visitDate') visitDate?: string,
    @Query('status') status?: ParkTicketStatus,
    @Query('channel') channel?: ParkTicketChannel,
    @Query('q') q?: string,
  ): Promise<ParkTicketRow[]> {
    return this.ticketsService.listAll({
      visitDate: parseVisitDate(visitDate),
      status,
      channel,
      q,
    });
  }

  @Get('mine')
  @Roles()
  findMine(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ParkTicketRow[]> {
    return this.ticketsService.getMine(currentUser.id);
  }

  @Post()
  @Roles()
  purchase(
    @Body() dto: CreateParkTicketDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ParkTicketRow> {
    return this.ticketsService.purchase(currentUser, dto);
  }

  @Post('gate-sale')
  gateSale(
    @Body() dto: GateSaleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ParkTicketRow> {
    return this.ticketsService.gateSale(currentUser, dto);
  }

  // Checking in mutates an existing ticket rather than creating anything, so
  // this answers 200, not Nest's default 201 for POST.
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validate(
    @Body() dto: ValidateTicketDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ParkTicketRow> {
    return this.ticketsService.validate(currentUser, dto);
  }

  @Get('lookup/:reference')
  lookup(@Param('reference') reference: string): Promise<ParkTicketRow> {
    return this.ticketsService.lookup(reference);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ParkTicketRow> {
    return this.ticketsService.findById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ParkTicketRow> {
    return this.ticketsService.updateStatus(currentUser, id, dto);
  }
}

function parseVisitDate(value?: string): Date | undefined {
  if (!value) return undefined;
  if (!isDateKey(value)) {
    throw new BadRequestException('"visitDate" must be a date like 2026-07-15');
  }
  return utcMidnight(value);
}
