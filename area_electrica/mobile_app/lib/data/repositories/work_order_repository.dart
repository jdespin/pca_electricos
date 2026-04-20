import 'package:sqflite/sqflite.dart';
import '../db/app_database.dart';
import '../models/work_order.dart';

class WorkOrderRepository {
  WorkOrderRepository._();
  static final WorkOrderRepository instance = WorkOrderRepository._();

  Future<int> create(WorkOrder order) async {
    final Database db = await AppDatabase.instance.db;
    return db.insert('work_orders', order.toMap());
  }

  Future<List<WorkOrder>> listByStatus(String status) async {
    final Database db = await AppDatabase.instance.db;
    final where = status == 'evaluada'
        ? "status = ? AND calificacion IS NOT NULL"
        : 'status = ?';
    final rows = await db.query(
      'work_orders',
      where: where,
      whereArgs: [status],
      orderBy: 'updated_at DESC',
    );
    return rows.map(WorkOrder.fromMap).toList();
  }

  Future<List<WorkOrder>> listAll() async {
    final Database db = await AppDatabase.instance.db;
    final rows = await db.query('work_orders', orderBy: 'created_at DESC');
    return rows.map(WorkOrder.fromMap).toList();
  }

  Future<int> updateStatus({
    required int id,
    required String status,
  }) async {
    final Database db = await AppDatabase.instance.db;
    return db.update(
      'work_orders',
      {
        'status': status,
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      },
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> delete(int id) async {
    final Database db = await AppDatabase.instance.db;
    return db.delete('work_orders', where: 'id = ?', whereArgs: [id]);
  }

  
  Future<WorkOrder> findOrCreateByBackendId({
    required int idordenBackend,
    required String title,
    required String description,
    required String tipo,
    required bool esLider,
    required String status,
    String? supervisorNombre,
  }) async {
    final Database db = await AppDatabase.instance.db;
    final rows = await db.query(
      'work_orders',
      where: 'idorden_backend = ?',
      whereArgs: [idordenBackend],
      limit: 1,
    );
    if (rows.isNotEmpty) {
      final existing = WorkOrder.fromMap(rows.first);
      if (supervisorNombre != null && existing.supervisorNombre != supervisorNombre) {
        await db.update(
          'work_orders',
          {'supervisor_nombre': supervisorNombre},
          where: 'idorden_backend = ?',
          whereArgs: [idordenBackend],
        );
        return existing.copyWith(supervisorNombre: supervisorNombre);
      }
      return existing;
    }

    final now = DateTime.now().millisecondsSinceEpoch;
    final newOrder = WorkOrder(
      idordenBackend: idordenBackend,
      title: title,
      description: description,
      status: status,
      tipo: tipo,
      esLider: esLider,
      createdAt: now,
      updatedAt: now,
      supervisorNombre: supervisorNombre,
    );
    final localId = await db.insert('work_orders', newOrder.toMap());
    return newOrder.copyWith(id: localId);
  }

  
  Future<int> updateEvaluacion({
    required int idordenBackend,
    required String? calificacion,
    required String? observacion,
  }) async {
    final Database db = await AppDatabase.instance.db;
    return db.update(
      'work_orders',
      {
        'status': 'evaluada',
        'calificacion': calificacion,
        'observacion': observacion,
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      },
      where: 'idorden_backend = ?',
      whereArgs: [idordenBackend],
    );
  }

  Future<int> markSincronizado(int id) async {
    final Database db = await AppDatabase.instance.db;
    return db.update(
      'work_orders',
      {'sincronizado': 1, 'updated_at': DateTime.now().millisecondsSinceEpoch},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<List<WorkOrder>> listSyncable() async {
    final Database db = await AppDatabase.instance.db;
    final rows = await db.query(
      'work_orders',
      where: "idorden_backend IS NOT NULL AND status = 'finalizada' AND (sincronizado = 0 OR sincronizado IS NULL)",
      orderBy: 'created_at DESC',
    );
    return rows.map(WorkOrder.fromMap).toList();
  }
}
