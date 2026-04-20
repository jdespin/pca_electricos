import 'package:sqflite/sqflite.dart';
import '../db/app_database.dart';
import '../models/technician.dart';

class TechnicianRepository {
  TechnicianRepository._();
  static final TechnicianRepository instance = TechnicianRepository._();

  Future<int> create(Technician tech) async {
    final Database db = await AppDatabase.instance.db;
    return db.insert('technicians', tech.toMap());
  }

  Future<Technician?> findByUsuarioStrnombre(String usuarioStrnombre) async {
    final Database db = await AppDatabase.instance.db;
    final rows = await db.query(
      'technicians',
      where: 'usuario_strnombre = ?',
      whereArgs: [usuarioStrnombre],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return Technician.fromMap(rows.first);
  }

  Future<List<Technician>> listAll() async {
    final Database db = await AppDatabase.instance.db;
    final rows = await db.query('technicians', orderBy: 'created_at DESC');
    return rows.map(Technician.fromMap).toList();
  }
}
