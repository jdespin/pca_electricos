import 'package:sqflite/sqflite.dart';
import '../db/app_database.dart';
import '../models/order_report.dart';

class OrderReportRepository {
  OrderReportRepository._();
  static final OrderReportRepository instance = OrderReportRepository._();

  Future<OrderReport?> findByOrderId(int orderId) async {
    final Database db = await AppDatabase.instance.db;
    final rows = await db.query(
      'order_reports',
      where: 'order_id = ?',
      whereArgs: [orderId],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return OrderReport.fromMap(rows.first);
  }

  
  Future<void> save(OrderReport report) async {
    final Database db = await AppDatabase.instance.db;
    final existing = await findByOrderId(report.orderId);
    if (existing == null) {
      await db.insert('order_reports', report.toMap());
    } else {
      await db.update(
        'order_reports',
        {
          'observaciones': report.observaciones,
          'materiales': report.materiales,
          'trabajo_realizado': report.trabajoRealizado,
          'updated_at': DateTime.now().millisecondsSinceEpoch,
        },
        where: 'order_id = ?',
        whereArgs: [report.orderId],
      );
    }
  }
}
