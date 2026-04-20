import 'package:sqflite/sqflite.dart';
import '../db/app_database.dart';
import '../models/equipment_photo.dart';

class EquipmentPhotoRepository {
  EquipmentPhotoRepository._();
  static final EquipmentPhotoRepository instance = EquipmentPhotoRepository._();

  Future<List<EquipmentPhoto>> listByOrderAndType(
      int orderId, String equipmentType) async {
    final Database db = await AppDatabase.instance.db;
    final rows = await db.query(
      'equipment_photos',
      where: 'order_id = ? AND equipment_type = ?',
      whereArgs: [orderId, equipmentType],
      orderBy: 'is_required DESC, created_at ASC',
    );
    return rows.map(EquipmentPhoto.fromMap).toList();
  }

  Future<int> add(EquipmentPhoto photo) async {
    final Database db = await AppDatabase.instance.db;
    return db.insert('equipment_photos', photo.toMap());
  }

  
  Future<int> upsertLabeled(EquipmentPhoto photo) async {
    final Database db = await AppDatabase.instance.db;
    final rows = await db.query(
      'equipment_photos',
      where:
          'order_id = ? AND equipment_type = ? AND photo_label = ? AND is_required = 1',
      whereArgs: [photo.orderId, photo.equipmentType, photo.photoLabel],
      limit: 1,
    );
    if (rows.isNotEmpty) {
      final id = rows.first['id'] as int;
      await db.delete('equipment_photos',
          where: 'id = ?', whereArgs: [id]);
    }
    return db.insert('equipment_photos', photo.toMap());
  }

  Future<int> delete(int id) async {
    final Database db = await AppDatabase.instance.db;
    return db.delete('equipment_photos', where: 'id = ?', whereArgs: [id]);
  }

  Future<int> updateLabel(int id, String label) async {
    final Database db = await AppDatabase.instance.db;
    return db.update('equipment_photos', {'photo_label': label},
        where: 'id = ?', whereArgs: [id]);
  }
}
