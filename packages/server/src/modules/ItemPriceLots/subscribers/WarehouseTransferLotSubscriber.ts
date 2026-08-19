import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import {
  IWarehouseTransferCreated,
  IWarehouseTransferDeletePayload,
  IWarehouseTransferInitiatedPayload,
  IWarehouseTransferTransferredPayload,
} from '@/modules/Warehouses/Warehouse.types';
import { WarehouseTransferLotService } from '../WarehouseTransferLot.service';

/**
 * Keeps item price-lots in sync with warehouse transfers:
 * Initiate = stock leaves the source lot; Transferred = stock joins (or
 * creates) the matching lot at the destination warehouse.
 */
@Injectable()
export class WarehouseTransferLotSubscriber {
  constructor(private readonly transferLots: WarehouseTransferLotService) {}

  @OnEvent(events.warehouseTransfer.onCreated)
  public async handleCreated({
    warehouseTransfer,
    trx,
  }: IWarehouseTransferCreated) {
    if (warehouseTransfer.transferInitiatedAt) {
      await this.transferLots.applyInitiated(warehouseTransfer, trx);
    }
    if (warehouseTransfer.transferDeliveredAt) {
      await this.transferLots.applyTransferred(warehouseTransfer, trx);
    }
  }

  @OnEvent(events.warehouseTransfer.onInitiated)
  public async handleInitiated({
    warehouseTransfer,
    trx,
  }: IWarehouseTransferInitiatedPayload) {
    await this.transferLots.applyInitiated(warehouseTransfer, trx);
  }

  @OnEvent(events.warehouseTransfer.onTransferred)
  public async handleTransferred({
    warehouseTransfer,
    trx,
  }: IWarehouseTransferTransferredPayload) {
    await this.transferLots.applyTransferred(warehouseTransfer, trx);
  }

  @OnEvent(events.warehouseTransfer.onDelete)
  public async handleDeleted({
    oldWarehouseTransfer,
    trx,
  }: IWarehouseTransferDeletePayload) {
    await this.transferLots.revert(oldWarehouseTransfer, trx);
  }
}
