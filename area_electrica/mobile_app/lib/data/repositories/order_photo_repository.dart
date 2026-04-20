import 'package:sqflite/sqflite.dart';
import '../db/app_database.dart';
import '../models/order_photo.dart';

class OrderPhotoRepository {
  OrderPhotoRepository._();
  static final OrderPhotoRepository instance = OrderPhotoRepository._();

  Future<List<OrderPhoto>> listByOrderId(int orderId) async {
    final Database db = await AppDatabase.instance.db;
    final rows = await db.query(
      'order_photos',
      where: 'order_id = ?',
      whereArgs: [orderId],
      orderBy: 'created_at ASC',
    );
    return rows.map(OrderPhoto.fromMap).toList();
  }

  Future<int> add(OrderPhoto photo) async {
    final Database db = await AppDatabase.instance.db;
    return db.insert('order_photos', photo.toMap());
  }

  Future<int> delete(int id) async {
    final Database db = await AppDatabase.instance.db;
    return db.delete('order_photos', where: 'id = ?', whereArgs: [id]);
  }
}
