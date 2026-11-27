import { describe, expect, it } from 'vitest';
import { EmitWorkReportedService } from '../../src/Repair/Application/Services/EmitWorkReportedService';
import { RepairWorkOrder } from '../../src/Repair/Domain/Entities/RepairWorkOrder';
import { WorkOrderState } from '../../src/Repair/Domain/ValueObjects/WorkOrderState';

describe('EmitWorkReportedService (сторона постачальника)', () => {
  it('1. Подання звіту збільшує ревізію наряду й зберігає код REPORTED', () => {
    const order = RepairWorkOrder.create('33333333-3333-3333-3333-333333333333', 1);
    const message = new EmitWorkReportedService().emit(
      order,
      '44444444-4444-4444-4444-444444444444',
      'Замінено підшипник'
    );

    expect(message.WorkOrderId).toBe(order.id);
    expect(message.Revision).toBe(2);
    expect(message.StateCode).toBe(WorkOrderState.Reported);
    expect(message.Summary).toBe('Замінено підшипник');
  });

  it('2. Порожній ідентифікатор наряду відхиляється', () => {
    expect(() => RepairWorkOrder.create('', 1)).toThrowError('Ідентифікатор наряду не може бути порожнім.');
  });
});
