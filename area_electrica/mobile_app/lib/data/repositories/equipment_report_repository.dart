import 'package:sqflite/sqflite.dart';
import '../db/app_database.dart';
import '../models/equipment_report.dart';

class EquipmentReportRepository {
  EquipmentReportRepository._();
  static final EquipmentReportRepository instance = EquipmentReportRepository._();

  Future<EquipmentReport?> findByOrderAndType(
      int orderId, String equipmentType) async {
    final Database db = await AppDatabase.instance.db;
    final rows = await db.query(
      'equipment_reports',
      where: 'order_id = ? AND equipment_type = ?',
      whereArgs: [orderId, equipmentType],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return EquipmentReport.fromMap(rows.first);
  }

  Future<List<EquipmentReport>> listByOrderId(int orderId) async {
    final Database db = await AppDatabase.instance.db;
    final rows = await db.query(
      'equipment_reports',
      where: 'order_id = ?',
      whereArgs: [orderId],
    );
    return rows.map(EquipmentReport.fromMap).toList();
  }

  Future<int> save(EquipmentReport report) async {
    final Database db = await AppDatabase.instance.db;
    final existing = await findByOrderAndType(
        report.orderId, report.equipmentType);
    if (existing != null) {
      return db.update(
        'equipment_reports',
        report.copyWith(id: existing.id).toMap(),
        where: 'id = ?',
        whereArgs: [existing.id],
      );
    }
    return db.insert('equipment_reports', report.toMap());
  }
}
